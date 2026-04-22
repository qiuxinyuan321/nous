/**
 * Persona 化开场白 · 纯字符串函数 · 不调 LLM
 * -------------------------------------------------------
 * 每次用户打开 workspace · 按 persona × 时段 × 今日/本周活动 生成一句话招呼。
 *
 * 输入特征（越简约越稳定）：
 *   - hour      当前小时 0-23（用户本地）
 *   - todayDone / todayTotal 今日聚焦完成 / 总数
 *   - weekIdeas 本周新增想法数
 *   - streak    连续打卡天数
 *
 * 时段切分（和人的生理节律对齐，而不是精确时钟）：
 *   早 5-10 · 午 11-14 · 晚 15-20 · 夜 其余
 *
 * 落款风格：
 *   - 每个 persona 的"标志口吻"必须保留（诸葛亮的"亮观"、Rick 的 *burp*、
 *     楚轩的第三人称、苏格拉底的反诘、庄子的寓言、Holmes 的 Data、auto 克制）
 *   - 不超过 60 字 · 用户一瞥可读
 *   - 不评判 · 不命令 · 不鼓励（即使"今日 0 完" · 也不是"加油"）
 */
import type { PersonaId } from './personas'

export interface GreetingInput {
  personaId: PersonaId
  hour: number // 0-23
  todayDone: number
  todayTotal: number
  weekIdeas: number
  streak: number
  locale: 'zh-CN' | 'en-US'
}

type Period = 'morning' | 'noon' | 'evening' | 'night'

function periodOf(hour: number): Period {
  if (hour >= 5 && hour <= 10) return 'morning'
  if (hour >= 11 && hour <= 14) return 'noon'
  if (hour >= 15 && hour <= 20) return 'evening'
  return 'night'
}

/** 今日是否已有进展 */
function hasProgress(i: GreetingInput): boolean {
  return i.todayDone > 0
}

/**
 * 生成一句话开场白。永远返回非空字符串 · 保证 UI 有话可说。
 * 外语 persona（Rick / Holmes / Socrates）的 en 由各自英文分支承担；
 * 中文 persona（诸葛亮 / 楚轩 / 庄子）在 en locale 下降级为 auto 的 en 文案。
 */
export function greetForPersona(i: GreetingInput): string {
  const p = periodOf(i.hour)
  const done = hasProgress(i)

  // 英语场景 · 中文 persona 降级到 auto · 外语 persona 自己处理
  if (i.locale === 'en-US') {
    switch (i.personaId) {
      case 'rick':
        return rickEn(p, i, done)
      case 'holmes':
        return holmesEn(p, i, done)
      case 'socrates':
        return socratesEn(p, i, done)
      default:
        return autoEn(p, i, done)
    }
  }

  // 中文场景 · 全员 · 外语 persona 也给中文变体（保留标志口吻）
  switch (i.personaId) {
    case 'zhuge':
      return zhugeZh(p, i, done)
    case 'rick':
      return rickZh(p, i, done)
    case 'chuxuan':
      return chuxuanZh(p, i, done)
    case 'socrates':
      return socratesZh(p, i, done)
    case 'zhuangzi':
      return zhuangziZh(p, i, done)
    case 'holmes':
      return holmesZh(p, i, done)
    case 'auto':
    default:
      return autoZh(p, i, done)
  }
}

// ───────────────────────────────────────────────
// auto · 克制 · Nous 本体
// ───────────────────────────────────────────────
function autoZh(p: Period, i: GreetingInput, done: boolean): string {
  if (p === 'morning')
    return done
      ? `清晨 · 今日已完 ${i.todayDone} 件 · 继续往下走。`
      : `清晨 · 今日尚未开动 · 从哪里落第一笔。`
  if (p === 'noon')
    return done
      ? `过午 · 今日 ${i.todayDone}/${i.todayTotal || '?'} · 节奏不错。`
      : `过午 · 今日尚空 · 一小步也算一步。`
  if (p === 'evening')
    return done
      ? `傍晚 · 今日 ${i.todayDone} 件已落 · 可收也可延。`
      : `傍晚 · 今日尚未开动 · 不必强求 · 记一笔也好。`
  return done
    ? `入夜 · 今日 ${i.todayDone} 件已毕 · 明日再议。`
    : `入夜 · 今日已静 · 想记什么再记。`
}
function autoEn(p: Period, i: GreetingInput, done: boolean): string {
  if (p === 'morning')
    return done
      ? `Morning. ${i.todayDone} done today — keep going.`
      : `Morning. Nothing moved yet — where to start?`
  if (p === 'noon')
    return done
      ? `Midday. ${i.todayDone}/${i.todayTotal || '?'} done — decent pace.`
      : `Midday. Still zero — one small step counts.`
  if (p === 'evening')
    return done
      ? `Evening. ${i.todayDone} done — you can stop or push.`
      : `Evening. Nothing today — a note is fine too.`
  return done
    ? `Night. ${i.todayDone} done. Tomorrow's another draft.`
    : `Night. Quiet day. Jot anything that lingers.`
}

