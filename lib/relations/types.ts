/**
 * Stage 0 · 关系抽象层类型定义
 * -----------------------------------------------------------
 * 所有实体共享同一套 Ref 形状，方便 UI 层做统一渲染。
 * 所有分组的语义：
 *   - outgoing : 我主动指向谁（Idea → Plan、Note → outLinks）
 *   - incoming : 谁指向我（Memory.sourceRef 指到 Idea）
 *   - siblings : 同一父级下的兄弟（同 Idea 的其他 Note）
 *   - tagPeers : 同 tag 的跨类型内容
 *   - temporal : 同时间窗口的其他动作（默认 ±24h）
 *   - semantic : 语义相似（有 embedding 才启用）
 */

export type EntityType =
  | 'idea'
  | 'note'
  | 'task'
  | 'memory'
  | 'message'
  | 'reflection'
  | 'plan'
  | 'milestone'

export interface EntityRef {
  type: EntityType
  id: string
  /** UI 显示标题，保证非空（空则补「无题」） */
  title: string
  /** 摘要，默认从正文截 120 字 */
  snippet?: string
  /** 主要时间，通常是 createdAt 或 updatedAt */
  timestamp: Date
  /** 额外的轻量 metadata，例如 tags / status / kind */
  meta?: Record<string, unknown>
}

export interface RelatedBundle {
  outgoing: EntityRef[]
  incoming: EntityRef[]
  siblings: EntityRef[]
  tagPeers: EntityRef[]
  temporal: EntityRef[]
  semantic: EntityRef[]
}

export interface GetRelatedOptions {
  userId: string
  type: EntityType
  id: string
  /** 每个维度最多返回几条 · 默认 5 */
  limitPer?: number
  /** 是否跑 semantic（需要 embedding）· 默认 true */
  includeSemantic?: boolean
  /** temporal 窗口半径（小时） · 默认 24 */
  temporalWindowHours?: number
}

export const EMPTY_BUNDLE: RelatedBundle = {
  outgoing: [],
  incoming: [],
  siblings: [],
  tagPeers: [],
  temporal: [],
  semantic: [],
}
