/**
 * Stage 0 · Omni-Search 主入口
 * -----------------------------------------------------------
 * 流程：
 *   parseQuery → fulltext → (可选) semantic rerank → 去重 → 截 limit
 *
 * 使用：
 *   import { search } from '@/lib/search'
 *   const resp = await search({ userId, query: 'idea: 写作' })
 */

import { fulltextSearch } from './fulltext'
import { parseQuery } from './parse'
import { rerankWithSemantics } from './rerank'
import type { SearchOptions, SearchResponse, SearchResultItem } from './types'

export type {
  SearchEntityType,
  SearchFilters,
  SearchOptions,
  SearchResponse,
  SearchResultItem,
} from './types'
export { SEARCHABLE_TYPES } from './types'
export { parseQuery } from './parse'
export { extractHighlight } from './fulltext'

const DEFAULT_LIMIT = 20

export async function search(opts: SearchOptions): Promise<SearchResponse> {
  const start = Date.now()
  const limit = opts.limit ?? DEFAULT_LIMIT

  const parsed = parseQuery(opts.query)
  // 合并调用方 filter 和 prefix filter · 调用方优先
  const filters = {
    ...parsed.filters,
    ...(opts.filters ?? {}),
    // types 做合并：两处都有 → 取交集；只有一处 → 该处
    types:
      opts.filters?.types && parsed.filters.types
        ? opts.filters.types.filter((t) => parsed.filters.types!.includes(t))
        : (opts.filters?.types ?? parsed.filters.types),
  }

  if (!parsed.query) {
    return {
      results: [],
      filters,
      used: { fulltext: false, semantic: false },
      elapsedMs: Date.now() - start,
    }
  }

  // 1. fulltext
  const candidates = await fulltextSearch({
    userId: opts.userId,
    query: parsed.query,
    filters,
    perTypeLimit: Math.min(Math.ceil(limit / 2), 20),
  })

  // 2. rerank（可选）
  const useSemantic = opts.semantic !== false
  let ranked: SearchResultItem[]
  let usedSemantic = false
  if (useSemantic && candidates.length > 0) {
    const reranked = await rerankWithSemantics(opts.userId, parsed.query, candidates)
    // rerank 若没生效 · 分数不变；但 matchedField 变 mixed 说明生效
    usedSemantic = reranked.some((r) => r.matchedField === 'mixed')
    ranked = reranked
  } else {
    ranked = candidates.sort((a, b) => b.score - a.score)
  }

  // 3. 去重 · 同 entity 只留最高分
  const deduped = dedupeResults(ranked)

  return {
    results: deduped.slice(0, limit),
    filters,
    used: { fulltext: true, semantic: usedSemantic },
    elapsedMs: Date.now() - start,
  }
}

function dedupeResults(items: SearchResultItem[]): SearchResultItem[] {
  const seen = new Map<string, SearchResultItem>()
  for (const it of items) {
    const key = `${it.entity.type}:${it.entity.id}`
    const exist = seen.get(key)
    if (!exist || exist.score < it.score) seen.set(key, it)
  }
  return Array.from(seen.values()).sort((a, b) => b.score - a.score)
}
