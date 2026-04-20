import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { embedText, cosineSimilarity } from '@/lib/ai/embedding'

export const MEMORY_KINDS = ['preference', 'habit', 'goal', 'blindspot', 'fact'] as const
export type MemoryKind = (typeof MEMORY_KINDS)[number]

export interface MemoryInput {
  kind: MemoryKind
  content: string
  importance?: number // 1-5
  source?: string // manual | extracted-refine | derived
  sourceRef?: string
}

export interface MemoryRecord {
  id: string
  kind: MemoryKind
  content: string
  importance: number
  source: string
  sourceRef: string | null
  hasEmbedding: boolean
  lastUsedAt: Date | null
  createdAt: Date
}

export async function createMemory(userId: string, input: MemoryInput): Promise<MemoryRecord> {
  const embedding = await embedText(userId, input.content)
  const m = await prisma.memory.create({
    data: {
      userId,
      kind: input.kind,
      content: input.content.trim(),
      embedding: embedding ?? undefined,
      importance: Math.min(5, Math.max(1, input.importance ?? 3)),
      source: input.source ?? 'manual',
      sourceRef: input.sourceRef,
    },
  })
  return toRecord(m)
}

export async function listMemories(userId: string): Promise<MemoryRecord[]> {
  const rows = await prisma.memory.findMany({
    where: { userId },
    orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
  })
  return rows.map(toRecord)
}

export async function deleteMemory(userId: string, id: string) {
  await prisma.memory.deleteMany({ where: { id, userId } })
}

export async function updateMemory(
  userId: string,
  id: string,
  patch: Partial<Pick<MemoryRecord, 'content' | 'kind' | 'importance'>>,
) {
  // 更新 content 时重跑 embedding
  const data: Prisma.MemoryUpdateManyMutationInput = {
    content: patch.content,
    kind: patch.kind,
    importance: patch.importance != null ? Math.min(5, Math.max(1, patch.importance)) : undefined,
  }

  if (patch.content) {
    const embedding = await embedText(userId, patch.content)
    data.embedding = embedding ?? Prisma.DbNull
  }

  const m = await prisma.memory.updateMany({ where: { id, userId }, data })
  return m.count
}

/**
 * 按语义相似度检索 top-K 记忆。
 * 若 embed 失败或用户无 embedding 记忆,降级为 importance + 近期。
 */
export async function searchMemories(
  userId: string,
  queryText: string,
  k = 5,
): Promise<MemoryRecord[]> {
  const queryVec = await embedText(userId, queryText)
  const rows = await prisma.memory.findMany({ where: { userId } })

  if (!queryVec) {
    // 降级
    const ranked = [...rows]
      .sort((a, b) => b.importance - a.importance || b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, k)
    // 异步更新 lastUsedAt (不阻塞)
    touchMemories(ranked.map((r) => r.id)).catch(() => {})
    return ranked.map(toRecord)
  }

  const scored = rows
    .map((r) => {
      const vec = r.embedding as number[] | null
      const sim = Array.isArray(vec) ? cosineSimilarity(queryVec, vec) : -1
      // 有 embedding 的按 sim 排,无的按一个低基线分
      const score = sim >= 0 ? sim + r.importance * 0.02 : -0.2 + r.importance * 0.04
      return { row: r, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.row)

  touchMemories(scored.map((r) => r.id)).catch(() => {})
  return scored.map(toRecord)
}

async function touchMemories(ids: string[]) {
  if (ids.length === 0) return
  await prisma.memory.updateMany({
    where: { id: { in: ids } },
    data: { lastUsedAt: new Date() },
  })
}

function toRecord(m: {
  id: string
  kind: string
  content: string
  importance: number
  source: string
  sourceRef: string | null
  embedding: unknown
  lastUsedAt: Date | null
  createdAt: Date
}): MemoryRecord {
  return {
    id: m.id,
    kind: m.kind as MemoryKind,
    content: m.content,
    importance: m.importance,
    source: m.source,
    sourceRef: m.sourceRef,
    hasEmbedding: Array.isArray(m.embedding) && (m.embedding as unknown[]).length > 0,
    lastUsedAt: m.lastUsedAt,
    createdAt: m.createdAt,
  }
}

/**
 * 把记忆列表渲染为 system prompt 片段。
 * 中英双语,按 kind 分组,排除空列表。
 */
export function memoriesToPromptBlock(memories: MemoryRecord[], locale: 'zh-CN' | 'en-US'): string {
  if (memories.length === 0) return ''

  const groups = new Map<MemoryKind, string[]>()
  for (const m of memories) {
    if (!groups.has(m.kind)) groups.set(m.kind, [])
    groups.get(m.kind)!.push(m.content)
  }

  const kindLabelZh: Record<MemoryKind, string> = {
    preference: '偏好',
    habit: '习惯',
    goal: '长期目标',
    blindspot: '盲点 / 常见卡点',
    fact: '事实',
  }
  const kindLabelEn: Record<MemoryKind, string> = {
    preference: 'Preferences',
    habit: 'Habits',
    goal: 'Goals',
    blindspot: 'Blindspots',
    fact: 'Facts',
  }
  const labels = locale === 'en-US' ? kindLabelEn : kindLabelZh
  const heading = locale === 'en-US' ? '## What I remember about you' : '## 我记得的你'
  const intro =
    locale === 'en-US'
      ? 'Use this sparingly, only if it helps the question feel less generic. Never quote these lines back at the user.'
      : '基于以下画像调整提问,不要把这些话直接念给用户听。'

  const parts: string[] = [heading, intro]
  for (const kind of MEMORY_KINDS) {
    const items = groups.get(kind)
    if (!items || items.length === 0) continue
    parts.push(`**${labels[kind]}**`)
    for (const item of items) parts.push(`- ${item}`)
  }
  return parts.join('\n')
}
