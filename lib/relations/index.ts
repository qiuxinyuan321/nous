/**
 * Stage 0 · Relations · 主入口
 * -----------------------------------------------------------
 * 给定任意实体 (type, id, userId)，并发地取出 6 个维度的关联项：
 *   outgoing / incoming / siblings / tagPeers / temporal / semantic
 *
 * 设计原则：
 * 1. fail-soft · 任何维度失败只让该维度空，不抛
 * 2. 六维并发 · Promise.allSettled 拿结果
 * 3. 语义维度按需开关 · 无 embedding 时静默返回 []
 * 4. 不跨用户 · 所有查询带 userId 过滤（Memory/Idea/Note/Reflection 直接带，Message/Task 走 idea.userId / milestone.plan.idea.userId）
 */

import { prisma } from '@/lib/db'
import { embedText } from '@/lib/ai/embedding'
import {
  toIdeaRef,
  toMemoryRef,
  toMessageRef,
  toNoteRef,
  toReflectionRef,
  toTaskRef,
} from './serialize'
import { getSemanticPeers, getTagPeers, getTemporalPeers } from './shared'
import type { EntityRef, GetRelatedOptions, RelatedBundle } from './types'
import { EMPTY_BUNDLE } from './types'

export type { EntityRef, EntityType, GetRelatedOptions, RelatedBundle } from './types'
export { getSemanticPeers, getTagPeers, getTemporalPeers, getSemanticPeersByText } from './shared'

export async function getRelatedBundle(opts: GetRelatedOptions): Promise<RelatedBundle> {
  switch (opts.type) {
    case 'idea':
      return buildIdeaBundle(opts)
    case 'note':
      return buildNoteBundle(opts)
    case 'task':
      return buildTaskBundle(opts)
    case 'memory':
      return buildMemoryBundle(opts)
    default:
      return { ...EMPTY_BUNDLE }
  }
}

// ─────────────────────────────────────────────────────────────
// Idea bundle
// ─────────────────────────────────────────────────────────────

async function buildIdeaBundle(opts: GetRelatedOptions): Promise<RelatedBundle> {
  const { userId, id } = opts
  const limit = opts.limitPer ?? 5

  const idea = await prisma.idea.findFirst({
    where: { id, userId },
    include: {
      plan: { include: { milestones: { include: { tasks: true }, orderBy: { orderIdx: 'asc' } } } },
      notes: { where: { archived: false }, orderBy: { updatedAt: 'desc' }, take: limit },
      messages: { orderBy: { createdAt: 'desc' }, take: limit },
      reflections: { orderBy: { createdAt: 'desc' }, take: limit },
    },
  })
  if (!idea) return { ...EMPTY_BUNDLE }

  // outgoing · Plan 相关（flatten 成 tasks + milestones 概览）
  const outgoing: EntityRef[] = []
  if (idea.plan) {
    const tasks = idea.plan.milestones
      .flatMap((m) => m.tasks)
      .slice(0, limit)
      .map(toTaskRef)
    outgoing.push(...tasks)
  }

  // incoming · ideaId = this 的 notes 反链
  const incoming: EntityRef[] = idea.notes.map(toNoteRef)

  // siblings · 本 idea 的 messages + reflections 时间流
  const siblings: EntityRef[] = [
    ...idea.messages.map(toMessageRef),
    ...idea.reflections.map(toReflectionRef),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit)

  // tagPeers / temporal / semantic 并发
  const [tagPeers, temporal, semantic] = await Promise.all([
    safeDim(() =>
      getTagPeers({
        userId,
        tags: idea.tags,
        limit,
        excludeType: 'idea',
        excludeId: id,
      }),
    ),
    safeDim(() =>
      getTemporalPeers({
        userId,
        center: idea.updatedAt,
        limit,
        excludeType: 'idea',
        excludeId: id,
      }),
    ),
    opts.includeSemantic === false
      ? Promise.resolve<EntityRef[]>([])
      : safeDim(() => semanticForIdea(userId, idea, limit, id)),
  ])

  return { outgoing, incoming, siblings, tagPeers, temporal, semantic }
}

