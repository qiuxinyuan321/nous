/**
 * Stage 4 · Proactive Questions 类型定义
 */

export type PromptKind =
  | 'zombie_idea' // 7 天未动的 idea 被轻轻唤起
  | 'stalled_plan' // 14 天未推进的 milestone
  | 'orphan_goal' // memory.kind=goal 最近无相关行动
  | 'dormant_blindspot' // memory.kind=blindspot 30 天未触达
  | 'hoarding_pattern' // 近 14 天 raw idea 堆积但少进 refining（INTP 收藏癖）
  | 'seasonal_review' // 周日 / 月初温和提醒

export type PromptSeverity = 'gentle' | 'alert' // gentle=轻墨色 alert=朱砂

export interface ProactivePrompt {
  /** 稳定 key · 用于 dismiss 追踪（同 key 1 周内不重复） */
  key: string
  kind: PromptKind
  /** 问句 · 面向 INTP 的提问式 · 第二人称 · 一句话 · 不评判 */
  question: string
  /** 问题的情境铺垫 · 可选 · 小字显示 */
  context?: string
  /** 严重度 · UI 颜色 */
  severity: PromptSeverity
  /** 关联实体 · "我想想" 时跳转用 · 可选 */
  relatedRef?: {
    type: 'idea' | 'memory' | 'plan' | 'milestone'
    id: string
  }
  /** "我想想" 按钮文案 · 默认 "这问题我想想" */
  ctaLabel?: string
  /** 规则生成时间戳 */
  generatedAt: string
}

export interface ProactiveResponse {
  prompts: ProactivePrompt[]
  generatedAt: string
  /** 是否使用了 LLM 润色 */
  usedLLM: boolean
  /** 当前生效的角色信息 · 供前端展示 */
  persona?: {
    id: string
    name: string
    avatar: string
    tagline: string
  }
}
