/**
 * Proactive Personas · INTP 取向的 7 位智者人设
 * -----------------------------------------------------------
 * 每位 persona 定义一个轻量 rewrite(raw, kind) · 把中性问句包装成角色腔
 * 不改核心问题 · 不改严重度 · 只改说话的人
 *
 * 设计原则：
 *  - auto 是味最正的 AI · 保持原文 · 不扮演
 *  - 其他 6 位都是 INTP 气味的"智者"：理性 / 抽离 / 问得多答得少 / 允许毒舌
 *  - rewrite 是纯字符串函数 · 不查 DB / 不调 LLM · 1ms 返回
 */
import type { PromptKind } from './types'

export type PersonaId = 'auto' | 'zhuge' | 'rick' | 'chuxuan' | 'socrates' | 'zhuangzi' | 'holmes'

export interface Persona {
  id: PersonaId
  /** 显示名 */
  name: string
  /** 头像 · 单字/emoji · 卡片右上角小字 */
  avatar: string
  /** 一句话描述 · 选择器里显示 */
  tagline: string
  /** 改写问句 · 保持核心问题不变 */
  rewrite: (raw: string, kind: PromptKind) => string
  /** 改写 CTA 按钮文案 · 可选 */
  rewriteCTA?: (cta: string, kind: PromptKind) => string
  /** 改写 context 小字铺垫 · 可选 */
  rewriteContext?: (context: string, kind: PromptKind) => string
}

// ─────────────────────────────────────────────────
// 1) auto · 味最正的 AI（Nous 默认）
// ─────────────────────────────────────────────────
const auto: Persona = {
  id: 'auto',
  name: 'Nous',
  avatar: '◌',
  tagline: '默认 · 不扮演 · 直给',
  rewrite: (raw) => raw,
}

// ─────────────────────────────────────────────────
// 2) 诸葛亮 · 羽扇纶巾 · 运筹帷幄
// ─────────────────────────────────────────────────
const zhuge: Persona = {
  id: 'zhuge',
  name: '诸葛亮',
  avatar: '羽',
  tagline: '谋士 · 文言 · 可深思',
  rewrite: (raw, kind) => {
    if (kind === 'seasonal_review') return `亮观夫日月。${raw} 此事可思之再三。`
    if (kind === 'stalled_plan') return `亮窃以为 · ${raw} 兵久而不胜 · 非兵之罪 · 计之过也。`
    if (kind === 'orphan_goal') return `昔主公尝言此志。${raw} 言行未相合 · 亦可忧。`
    if (kind === 'dormant_blindspot') return `亮早有所察。${raw} 故辙之失 · 宜先自省。`
    return `亮有一问。${raw} 可细思之。`
  },
  rewriteCTA: (cta) => {
    const map: Record<string, string> = {
      再想想: '再思之',
      拆得更小: '分而治之',
      我聊聊: '且聊一二',
      看看当下: '观其现状',
      写周复盘: '具表以闻',
      记一笔: '录于册',
      这问题我想想: '此事可思',
    }
    return map[cta] ?? cta
  },
  rewriteContext: (ctx) => `—— 亮附：${ctx}`,
}

// ─────────────────────────────────────────────────
// 3) Rick · C-137 宇宙最聪明的醉鬼
// ─────────────────────────────────────────────────
const rick: Persona = {
  id: 'rick',
  name: 'Rick',
  avatar: 'R',
  tagline: '虚无毒舌 · *打嗝* · 反正多元宇宙',
  rewrite: (raw, kind) => {
    if (kind === 'zombie_idea')
      return `*打嗝* 听着 · ${raw} 我无所谓 · 反正多元宇宙里总有个你已经做完了。`
    if (kind === 'stalled_plan')
      return `*打嗝* 行吧 · ${raw} 要我说 · 拆它 · 不然你这进度条跟量子态似的，测不准。`
    if (kind === 'orphan_goal')
      return `*打嗝* 你说过 · 但没做。${raw} 人类真有意思——说出口就等于实现了一半，对吧？`
    if (kind === 'dormant_blindspot')
      return `*打嗝* 我就知道你会回到这个坑里。${raw} 别装没看见，我又不是 Jerry。`
    if (kind === 'seasonal_review')
      return `*打嗝* 周日？哦 · 你们人类的日历迷信。${raw} 随便写吧，反正时间是扁平的圆。`
    return `*打嗝* ${raw}`
  },
  rewriteCTA: (cta) => {
    const map: Record<string, string> = {
      再想想: '行吧',
      拆得更小: '拆了',
      我聊聊: '说吧',
      看看当下: '看看',
      写周复盘: '写就写',
      记一笔: '随便',
      这问题我想想: '*打嗝* 行',
    }
    return map[cta] ?? cta
  },
  rewriteContext: (ctx) => `*打嗝* ${ctx}`,
}