async function semanticForIdea(
  userId: string,
  idea: { embedding: unknown; refinedSummary: string | null; rawContent: string },
  limit: number,
  selfId: string,
): Promise<EntityRef[]> {
  // 优先用存储向量，无则现算
  let vec: number[] | null = null
  if (Array.isArray(idea.embedding)) vec = idea.embedding as number[]
  if (!vec) {
    const text = (idea.refinedSummary ?? idea.rawContent).slice(0, 2000)
    if (!text.trim()) return []
    vec = await embedText(userId, text)
  }
  if (!vec) return []
  return getSemanticPeers({
    userId,
    queryVec: vec,
    limit,
    excludeType: 'idea',
    excludeId: selfId,
  })
}

// ─────────────────────────────────────────────────────────────
// Note bundle
// ─────────────────────────────────────────────────────────────

async function buildNoteBundle(opts: GetRelatedOptions): Promise<RelatedBundle> {
  const { userId, id } = opts
  const limit = opts.limitPer ?? 5

  const note = await prisma.note.findFirst({
    where: { id, userId },
    include: {
      outLinks: {
        include: { target: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
      },
      inLinks: {
        include: { source: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
      },
      tasks: { take: limit },
      idea: true,
    },
  })
  if (!note) return { ...EMPTY_BUNDLE }

  // outgoing · outLinks + 关联 tasks + 关联 idea
  const outgoing: EntityRef[] = [
    ...note.outLinks.map((l) => toNoteRef(l.target)),
    ...note.tasks.map(toTaskRef),
  ]
  if (note.idea) outgoing.push(toIdeaRef(note.idea))

  // incoming · inLinks
  const incoming: EntityRef[] = note.inLinks.map((l) => toNoteRef(l.source))

  // siblings · 同 ideaId 的其他笔记 + 同 folderId 的其他笔记
  const or: Array<{ ideaId?: string; folderId?: string }> = []
  if (note.ideaId) or.push({ ideaId: note.ideaId })
  if (note.folderId) or.push({ folderId: note.folderId })
  const siblingRows = or.length
    ? await prisma.note.findMany({
        where: {
          userId,
          archived: false,
          id: { not: id },
          OR: or,
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      })
    : []
  const siblings: EntityRef[] = siblingRows.map(toNoteRef)

  // tagPeers / temporal / semantic
  const [tagPeers, temporal, semantic] = await Promise.all([
    safeDim(() =>
      getTagPeers({ userId, tags: note.tags, limit, excludeType: 'note', excludeId: id }),
    ),
    safeDim(() =>
      getTemporalPeers({
        userId,
        center: note.updatedAt,
        limit,
        excludeType: 'note',
        excludeId: id,
      }),
    ),
    opts.includeSemantic === false
      ? Promise.resolve<EntityRef[]>([])
      : safeDim(() => semanticForNote(userId, note, limit, id)),
  ])

  return { outgoing, incoming, siblings, tagPeers, temporal, semantic }
}

async function semanticForNote(
  userId: string,
  note: { embedding: unknown; title: string; content: string },
  limit: number,
  selfId: string,
): Promise<EntityRef[]> {
  let vec: number[] | null = null
  if (Array.isArray(note.embedding)) vec = note.embedding as number[]
  if (!vec) {
    const text = `${note.title}\n${note.content}`.slice(0, 2000)
    if (!text.trim()) return []
    vec = await embedText(userId, text)
  }
  if (!vec) return []
  return getSemanticPeers({
    userId,
    queryVec: vec,
    limit,
    excludeType: 'note',
    excludeId: selfId,
  })
}

// ─────────────────────────────────────────────────────────────
// Task bundle
// ─────────────────────────────────────────────────────────────

async function buildTaskBundle(opts: GetRelatedOptions): Promise<RelatedBundle> {
  const { userId, id } = opts
  const limit = opts.limitPer ?? 5

  const task = await prisma.task.findFirst({
    where: { id, milestone: { plan: { idea: { userId } } } },
    include: {
      notes: { take: limit, orderBy: { updatedAt: 'desc' } },
      milestone: {
        include: {
          plan: { include: { idea: true } },
          tasks: {
            where: { id: { not: id } },
            orderBy: { orderIdx: 'asc' },
            take: limit,
          },
        },
      },
    },
  })
  if (!task) return { ...EMPTY_BUNDLE }

  // outgoing · 关联笔记 + 所属 idea
  const outgoing: EntityRef[] = [...task.notes.map(toNoteRef)]
  outgoing.push(toIdeaRef(task.milestone.plan.idea))

  // incoming · 无
  const incoming: EntityRef[] = []

  // siblings · 同 milestone 其他 tasks
  const siblings: EntityRef[] = task.milestone.tasks.map(toTaskRef)

  // tagPeers · 用 idea.tags
  const ideaTags = task.milestone.plan.idea.tags
  const [tagPeers, temporal, semantic] = await Promise.all([
    safeDim(() =>
      getTagPeers({ userId, tags: ideaTags, limit, excludeType: 'task', excludeId: id }),
    ),
    safeDim(() =>
      getTemporalPeers({
        userId,
        center: task.completedAt ?? task.focusedOn ?? new Date(),
        limit,
        excludeType: 'task',
        excludeId: id,
      }),
    ),
    opts.includeSemantic === false
      ? Promise.resolve<EntityRef[]>([])
      : safeDim(() => semanticForTask(userId, task, limit, id)),
  ])

  return { outgoing, incoming, siblings, tagPeers, temporal, semantic }
}

async function semanticForTask(
  userId: string,
  task: { title: string; description: string | null },
  limit: number,
  selfId: string,
): Promise<EntityRef[]> {
  const text = `${task.title}\n${task.description ?? ''}`.slice(0, 1000)
  if (!text.trim()) return []
  const vec = await embedText(userId, text)
  if (!vec) return []
  return getSemanticPeers({
    userId,
    queryVec: vec,
    limit,
    excludeType: 'task',
    excludeId: selfId,
  })
}

// ─────────────────────────────────────────────────────────────
// Memory bundle
// ─────────────────────────────────────────────────────────────

async function buildMemoryBundle(opts: GetRelatedOptions): Promise<RelatedBundle> {
  const { userId, id } = opts
  const limit = opts.limitPer ?? 5

  const mem = await prisma.memory.findFirst({ where: { id, userId } })
  if (!mem) return { ...EMPTY_BUNDLE }

  // outgoing · sourceRef 指向的 idea（若 source = extracted-refine）
  const outgoing: EntityRef[] = []
  if (mem.sourceRef && mem.source === 'extracted-refine') {
    const idea = await prisma.idea.findFirst({
      where: { id: mem.sourceRef, userId },
    })
    if (idea) outgoing.push(toIdeaRef(idea))
  }

  // incoming · 无
  const incoming: EntityRef[] = []

  // siblings · 同 kind 的其他 memories
  const siblingRows = await prisma.memory.findMany({
    where: { userId, kind: mem.kind, id: { not: id } },
    orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  })
  const siblings: EntityRef[] = siblingRows.map(toMemoryRef)

  // tagPeers · Memory 无 tags → 空
  // temporal / semantic
  const [temporal, semantic] = await Promise.all([
    safeDim(() =>
      getTemporalPeers({
        userId,
        center: mem.createdAt,
        limit,
        excludeType: 'memory',
        excludeId: id,
      }),
    ),
    opts.includeSemantic === false
      ? Promise.resolve<EntityRef[]>([])
      : safeDim(() => semanticForMemory(userId, mem, limit, id)),
  ])

  return {
    outgoing,
    incoming,
    siblings,
    tagPeers: [],
    temporal,
    semantic,
  }
}

async function semanticForMemory(
  userId: string,
  mem: { embedding: unknown; content: string },
  limit: number,
  selfId: string,
): Promise<EntityRef[]> {
  let vec: number[] | null = null
  if (Array.isArray(mem.embedding)) vec = mem.embedding as number[]
  if (!vec) {
    vec = await embedText(userId, mem.content)
  }
  if (!vec) return []
  return getSemanticPeers({
    userId,
    queryVec: vec,
    limit,
    excludeType: 'memory',
    excludeId: selfId,
  })
}

// ─────────────────────────────────────────────────────────────
// Shared util
// ─────────────────────────────────────────────────────────────

/**
 * 单个维度的 fail-soft 包裹 · 一处异常不影响其他维度
 */
async function safeDim<T extends EntityRef[]>(run: () => Promise<T>): Promise<EntityRef[]> {
  try {
    return await run()
  } catch (err) {
    console.warn('[relations] dimension failed:', err)
    return []
  }
}