// ───────────────────────────────────────────────
// 诸葛亮 · 出师表腔 · 亮观 · 窃以为 · 恭谨不僭
// ───────────────────────────────────────────────
function zhugeZh(p: Period, i: GreetingInput, done: boolean): string {
  const heading =
    p === 'morning'
      ? '君早。'
      : p === 'noon'
        ? '日过中。'
        : p === 'evening'
          ? '日欲暮。'
          : '夜深矣。'
  if (done) {
    if (i.streak >= 3)
      return `${heading}观君连${i.streak}日有事 · 今又毕${i.todayDone}事 · 亮甚慰。`
    return `${heading}今日所毕${i.todayDone}事 · 可继前绪 · 不必求速。`
  }
  if (i.weekIdeas > 0) return `${heading}本周新思${i.weekIdeas}事 · 择其要者一事 · 先图之。`
  return p === 'morning'
    ? `${heading}晨光熹微 · 今日尚未落子 · 何事先图？`
    : `${heading}今日尚未动笔 · 亮以为 · 一笔胜于万念。`
}

// ───────────────────────────────────────────────
// Rick · *burp* · 虚无但 Morty 仍在
// ───────────────────────────────────────────────
function rickZh(p: Period, i: GreetingInput, done: boolean): string {
  if (p === 'morning')
    return done
      ? `*burp* 早 Morty · 你居然已经干了 ${i.todayDone} 件 · 挺反常。`
      : `*burp* 早 · 又一个 ${i.weekIdeas ? '点子还在排队' : '什么都没有'}的 Tuesday。`
  if (p === 'noon')
    return done
      ? `*burp* 中午了 · ${i.todayDone} 件 done · 宇宙照常冷漠 · 继续。`
      : `*burp* 饭还没吃 · 活还没干 · 至少你一致。`
  if (p === 'evening')
    return done
      ? `*burp* 晚了 · ${i.todayDone} 件 · 虽然没意义 · 但干得比昨天多。`
      : `*burp* 傍晚 · 零产出 · 反正宇宙终归热寂 · 无所谓。`
  return done
    ? `*burp* 半夜 · ${i.todayDone} 件 done · 你这是真不困啊 Morty。`
    : `*burp* 夜里 · 什么都没发生 · 挺好 · 睡。`
}

// ───────────────────────────────────────────────
// 楚轩 · 第三人称 · 代价 / 价值 / 概率
// ───────────────────────────────────────────────
function chuxuanZh(p: Period, i: GreetingInput, done: boolean): string {
  if (done) return `楚轩记录：今日已完成 ${i.todayDone} 件 · 连续 ${i.streak} 日 · 行为一致性尚可。`
  if (i.weekIdeas > 2)
    return `楚轩认为 · 近 7 日录入 ${i.weekIdeas} 条新想法 · 完成项 0 · 产出/输入比需要矫正。`
  if (p === 'morning' || p === 'noon')
    return `楚轩建议 · 从收件箱中选取 1 项 · 投入 15 分钟 · 观察其后续价值。`
  return `楚轩认为 · 今日未行动本身即是数据 · 对楚轩而言这无所谓好坏。`
}

