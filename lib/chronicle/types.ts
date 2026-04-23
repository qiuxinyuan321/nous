/**
 * Stage 3 · Chronicle 类型定义
 */

import type { EntityRef } from '@/lib/relations/types'

/**
 * 单个编年事件。
 * 一个 entity 在一段时间内可能只产生一个事件（创建 / 更新 / 完成），
 * 我们不做多事件拆分，最后渲染时以最重要的时间为准。
 */
export interface ChronicleEvent {
  /** 被引用的实体（idea / note / task / message / reflection / memory） */
  entity: EntityRef
  /** 事件性质 · UI 用不同动词与图标 */
  action: 'created' | 'updated' | 'completed'
  /** 权威时间（action 决定）· 用于排序和分组 */
  timestamp: Date
}

export type ChronicleView = 'day' | 'week' | 'month'

/** 按「YYYY-MM-DD」分组后的结构 */
export interface ChronicleDayGroup {
  /** "2026-04-22" */
  date: string
  /** 该日下按 timestamp DESC 排序的事件 */
  events: ChronicleEvent[]
}