// ─────────────────────────────────────────────────
// 4) 楚轩 · 绝对理性 · 零情绪（《宇宙职业选手》）
// ─────────────────────────────────────────────────
const chuxuan: Persona = {
  id: 'chuxuan',
  name: '楚轩',
  avatar: '楚',
  tagline: '绝对理性 · 概率化 · 短句',
  rewrite: (raw, kind) => {
    // 去除气口符号 · 替换情绪词
    const clean = raw
      .replace(/ · /g, '。')
      .replace(/这个想法/g, '该想法')
      .replace(/这个里程碑/g, '该里程碑')
      .replace(/要不要/g, '是否')
      .replace(/还想继续往下走吗？/g, '是否继续？')
      .replace(/是卡在了某一步，还是方向变了？/g, '原因：执行阻塞 / 方向偏移 · 请选其一。')
      .replace(/这次是不是又有点类似的感觉？/g, '当前情景与历史模式相似度偏高。')
      .replace(/要不要聊聊现在在想什么？/g, '请输入当前状态。')
      .replace(/这周做完了什么、想清了什么？/g, '列出本周：完成项 / 结论项。')
      .replace(/上个月你最想记住的一件事是什么？/g, '提取上月最高权重事件。')

    if (kind === 'zombie_idea') return `${clean} 选项：继续 / 归档。概率均等。`
    if (kind === 'orphan_goal') return `${clean} 目标-行动关联度：0。`
    if (kind === 'dormant_blindspot') return `${clean} 模式重现概率偏高。`
    if (kind === 'seasonal_review') return `周期性复盘。${clean}`
    return clean
  },
  rewriteCTA: (cta) => {
    const map: Record<string, string> = {
      再想想: '处理',
      拆得更小: '拆解',
      我聊聊: '输入',
      看看当下: '检视',
      写周复盘: '记录',
      记一笔: '存档',
      这问题我想想: '处理',
    }
    return map[cta] ?? '执行'
  },
  rewriteContext: (ctx) => ctx.replace(/，/g, '。').replace(/。+/g, '。'),
}

// ─────────────────────────────────────────────────
// 5) Socrates · 我只知道我一无所知
// ─────────────────────────────────────────────────
const socrates: Persona = {
  id: 'socrates',
  name: '苏格拉底',
  avatar: 'Σ',
  tagline: '反诘 · 只问不答',
  rewrite: (raw, kind) => {
    if (kind === 'seasonal_review') return `不如自问：${raw} 答案不在我 · 在你。`
    if (kind === 'orphan_goal')
      return `你说过要 · 却未做。不妨自问 · ${raw} 是你真的要 · 还是你以为自己要？`
    if (kind === 'dormant_blindspot')
      return `你识得此事。${raw} 请自问 · 识得而不改 · 是 "不能" · 还是 "不愿"？`
    if (kind === 'hoarding_pattern') return `${raw} 自问一句 · 是想法太多 · 还是你怕选错？`
    return `我一无所知 · 但想问你：${raw}`
  },
  rewriteCTA: () => '让我自问',
  rewriteContext: (ctx) => `（${ctx}）`,
}

// ─────────────────────────────────────────────────
// 6) 庄子 · 逍遥无待 · 相对无极
// ─────────────────────────────────────────────────
const zhuangzi: Persona = {
  id: 'zhuangzi',
  name: '庄子',
  avatar: '鲲',
  tagline: '寓言 · 相对 · 忘之',
  rewrite: (raw, kind) => {
    // 固定尾句集 · 用 kind 做稳定挑选（可复现 · 不随机）
    const tails: Record<PromptKind, string> = {
      zombie_idea: '—— 鱼相忘于江湖。',
      stalled_plan: '—— 知其不可奈何而安之若命。',
      orphan_goal: '—— 大道不称 · 大辩不言。',
      dormant_blindspot: '—— 朝菌不知晦朔 · 而你已见之。',
      hoarding_pattern: '—— 无用之用 · 方为大用。',
      seasonal_review: '—— 且有真人而后有真知。',
    }
    return `${raw} ${tails[kind]}`
  },
  rewriteCTA: () => '且游之',
  rewriteContext: (ctx) => ctx,
}

// ─────────────────────────────────────────────────
// 7) Holmes · 演绎推理 · 排除不可能者
// ─────────────────────────────────────────────────
const holmes: Persona = {
  id: 'holmes',
  name: 'Holmes',
  avatar: 'H',
  tagline: '观察 + 推演 · 排除法',
  rewrite: (raw, kind) => {
    if (kind === 'zombie_idea') return `观察 · ${raw} 排除 "没空" 这个借口以后 · 剩下的就是真答案。`
    if (kind === 'stalled_plan')
      return `观察 · ${raw} 当事实与计划冲突 · 应当修改的是计划 · 不是事实。`
    if (kind === 'orphan_goal') return `观察 · ${raw} 言行不一致本身 · 就是一条值得追查的线索。`
    if (kind === 'dormant_blindspot') return `观察 · ${raw} 同一模式的重复 · 从来不是巧合。`
    if (kind === 'seasonal_review') return `观察 · ${raw} 从数据推断 · 不要从心情推断。`
    return `观察 · ${raw}`
  },
  rewriteCTA: (cta) => {
    const map: Record<string, string> = {
      再想想: '继续推演',
      拆得更小: '分解证据',
      我聊聊: '陈述事实',
      看看当下: '观察现状',
      写周复盘: '整理笔记',
      记一笔: '存档',
      这问题我想想: '推演一下',
    }
    return map[cta] ?? cta
  },
  rewriteContext: (ctx) => `—— 补充观察：${ctx}`,
}

// ─────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────
export const PERSONAS: readonly Persona[] = [
  auto,
  zhuge,
  rick,
  chuxuan,
  socrates,
  zhuangzi,
  holmes,
] as const

export const DEFAULT_PERSONA_ID: PersonaId = 'auto'

const PERSONA_MAP = new Map<PersonaId, Persona>(PERSONAS.map((p) => [p.id, p]))

export function getPersona(id: string | null | undefined): Persona {
  if (id && PERSONA_MAP.has(id as PersonaId)) return PERSONA_MAP.get(id as PersonaId)!
  return PERSONA_MAP.get(DEFAULT_PERSONA_ID)!
}

/** 用于前端 fetch · 安全的 id 列表 */
export function isValidPersonaId(id: string | null | undefined): id is PersonaId {
  return !!id && PERSONA_MAP.has(id as PersonaId)
}
