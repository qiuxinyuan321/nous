/**
 * greetForPersona 单测 · 保证 persona 标志口吻不丢失 · 所有 persona 所有时段都有非空输出。
 */
import { describe, expect, it } from 'vitest'
import { greetForPersona } from '@/lib/proactive/greeting'
import type { PersonaId } from '@/lib/proactive/personas'

const ALL_PERSONAS: PersonaId[] = [
  'auto',
  'zhuge',
  'rick',
  'chuxuan',
  'socrates',
  'zhuangzi',
  'holmes',
]
const HOURS = [3, 8, 12, 17, 22] // night · morning · noon · evening · night

function base() {
  return {
    todayDone: 0,
    todayTotal: 0,
    weekIdeas: 0,
    streak: 0,
    locale: 'zh-CN' as const,
  }
}

describe('greetForPersona', () => {
  it('所有 persona × 所有时段 × zh 都有非空输出 · 长度合理', () => {
    for (const personaId of ALL_PERSONAS) {
      for (const hour of HOURS) {
        const s = greetForPersona({ ...base(), personaId, hour })
        expect(s.length).toBeGreaterThan(4)
        expect(s.length).toBeLessThan(80)
      }
    }
  })

  it('所有 persona × 所有时段 × en 都有非空输出', () => {
    for (const personaId of ALL_PERSONAS) {
      for (const hour of HOURS) {
        const s = greetForPersona({ ...base(), personaId, hour, locale: 'en-US' })
        expect(s.length).toBeGreaterThan(4)
      }
    }
  })

  it('诸葛亮 · 保留"亮"字标识', () => {
    const s = greetForPersona({ ...base(), personaId: 'zhuge', hour: 9 })
    expect(s).toMatch(/亮|君/)
  })

  it('Rick · zh · 保留 *burp* 标识', () => {
    const s = greetForPersona({ ...base(), personaId: 'rick', hour: 9 })
    expect(s).toMatch(/\*burp\*/)
  })

  it('Rick · en · 保留 *burp* 标识', () => {
    const s = greetForPersona({ ...base(), personaId: 'rick', hour: 9, locale: 'en-US' })
    expect(s).toMatch(/\*burp\*/)
  })

  it('楚轩 · 第三人称"楚轩"出现', () => {
    const s = greetForPersona({ ...base(), personaId: 'chuxuan', hour: 9 })
    expect(s).toContain('楚轩')
  })

  it('苏格拉底 · 句末包含问号 · 任意情境', () => {
    for (const hour of HOURS) {
      for (const todayDone of [0, 3]) {
        const s = greetForPersona({
          ...base(),
          personaId: 'socrates',
          hour,
          todayDone,
          todayTotal: todayDone,
        })
        expect(s).toMatch(/[?？]/)
      }
    }
  })

  it('苏格拉底 · en · 仍只问不答（含问号）', () => {
    const s = greetForPersona({
      ...base(),
      personaId: 'socrates',
      hour: 8,
      locale: 'en-US',
    })
    expect(s).toMatch(/\?/)
  })

  it('Holmes · 带有观察 / Data 风格关键词', () => {
    const done = greetForPersona({
      ...base(),
      personaId: 'holmes',
      hour: 9,
      todayDone: 2,
      todayTotal: 3,
    })
    expect(done).toMatch(/观察|Data|数据/)
    const doneEn = greetForPersona({
      ...base(),
      personaId: 'holmes',
      hour: 9,
      todayDone: 2,
      todayTotal: 3,
      locale: 'en-US',
    })
    expect(doneEn).toMatch(/Observation|Data/)
  })

  it('庄子 · 寓言意象至少出现一个', () => {
    // 遍历所有时段 · 合并后应含朝菌/鹪鹩/鱼/庖丁/梦蝶/北冥 之一
    const texts = HOURS.flatMap((h) =>
      [0, 2].map((d) =>
        greetForPersona({
          ...base(),
          personaId: 'zhuangzi',
          hour: h,
          todayDone: d,
          todayTotal: d,
        }),
      ),
    )
    const joined = texts.join('\n')
    expect(joined).toMatch(/朝菌|鹪鹩|鱼|庖丁|梦蝶|北冥/)
  })

  it('今日有完成数时 · 文案提到该数字（非苏格拉底）', () => {
    // 苏格拉底不报数字 · 其他都会引用 todayDone
    const talkative: PersonaId[] = ['auto', 'zhuge', 'rick', 'chuxuan', 'holmes', 'zhuangzi']
    for (const personaId of talkative) {
      const s = greetForPersona({
        ...base(),
        personaId,
        hour: 9,
        todayDone: 7,
        todayTotal: 7,
      })
      expect(s).toContain('7')
    }
  })

  it('边界 hour · 0 / 23 / 5 / 11 / 15 / 21 都不崩', () => {
    for (const hour of [0, 5, 11, 15, 20, 21, 23]) {
      const s = greetForPersona({ ...base(), personaId: 'auto', hour })
      expect(typeof s).toBe('string')
      expect(s.length).toBeGreaterThan(0)
    }
  })
})