// ───────────────────────────────────────────────
// 苏格拉底 · 只问不答
// ───────────────────────────────────────────────
function socratesZh(p: Period, _i: GreetingInput, done: boolean): string {
  if (p === 'morning')
    return done ? '你今日已动 · 但你知道为何要动吗？' : '一日之始 · 你先问自己什么？'
  if (p === 'noon')
    return done ? '半日已过 · 所做之事 · 真是你要的吗？' : '半日未动 · 是懒 · 还是尚未看清？'
  if (p === 'evening')
    return done ? '日将尽 · 你所为者 · 你理解了吗？' : '日将尽 · 未动的一日 · 难道不值得审视吗？'
  return done
    ? '夜已深 · 你今日所为 · 是否经得起自己的追问？'
    : '夜已深 · 未经审视的一日 · 值得过吗？'
}
function socratesEn(p: Period, _i: GreetingInput, done: boolean): string {
  if (p === 'morning')
    return done
      ? 'You have already acted. Do you know why?'
      : 'Day begins. What will you first ask yourself?'
  if (p === 'noon')
    return done
      ? 'Half the day is spent. Was what you did what you wanted?'
      : 'Half the day, still. Is it sloth, or have you not yet seen?'
  if (p === 'evening')
    return done
      ? 'The day wanes. What you did — did you understand it?'
      : 'The day wanes. A still day also deserves examination.'
  return done
    ? 'Night. Can today’s acts withstand your own questioning?'
    : 'An unexamined day — is it worth living?'
}

// ───────────────────────────────────────────────
// 庄子 · 寓言 · 相对主义
// ───────────────────────────────────────────────
function zhuangziZh(p: Period, i: GreetingInput, done: boolean): string {
  if (p === 'morning')
    return done
      ? `朝菌不知晦朔 · 你今日已动 ${i.todayDone} 事 · 也是一种尘世的圆满。`
      : '鹪鹩巢于深林不过一枝 · 今日未动 · 也不必急。'
  if (p === 'noon')
    return done
      ? `庖丁解牛游刃 · 今日 ${i.todayDone} 事顺手 · 便如刀刃过隙。`
      : '鱼相忘于江湖 · 今日尚空 · 不记也可。'
  if (p === 'evening')
    return done ? '日落 · 今所成与所未成 · 皆是梦蝶的一翼。' : '日落 · 事与不事 · 于道无别。'
  return done ? '夜 · 今日所为皆为浮云 · 亦足矣。' : '夜 · 北冥之鱼化而为鸟 · 时候未到而已。'
}

// ───────────────────────────────────────────────
// Holmes · Data! · 对 Watson 式陈述
// ───────────────────────────────────────────────
function holmesZh(p: Period, i: GreetingInput, done: boolean): string {
  if (done) {
    return `观察：今日 ${i.todayDone}/${i.todayTotal || '?'} · 连续 ${i.streak} 日 · 本周新案 ${i.weekIdeas} 件。Watson · 数据正在汇集。`
  }
  if (i.weekIdeas >= 5)
    return `观察：本周 ${i.weekIdeas} 条想法进入登记册 · 但 0 件推进。模式鲜明 · 你自己最清楚。`
  if (p === 'morning' || p === 'noon')
    return `晨间记录：零行动。排除不可能 · 剩下的便是：此刻尚未开始 · 不多不少。`
  return `日志：今日空。无须修饰 · 数据就是数据。`
}
function holmesEn(p: Period, i: GreetingInput, done: boolean): string {
  if (done)
    return `Observation: ${i.todayDone}/${i.todayTotal || '?'} today, streak ${i.streak}, ${i.weekIdeas} new cases this week. Watson, the data is accumulating.`
  if (i.weekIdeas >= 5)
    return `Observation: ${i.weekIdeas} ideas filed this week, 0 advanced. A pattern, clearly. You already know.`
  if (p === 'morning' || p === 'noon')
    return `Morning log: zero action. Eliminate the impossible; what remains is — nothing started yet. Nothing more.`
  return `Log: day empty. No embellishment. Data is data.`
}

// ───────────────────────────────────────────────
// Rick · en
// ───────────────────────────────────────────────
function rickEn(p: Period, i: GreetingInput, done: boolean): string {
  if (p === 'morning')
    return done
      ? `*burp* Morning, Morty. You already shipped ${i.todayDone}. Suspicious.`
      : `*burp* Morning. Another Tuesday. ${i.weekIdeas ? 'Ideas piling up.' : 'Nothing, as usual.'}`
  if (p === 'noon')
    return done
      ? `*burp* Noon. ${i.todayDone} done. Universe still doesn't care. Keep going.`
      : `*burp* Lunchtime. Nothing eaten, nothing done. At least consistent.`
  if (p === 'evening')
    return done
      ? `*burp* Evening. ${i.todayDone} shipped. Meaningless — but still more than yesterday.`
      : `*burp* Evening. Zero. Heat death's coming anyway, whatever.`
  return done
    ? `*burp* Late. ${i.todayDone} done. Not sleeping, huh Morty.`
    : `*burp* Night. Nothing happened. Fine. Sleep.`
}
