/**
 * Postgres trigram 全文搜
 * -----------------------------------------------------------
 * - 走 `contains` + `mode: insensitive` · Prisma 编译为 ILIKE '%q%'
 * - 中英通吃 · 查询计划能用到前面 migration 建的 gin_trgm_ops GIN 索引
 * - 每类实体并行查 · 各取 perTypeLimit 条
 * - 命中字段（title/content）会写进 matchedField
 */

import { prisma } from '@/lib/db'
import {
  toIdeaRef,
  toMemoryRef,
  toMessageRef,
  toNoteRef,
  toReflectionRef,
} from '@/lib/relations/serialize'
import type { EntityRef } from '@/lib/relations/types'
import type { SearchFilters, SearchResultItem } from './types'
import { SEARCHABLE_TYPES } from './types'

export interface FulltextInput {
  userId: string
  query: string
  filters?: SearchFilters
  /** 每类实体取多少候选 · 默认 12 */
  perTypeLimit?: number
}

export async function fulltextSearch(input: FulltextInput): Promise<SearchResultItem[]> {
  const { userId, query, filters = {} } = input
  const perTypeLimit = input.perTypeLimit ?? 12
  const q = query.trim()
  if (!q) return []

  const types = filters.types ?? SEARCHABLE_TYPES
  const dateRange = buildDateRange(filters)

  const jobs: Array<Promise<SearchResultItem[]>> = []
  if (types.includes('idea')) jobs.push(searchIdea(userId, q, filters, dateRange, perTypeLimit))
  if (types.includes('note')) jobs.push(searchNote(userId, q, filters, dateRange, perTypeLimit))
  if (types.includes('message')) jobs.push(searchMessage(userId, q, dateRange, perTypeLimit))
  if (types.includes('reflection')) jobs.push(searchReflection(userId, q, dateRange, perTypeLimit))
  if (types.includes('memory')) jobs.push(searchMemory(userId, q, dateRange, perTypeLimit))

  const results = (await Promise.all(jobs)).flat()
  return results
}

function buildDateRange(filters: SearchFilters) {
  if (!filters.from && !filters.to) return undefined
  const range: { gte?: Date; lte?: Date } = {}
  if (filters.from) range.gte = filters.from
  if (filters.to) range.lte = filters.to
  return range
}

// ─────────────────────────────────────────────────────────────
// 各类型实现 · 每个 ref 打 score 0..1
// title 命中 > content 命中 > mixed
// ─────────────────────────────────────────────────────────────

async function searchIdea(
  userId: string,
  q: string,
  filters: SearchFilters,
  dateRange: { gte?: Date; lte?: Date } | undefined,
  limit: number,
): Promise<SearchResultItem[]> {
  const rows = await prisma.idea.findMany({
    where: {
      userId,
      ...(dateRange ? { updatedAt: dateRange } : {}),
      ...(filters.tag ? { tags: { has: filters.tag } } : {}),
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { rawContent: { contains: q, mode: 'insensitive' } },
        { refinedSummary: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })
  return rows.map((r) => {
    const titleHit = !!r.title && r.title.toLowerCase().includes(q.toLowerCase())
    return {
      entity: toIdeaRef(r),
      score: titleHit ? 0.95 : 0.8,
      matchedField: titleHit ? 'title' : 'content',
      highlight: extractHighlight(titleHit ? r.title! : (r.refinedSummary ?? r.rawContent), q),
    }
  })
}

async function searchNote(
  userId: string,
  q: string,
  filters: SearchFilters,
  dateRange: { gte?: Date; lte?: Date } | undefined,
  limit: number,
): Promise<SearchResultItem[]> {
  const rows = await prisma.note.findMany({
    where: {
      userId,
      archived: false,
      ...(dateRange ? { updatedAt: dateRange } : {}),
      ...(filters.tag ? { tags: { has: filters.tag } } : {}),
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })
  return rows.map((r) => {
    const titleHit = r.title.toLowerCase().includes(q.toLowerCase())
    return {
      entity: toNoteRef(r),
      score: titleHit ? 0.95 : 0.8,
      matchedField: titleHit ? 'title' : 'content',
      highlight: extractHighlight(titleHit ? r.title : r.content, q),
    }
  })
}

async function searchMessage(
  userId: string,
  q: string,
  dateRange: { gte?: Date; lte?: Date } | undefined,
  limit: number,
): Promise<SearchResultItem[]> {
  const rows = await prisma.message.findMany({
    where: {
      idea: { userId },
      ...(dateRange ? { createdAt: dateRange } : {}),
      content: { contains: q, mode: 'insensitive' },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return rows.map((r) => ({
    entity: toMessageRef(r),
    score: 0.75,
    matchedField: 'content' as const,
    highlight: extractHighlight(r.content, q),
  }))
}

async function searchReflection(
  userId: string,
  q: string,
  dateRange: { gte?: Date; lte?: Date } | undefined,
  limit: number,
): Promise<SearchResultItem[]> {
  const rows = await prisma.reflection.findMany({
    where: {
      userId,
      ...(dateRange ? { createdAt: dateRange } : {}),
      OR: [
        { content: { contains: q, mode: 'insensitive' } },
        { aiInsight: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return rows.map((r) => ({
    entity: toReflectionRef(r),
    score: 0.78,
    matchedField: 'content' as const,
    highlight: extractHighlight(r.aiInsight ?? r.content, q),
  }))
}

async function searchMemory(
  userId: string,
  q: string,
  dateRange: { gte?: Date; lte?: Date } | undefined,
  limit: number,
): Promise<SearchResultItem[]> {
  const rows = await prisma.memory.findMany({
    where: {
      userId,
      ...(dateRange ? { createdAt: dateRange } : {}),
      content: { contains: q, mode: 'insensitive' },
    },
    orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  })
  return rows.map((r) => ({
    entity: toMemoryRef(r),
    score: 0.72 + r.importance * 0.02, // 重要记忆微加权
    matchedField: 'content' as const,
    highlight: extractHighlight(r.content, q),
  }))
}

// ─────────────────────────────────────────────────────────────
// 高亮 · 取命中字的前后 60 字
// ─────────────────────────────────────────────────────────────

export function extractHighlight(
  source: string | null | undefined,
  query: string,
): string | undefined {
  if (!source || !query) return undefined
  const text = source.replace(/\s+/g, ' ')
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx < 0) return text.slice(0, 120)
  const start = Math.max(0, idx - 40)
  const end = Math.min(text.length, idx + query.length + 80)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return `${prefix}${text.slice(start, end)}${suffix}`
}

/** 从 EntityRef 拿出便于 embed 的文本（title + snippet） */
export function refToText(ref: EntityRef): string {
  return `${ref.title}\n${ref.snippet ?? ''}`.trim()
}
