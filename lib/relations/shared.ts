/**
 * 跨实体复用的关系维度计算
 * -----------------------------------------------------------
 * temporal · tagPeers · semantic 三个维度对所有实体形式相同，
 * 抽到这里复用。
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { cosineSimilarity, embedText } from '@/lib/ai/embedding'
import type { EntityRef, EntityType } from './types'
import { toIdeaRef, toMemoryRef, toMessageRef, toNoteRef, toReflectionRef } from './serialize'

// ───────────────────────── temporal ─────────────────────────

export interface TemporalOptions {
  userId: string
  center: Date
  /** 半径 · 默认 24 小时 */
  windowHours?: number
  /** 整个 bundle 的上限 · 会在五类实体间按时间倒序取 top N */
  limit?: number
  /** 排除自身 · type + id */
  excludeType?: EntityType
  excludeId?: string
}

/**
 * 取指定用户在给定时间窗口内的跨类型事件流
 * 供 RelationRail temporal 和 Chronicle 时间轴复用。
 */
export async function getTemporalPeers(opts: TemporalOptions): Promise<EntityRef[]> {
  const { userId, center, windowHours = 24, limit = 5, excludeType, excludeId } = opts
  const halfMs = windowHours * 3600 * 1000
  const from = new Date(center.getTime() - halfMs)
  const to = new Date(center.getTime() + halfMs)

  // 并发查 5 类实体
  const [ideas, notes, msgs, reflections, memories] = await Promise.all([
    prisma.idea.findMany({
      where: { userId, updatedAt: { gte: from, lte: to } },
      orderBy: { updatedAt: 'desc' },
      take: limit + 2,
    }),
    prisma.note.findMany({
      where: { userId, updatedAt: { gte: from, lte: to }, archived: false },
      orderBy: { updatedAt: 'desc' },
      take: limit + 2,
    }),
    prisma.message.findMany({
      where: { idea: { userId }, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: 'desc' },
      take: limit + 2,
    }),
    prisma.reflection.findMany({
      where: { userId, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: 'desc' },
      take: limit + 2,
    }),
    prisma.memory.findMany({
      where: { userId, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: 'desc' },
      take: limit + 2,
    }),
  ])

  const refs: EntityRef[] = [
    ...ideas.map(toIdeaRef),
    ...notes.map(toNoteRef),
    ...msgs.map(toMessageRef),
    ...reflections.map(toReflectionRef),
    ...memories.map(toMemoryRef),
  ]

  return refs
    .filter((r) => !(excludeType && excludeId && r.type === excludeType && r.id === excludeId))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit)
}

// ───────────────────────── tag peers ─────────────────────────

export interface TagPeersOptions {
  userId: string
  tags: string[]
  limit?: number
  excludeType?: EntityType
  excludeId?: string
}

/**
 * 找出和给定 tags 有任意交集的 Idea / Note（仅这两类有 tags）
 */
export async function getTagPeers(opts: TagPeersOptions): Promise<EntityRef[]> {
  const { userId, tags, limit = 5, excludeType, excludeId } = opts
  if (!tags.length) return []

  const [ideas, notes] = await Promise.all([
    prisma.idea.findMany({
      where: { userId, tags: { hasSome: tags } },
      orderBy: { updatedAt: 'desc' },
      take: limit + 2,
    }),
    prisma.note.findMany({
      where: { userId, archived: false, tags: { hasSome: tags } },
      orderBy: { updatedAt: 'desc' },
      take: limit + 2,
    }),
  ])

  const refs: EntityRef[] = [...ideas.map(toIdeaRef), ...notes.map(toNoteRef)]
  return refs
    .filter((r) => !(excludeType && excludeId && r.type === excludeType && r.id === excludeId))
    .slice(0, limit)
}

// ───────────────────────── semantic peers ─────────────────────────

export interface SemanticPeersOptions {
  userId: string
  /** 查询向量 · 外部提供（避免多次 embed 调用） */
  queryVec: number[]
  limit?: number
  excludeType?: EntityType
  excludeId?: string
  /**
   * 哪些实体类型参与相似度扫描 · 默认全扫
   */
  scope?: EntityType[]
  /**
   * 每类实体的扫描上限（避免全表加载） · 默认 100
   */
  scanCap?: number
}

