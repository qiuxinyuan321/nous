/**
 * 语义 rerank · 在 fulltext 候选基础上合成最终分数
 * -----------------------------------------------------------
 * 策略：
 * 1. query 走 embedText 拿向量（失败即跳过，保持 fulltext 排序）
 * 2. 候选实体有 embedding 的就算 cosine
 * 3. final = 0.6 * fulltextScore + 0.4 * semanticScore
 *    无 semantic 则保持原 score
 */

import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { cosineSimilarity, embedText } from '@/lib/ai/embedding'
import type { EntityRef } from '@/lib/relations/types'
import type { SearchResultItem } from './types'

const FULLTEXT_WEIGHT = 0.6
const SEMANTIC_WEIGHT = 0.4

export async function rerankWithSemantics(
  userId: string,
  query: string,
  candidates: SearchResultItem[],
): Promise<SearchResultItem[]> {
  if (!candidates.length) return candidates
  const queryVec = await embedText(userId, query)
  if (!queryVec) return candidates

  // 按 type 分组 · 一次查出所有候选的 embedding
  const idsByType = groupIds(candidates)
  const embMap = await loadEmbeddingsByType(userId, idsByType)

  return candidates
    .map((item) => {
      const key = `${item.entity.type}:${item.entity.id}`
      const vec = embMap.get(key)
      if (!vec) return item
      const sim = cosineSimilarity(queryVec, vec)
      if (sim <= 0) return item
      const blended = FULLTEXT_WEIGHT * item.score + SEMANTIC_WEIGHT * sim
      return {
        ...item,
        score: blended,
        matchedField: 'mixed' as const,
      }
    })
    .sort((a, b) => b.score - a.score)
}

function groupIds(items: SearchResultItem[]): Record<EntityRef['type'], string[]> {
  const out = {} as Record<EntityRef['type'], string[]>
  for (const it of items) {
    if (!out[it.entity.type]) out[it.entity.type] = []
    out[it.entity.type].push(it.entity.id)
  }
  return out
}

async function loadEmbeddingsByType(
  userId: string,
  idsByType: Record<EntityRef['type'], string[]>,
): Promise<Map<string, number[]>> {
  const map = new Map<string, number[]>()
  const jobs: Array<Promise<void>> = []
  const hasEmbedding = { not: Prisma.DbNull }

  const push = async <T extends { id: string; embedding: unknown }>(
    type: EntityRef['type'],
    rows: T[],
  ) => {
    for (const r of rows) {
      if (Array.isArray(r.embedding)) {
        map.set(`${type}:${r.id}`, r.embedding as number[])
      }
    }
  }

  if (idsByType.idea?.length) {
    jobs.push(
      prisma.idea
        .findMany({
          where: { userId, id: { in: idsByType.idea }, embedding: hasEmbedding },
          select: { id: true, embedding: true },
        })
        .then((rows) => push('idea', rows)),
    )
  }
  if (idsByType.note?.length) {
    jobs.push(
      prisma.note
        .findMany({
          where: { userId, id: { in: idsByType.note }, embedding: hasEmbedding },
          select: { id: true, embedding: true },
        })
        .then((rows) => push('note', rows)),
    )
  }
  if (idsByType.message?.length) {
    jobs.push(
      prisma.message
        .findMany({
          where: {
            idea: { userId },
            id: { in: idsByType.message },
            embedding: hasEmbedding,
          },
          select: { id: true, embedding: true },
        })
        .then((rows) => push('message', rows)),
    )
  }
  if (idsByType.reflection?.length) {
    jobs.push(
      prisma.reflection
        .findMany({
          where: { userId, id: { in: idsByType.reflection }, embedding: hasEmbedding },
          select: { id: true, embedding: true },
        })
        .then((rows) => push('reflection', rows)),
    )
  }
  if (idsByType.memory?.length) {
    jobs.push(
      prisma.memory
        .findMany({
          where: { userId, id: { in: idsByType.memory }, embedding: hasEmbedding },
          select: { id: true, embedding: true },
        })
        .then((rows) => push('memory', rows)),
    )
  }

  await Promise.all(jobs)
  return map
}
