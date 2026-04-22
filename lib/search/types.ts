/**
 * Stage 0 · Omni-Search 类型定义
 */

import type { EntityRef, EntityType } from '@/lib/relations/types'

export type SearchEntityType = Extract<
  EntityType,
  'idea' | 'note' | 'message' | 'reflection' | 'memory'
>

export const SEARCHABLE_TYPES: SearchEntityType[] = [
  'idea',
  'note',
  'message',
  'reflection',
  'memory',
]

export interface SearchFilters {
  /** 仅匹配这些实体类型 · 默认全选 */
  types?: SearchEntityType[]
  /** 时间下限 · updatedAt/createdAt >= from */
  from?: Date
  /** 时间上限 · updatedAt/createdAt <= to */
  to?: Date
  /** 仅在包含指定 tag 的 Idea/Note 中搜（其他类型自动绕过） */
  tag?: string
}

export interface SearchResultItem {
  entity: EntityRef
  /** 0..1 归一化后的分数 */
  score: number
  /** 命中来源 · 用于 UI 标注 */
  matchedField: 'title' | 'content' | 'semantic' | 'mixed'
  /** 已高亮的片段 */
  highlight?: string
}

export interface SearchOptions {
  userId: string
  query: string
  filters?: SearchFilters
  /** 结果总上限 · 默认 20 */
  limit?: number
  /** 是否跑 embedding rerank · 默认 true (无 Key 自动降级) */
  semantic?: boolean
}

export interface SearchResponse {
  results: SearchResultItem[]
  /** 解析后的 filter（含 prefix 识别结果） */
  filters: SearchFilters
  /** 使用了哪些策略 · 方便调试 */
  used: { fulltext: boolean; semantic: boolean }
  /** 查询耗时（ms） */
  elapsedMs: number
}

/**
 * Prefix 解析结果。原始串去掉 prefix 后留下的 query 给 fulltext 用。
 *
 * 支持的 prefix（大小写不敏感）：
 *   idea: note: msg: message: ref: reflection: mem: memory:
 *   tag:<name>
 *
 * 例：
 *   "idea: 产品灵感"        → { types: ['idea'], query: '产品灵感' }
 *   "msg: ref: 回顾"        → { types: ['message','reflection'], query: '回顾' }
 *   "tag:写作 产品"         → { tag: '写作', query: '产品' }
 */
export interface ParsedQuery {
  query: string
  filters: SearchFilters
}
