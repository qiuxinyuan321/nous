/**
 * planner.buildPlanSystem 单测
 * -----------------------------------------------------
 * 验证 plan 生成的 system prompt 在 persona 介入时：
 *   - 基础硬性规则（MoSCoW / ≤3 milestones / firstAction<15min）仍在
 *   - voice block 被正确追加
 *   - 末尾附加"语气与结构的边界"刚性约束 · 保护 JSON schema
 *
 * auto / 空 persona 时保持原来的 base system prompt · 向后兼容。
 */
import { describe, expect, it } from 'vitest'
import { buildPlanSystem } from '@/lib/ai/planner'

describe('buildPlanSystem', () => {
  it('auto · zh · 仅返回 base system prompt · 不含 voice 层', () => {
    const s = buildPlanSystem({ locale: 'zh-CN', personaId: 'auto' })
    expect(s).toMatch(/硬性原则/)
    expect(s).toMatch(/MoSCoW/)
    expect(s).not.toMatch(/语气层/)
    expect(s).not.toMatch(/语气与结构的边界/)
  })

  it('undefined persona · en · 仅返回 base system prompt', () => {
    const s = buildPlanSystem({ locale: 'en-US', personaId: null })
    expect(s).toMatch(/Hard rules/)
    expect(s).toMatch(/MoSCoW/)
    expect(s).not.toMatch(/Voice Layer/)
    expect(s).not.toMatch(/Voice-vs-structure/)
  })

  it('zhuge · zh · 包含 base + voice + 结构边界三段', () => {
    const s = buildPlanSystem({ locale: 'zh-CN', personaId: 'zhuge' })
    // 基础硬性规则仍在
    expect(s).toMatch(/硬性原则/)
    expect(s).toMatch(/MoSCoW/)
    // voice 层
    expect(s).toMatch(/## 语气层 · 诸葛亮/)
    expect(s).toMatch(/亮观|窃以为/)
    // 结构边界
    expect(s).toMatch(/## 语气与结构的边界/)
    expect(s).toMatch(/JSON 结构/)
  })

  it('chuxuan · zh · 边界约束明确禁止破坏 JSON 结构', () => {
    const s = buildPlanSystem({ locale: 'zh-CN', personaId: 'chuxuan' })
    expect(s).toMatch(/楚轩认为|楚轩建议/)
    expect(s).toMatch(/语气与结构的边界/)
    // 楚轩倾向决策列表 · 边界规则需强调 JSON 不可变
    expect(s).toMatch(/JSON 结构、字段名/)
    expect(s).toMatch(/硬性原则.+必须保持不变/)
  })

  it('holmes · en · includes voice + structure rule', () => {
    const s = buildPlanSystem({ locale: 'en-US', personaId: 'holmes' })
    expect(s).toMatch(/Hard rules/)
    expect(s).toMatch(/## Voice Layer · Sherlock Holmes/)
    expect(s).toMatch(/Data! Data! Data!/)
    expect(s).toMatch(/## Voice-vs-structure rule/)
    expect(s).toMatch(/JSON structure.+MUST remain intact/)
  })

  it('所有非 auto persona · zh · 都包含三段式', () => {
    const ids = ['zhuge', 'rick', 'chuxuan', 'socrates', 'zhuangzi', 'holmes'] as const
    for (const id of ids) {
      const s = buildPlanSystem({ locale: 'zh-CN', personaId: id })
      expect(s).toMatch(/硬性原则/)
      expect(s).toMatch(/语气层|Voice Layer/)
      expect(s).toMatch(/语气与结构的边界/)
    }
  })

  it('voice 层位置在 base 之后 · 结构边界在最末尾', () => {
    const s = buildPlanSystem({ locale: 'zh-CN', personaId: 'zhuangzi' })
    const baseIdx = s.indexOf('硬性原则')
    const voiceIdx = s.indexOf('语气层')
    const ruleIdx = s.indexOf('语气与结构的边界')
    expect(baseIdx).toBeGreaterThanOrEqual(0)
    expect(voiceIdx).toBeGreaterThan(baseIdx)
    expect(ruleIdx).toBeGreaterThan(voiceIdx)
  })
})
