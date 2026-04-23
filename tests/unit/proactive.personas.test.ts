import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PERSONA_ID,
  PERSONAS,
  getPersona,
  isValidPersonaId,
} from '@/lib/proactive/personas'

const SAMPLE_QUESTION = '「搭个 notion 替代品」这个想法搁置一周多了 · 还想继续往下走吗？'

describe('personas registry', () => {
  it('contains all 7 personas', () => {
    const ids = PERSONAS.map((p) => p.id).sort()
    expect(ids).toEqual(
      ['auto', 'chuxuan', 'holmes', 'rick', 'socrates', 'zhuangzi', 'zhuge'].sort(),
    )
  })

  it('default is auto and keeps raw untouched', () => {
    expect(DEFAULT_PERSONA_ID).toBe('auto')
    const auto = getPersona('auto')
    expect(auto.rewrite(SAMPLE_QUESTION, 'zombie_idea')).toBe(SAMPLE_QUESTION)
  })

  it('getPersona falls back to auto for unknown id', () => {
    expect(getPersona('nobody').id).toBe('auto')
    expect(getPersona(null).id).toBe('auto')
    expect(getPersona(undefined).id).toBe('auto')
    expect(getPersona('').id).toBe('auto')
  })

  it('isValidPersonaId accepts real ids and rejects fake', () => {
    expect(isValidPersonaId('zhuge')).toBe(true)
    expect(isValidPersonaId('rick')).toBe(true)
    expect(isValidPersonaId('nobody')).toBe(false)
    expect(isValidPersonaId(null)).toBe(false)
    expect(isValidPersonaId(undefined)).toBe(false)
  })
})

describe('persona rewrite preserves core meaning', () => {
  it.each(PERSONAS.filter((p) => p.id !== 'auto'))(
    '$name actually changes the raw text',
    (persona) => {
      const out = persona.rewrite(SAMPLE_QUESTION, 'zombie_idea')
      expect(out).not.toBe(SAMPLE_QUESTION)
      expect(out.length).toBeGreaterThan(0)
    },
  )

  it.each(PERSONAS)('$name works for every kind without throwing', (persona) => {
    const kinds = [
      'zombie_idea',
      'stalled_plan',
      'orphan_goal',
      'dormant_blindspot',
      'hoarding_pattern',
      'seasonal_review',
    ] as const
    for (const k of kinds) {
      expect(() => persona.rewrite(SAMPLE_QUESTION, k)).not.toThrow()
      const out = persona.rewrite(SAMPLE_QUESTION, k)
      expect(out.length).toBeGreaterThan(0)
    }
  })
})

describe('persona specific flavors', () => {
  it('zhuge uses classical Chinese cues', () => {
    const out = getPersona('zhuge').rewrite(SAMPLE_QUESTION, 'zombie_idea')
    // 亮 / 以为 / 窃 · 至少含一个经典诸葛腔线索
    expect(out).toMatch(/亮|以为|可思/)
  })

  it('rick contains his hiccup', () => {
    const out = getPersona('rick').rewrite(SAMPLE_QUESTION, 'zombie_idea')
    expect(out).toMatch(/\*打嗝\*/)
  })

  it('chuxuan drops emotional particles', () => {
    const out = getPersona('chuxuan').rewrite(SAMPLE_QUESTION, 'zombie_idea')
    // 原句里的 " · " 气口符号应该被换成句号
    expect(out).not.toMatch(/ · /)
    // 楚轩一定会给概率或选项
    expect(out).toMatch(/概率|选项|归档|继续/)
  })

  it('socrates always asks back', () => {
    const out = getPersona('socrates').rewrite(SAMPLE_QUESTION, 'orphan_goal')
    // 苏格拉底风格：反问 or "自问" or "无答案"
    expect(out).toMatch(/问|答案|自问/)
  })

  it('zhuangzi appends a parable tail', () => {
    const out = getPersona('zhuangzi').rewrite(SAMPLE_QUESTION, 'zombie_idea')
    expect(out).toMatch(/鱼相忘|大道|朝菌|真人|安之/)
  })

  it('holmes prefixes with observation', () => {
    const out = getPersona('holmes').rewrite(SAMPLE_QUESTION, 'zombie_idea')
    expect(out).toMatch(/观察/)
  })
})
