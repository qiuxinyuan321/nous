/**
 * Persona Voice Layer 单测
 * -----------------------------------------
 * 保证每个 persona 在 zh/en 都有可用 voice block · 且含各自签名标志。
 */
import { describe, expect, it } from 'vitest'
import { personaVoiceBlock } from '@/lib/ai/persona-voice'
import { socraticSystemPrompt } from '@/lib/ai/socratic'

describe('personaVoiceBlock', () => {
  it('auto / null / undefined 返回空字符串', () => {
    expect(personaVoiceBlock({ personaId: 'auto', locale: 'zh-CN' })).toBe('')
    expect(personaVoiceBlock({ personaId: null, locale: 'zh-CN' })).toBe('')
    expect(personaVoiceBlock({ personaId: undefined, locale: 'zh-CN' })).toBe('')
  })

  it('诸葛亮 · zh · 含文言自称和温厚收尾', () => {
    const v = personaVoiceBlock({ personaId: 'zhuge', locale: 'zh-CN' })
    expect(v).toMatch(/亮观|窃以为/)
    expect(v).toMatch(/静以修身|非宁静无以致远/)
  })

  it('Rick · en · mentions *burp* and Wubba lubba dub dub', () => {
    const v = personaVoiceBlock({ personaId: 'rick', locale: 'en-US' })
    expect(v).toMatch(/burp/i)
    expect(v).toMatch(/Wubba lubba dub dub/)
    expect(v).toMatch(/Morty/)
  })

  it('楚轩 · zh · 第三人称自称 + 代价收益词', () => {
    const v = personaVoiceBlock({ personaId: 'chuxuan', locale: 'zh-CN' })
    expect(v).toMatch(/楚轩认为|楚轩建议/)
    expect(v).toMatch(/代价|价值|收益/)
    expect(v).toMatch(/弱者的情绪不应影响强者的决策|对楚轩而言没有什么是必须的/)
  })

  it('苏格拉底 · zh · 助产士 + 反诘特征', () => {
    const v = personaVoiceBlock({ personaId: 'socrates', locale: 'zh-CN' })
    expect(v).toMatch(/助产士|Elenchus/)
    expect(v).toMatch(/容我一问|请告诉我/)
    expect(v).toMatch(/未经审视的人生不值得过/)
  })

  it('庄子 · zh · 内七篇寓言关键词', () => {
    const v = personaVoiceBlock({ personaId: 'zhuangzi', locale: 'zh-CN' })
    expect(v).toMatch(/鲲鹏|庖丁解牛|蝴蝶梦|鱼相忘于江湖/)
    expect(v).toMatch(/齐物|物无非彼/)
  })

  it('Holmes · en · 引用真·原著句 + 明令禁 Elementary my dear Watson', () => {
    const v = personaVoiceBlock({ personaId: 'holmes', locale: 'en-US' })
    expect(v).toMatch(/Data! Data! Data!/)
    expect(v).toMatch(/capital mistake to theorize/)
    // 禁令：此句从未出现在 Doyle 原著中
    expect(v).toMatch(/never appears in Doyle/i)
  })

  it('所有非 auto persona 在 zh 和 en 都有非空 voice block', () => {
    const ids = ['zhuge', 'rick', 'chuxuan', 'socrates', 'zhuangzi', 'holmes'] as const
    for (const id of ids) {
      expect(personaVoiceBlock({ personaId: id, locale: 'zh-CN' }).length).toBeGreaterThan(200)
      expect(personaVoiceBlock({ personaId: id, locale: 'en-US' }).length).toBeGreaterThan(200)
    }
  })
})

describe('socraticSystemPrompt integration', () => {
  const baseCtx = {
    phase: 'intent' as const,
    locale: 'zh-CN' as const,
    ideaTitle: '搭一个 notion 替代品',
    ideaContent: '想做一个更轻量的笔记应用',
  }

  it('auto 不追加 voice block · 保持 Nous 本体 prompt', () => {
    const withAuto = socraticSystemPrompt({ ...baseCtx, personaId: 'auto' })
    const withoutPersona = socraticSystemPrompt(baseCtx)
    expect(withAuto).toBe(withoutPersona)
    expect(withAuto).not.toMatch(/语气层|Voice Layer/)
  })

  it('非 auto persona · prompt 尾部含 Voice Layer 标记', () => {
    const p = socraticSystemPrompt({ ...baseCtx, personaId: 'zhuge' })
    expect(p).toMatch(/## 语气层 · 诸葛亮/)
    // base prompt 仍在
    expect(p).toMatch(/Nous/)
  })

  it('en locale · 非 auto persona · prompt 尾部含 Voice Layer 英文标记', () => {
    const p = socraticSystemPrompt({
      ...baseCtx,
      locale: 'en-US',
      personaId: 'holmes',
    })
    expect(p).toMatch(/## Voice Layer · Sherlock Holmes/)
    expect(p).toMatch(/Data! Data! Data!/)
  })

  it('persona 在 memoryBlock 之后 · 不覆盖用户画像', () => {
    const memoryBlock = '## 我记得的你\n- 你是 INTP'
    const p = socraticSystemPrompt({ ...baseCtx, memoryBlock, personaId: 'chuxuan' })
    const memoryIdx = p.indexOf('我记得的你')
    const voiceIdx = p.indexOf('楚轩')
    expect(memoryIdx).toBeGreaterThan(-1)
    expect(voiceIdx).toBeGreaterThan(memoryIdx)
  })
})
