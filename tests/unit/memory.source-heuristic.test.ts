/**
 * isAutoExtractedSource 单测 · 覆盖 memory 创建时是否应自动打 lastUsedAt 的策略。
 *
 * 关键规约：
 *   - manual / 未指定 → false · 允许 proactive 立刻发现该条 memory
 *   - extracted-refine / extracted-* → true · 刚在对话中激活过 · 视为"刚用过"
 *   - derived → true · 由系统规则派生出的 memory 也算"用过"
 *   - 其他未知 string → false · 默认保守
 */
import { describe, expect, it } from 'vitest'
import { isAutoExtractedSource } from '@/lib/memory/store'

describe('isAutoExtractedSource', () => {
  it('undefined / empty → false', () => {
    expect(isAutoExtractedSource(undefined)).toBe(false)
    expect(isAutoExtractedSource('')).toBe(false)
  })

  it('manual → false · 用户手记不视作已用 · 允许 proactive 立刻提', () => {
    expect(isAutoExtractedSource('manual')).toBe(false)
  })

  it('extracted-refine → true · 来自 Socratic 对话的抽取', () => {
    expect(isAutoExtractedSource('extracted-refine')).toBe(true)
  })

  it('extracted-*（任何 extracted 前缀）→ true · 通配', () => {
    expect(isAutoExtractedSource('extracted-plan')).toBe(true)
    expect(isAutoExtractedSource('extracted-journal')).toBe(true)
    expect(isAutoExtractedSource('extracted-x')).toBe(true)
  })

  it('derived → true · 规则派生出的 memory', () => {
    expect(isAutoExtractedSource('derived')).toBe(true)
  })

  it('未知 / 其他字符串 → false（保守默认）', () => {
    expect(isAutoExtractedSource('imported')).toBe(false)
    expect(isAutoExtractedSource('EXTRACTED-REFINE')).toBe(false) // 大小写敏感
    expect(isAutoExtractedSource('x-extracted')).toBe(false) // 只认前缀
  })
})