interface ScoredRef {
  ref: EntityRef
  score: number
}

/**
 * 跨实体语义相似 top-K。
 * - 在 JS 内存里算 cosine（与现有 searchMemories 一致）
 * - 无 embedding 的行直接跳过（不评分）
 */
export async function getSemanticPeers(opts: SemanticPeersOptions): Promise<EntityRef[]> {
  const {
    userId,
    queryVec,
    limit = 5,
    excludeType,
    excludeId,
    scope = ['idea', 'note', 'message', 'reflection', 'memory'],
    scanCap = 100,
  } = opts
  if (!queryVec.length) return []

  const tasks: Array<Promise<ScoredRef[]>> = []

  // Prisma 6 对 Json 字段的 null 过滤用 Prisma.DbNull
  const hasEmbedding = { not: Prisma.DbNull }

  if (scope.includes('idea')) {
    tasks.push(
      prisma.idea
        .findMany({
          where: { userId, embedding: hasEmbedding },
          orderBy: { updatedAt: 'desc' },
          take: scanCap,
        })
        .then((rows) => rows.map((r) => scoreRow(r.embedding, queryVec, toIdeaRef(r))))
        .then((arr) => arr.filter((x): x is ScoredRef => !!x)),
    )
  }
  if (scope.includes('note')) {
    tasks.push(
      prisma.note
        .findMany({
          where: { userId, archived: false, embedding: hasEmbedding },
          orderBy: { updatedAt: 'desc' },
          take: scanCap,
        })
        .then((rows) => rows.map((r) => scoreRow(r.embedding, queryVec, toNoteRef(r))))
        .then((arr) => arr.filter((x): x is ScoredRef => !!x)),
    )
  }
  if (scope.includes('message')) {
    tasks.push(
      prisma.message
        .findMany({
          where: { idea: { userId }, embedding: hasEmbedding },
          orderBy: { createdAt: 'desc' },
          take: scanCap,
        })
        .then((rows) => rows.map((r) => scoreRow(r.embedding, queryVec, toMessageRef(r))))
        .then((arr) => arr.filter((x): x is ScoredRef => !!x)),
    )
  }
  if (scope.includes('reflection')) {
    tasks.push(
      prisma.reflection
        .findMany({
          where: { userId, embedding: hasEmbedding },
          orderBy: { createdAt: 'desc' },
          take: scanCap,
        })
        .then((rows) => rows.map((r) => scoreRow(r.embedding, queryVec, toReflectionRef(r))))
        .then((arr) => arr.filter((x): x is ScoredRef => !!x)),
    )
  }
  if (scope.includes('memory')) {
    tasks.push(
      prisma.memory
        .findMany({
          where: { userId, embedding: hasEmbedding },
          orderBy: { importance: 'desc' },
          take: scanCap,
        })
        .then((rows) => rows.map((r) => scoreRow(r.embedding, queryVec, toMemoryRef(r))))
        .then((arr) => arr.filter((x): x is ScoredRef => !!x)),
    )
  }

  const bundles = await Promise.all(tasks)
  const flat = bundles
    .flat()
    .filter(
      (s) => !(excludeType && excludeId && s.ref.type === excludeType && s.ref.id === excludeId),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return flat.map((s) => s.ref)
}

function scoreRow(embedding: unknown, queryVec: number[], ref: EntityRef): ScoredRef | null {
  if (!Array.isArray(embedding)) return null
  const vec = embedding as number[]
  if (vec.length !== queryVec.length) return null
  const sim = cosineSimilarity(queryVec, vec)
  if (sim <= 0) return null
  return { ref, score: sim }
}

/**
 * 基于一段文本求出 query vec，再走 getSemanticPeers。
 * 如果 embedText 返回 null，自动降级为空数组（fail-soft）。
 */
export async function getSemanticPeersByText(
  userId: string,
  text: string,
  rest: Omit<SemanticPeersOptions, 'userId' | 'queryVec'> = {},
): Promise<EntityRef[]> {
  const vec = await embedText(userId, text)
  if (!vec) return []
  return getSemanticPeers({ userId, queryVec: vec, ...rest })
}
