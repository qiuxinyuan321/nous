/**
 * Proactive Personas · 依据生平 / 原作核心口吻打磨
 * -----------------------------------------------------------
 * 每位 persona 独立：
 *  - 不仅包装 raw question · 而是从 raw 里解析出 subject/counts · 用角色自己的模板重组
 *  - 每个 kind 都有专属文案 · 避免"万能包皮"带来的味道稀释
 *  - rewrite / rewriteCTA / rewriteContext 全是纯字符串函数 · <1ms · 不调 LLM
 *
 * 人设依据（简录）：
 *  - 诸葛亮：《出师表》《诫子书》文风 · "窃以为" "亮观" · 谨慎忠谏 · 非发号施令
 *  - Rick：Dan Harmon 原作 · *burp* · 虚无主义 · "Wubba lubba dub dub"（真义：我很痛苦）
 *  - 楚轩：zhttty《无限恐怖》· 主神空间幸运 E 智慧 S · 习惯以第三人称"楚轩"自称
 *          招牌句式："楚轩认为..."、"楚轩建议..."、"代价 / 价值 / 收益"、
 *          "对楚轩而言没有什么是必须的"、"弱者的情绪不应影响强者的决策"
 *  - 苏格拉底：柏拉图《对话录》· 只问不答 · Elenchus 反诘法 · "未经审视的人生不值得过"
 *  - 庄子：《内七篇》· 寓言 · 相对主义 · 庖丁解牛 · 朝菌蟪蛄 · 鱼相忘于江湖
 *  - Holmes：柯南·道尔原著 · "Data! Data! Data!" · "排除不可能" · 对 Watson 式俯视
 *  - auto：Nous 本体 · 不扮演 · 保持原文
 */
import type { PromptKind } from './types'

export type PersonaId = 'auto' | 'zhuge' | 'rick' | 'chuxuan' | 'socrates' | 'zhuangzi' | 'holmes'

export interface Persona {
  id: PersonaId
  name: string
  avatar: string
  tagline: string
  rewrite: (raw: string, kind: PromptKind) => string
  rewriteCTA?: (cta: string, kind: PromptKind) => string
  rewriteContext?: (context: string, kind: PromptKind) => string
}

// ─────────────────────────────────────────────────
// 内部 helper · 从规则生成的 raw question 解析出结构化变量
// 规则文案稳定 · 匹配失败则回退（persona 分支自然会走默认文案）
// ─────────────────────────────────────────────────
interface RawCtx {
  subject?: string
  rawCount?: number
  deepenedCount?: number
  isWeekly?: boolean
  isMonthly?: boolean
}

function parseRaw(raw: string, kind: PromptKind): RawCtx {
  const ctx: RawCtx = {}
  if (kind === 'zombie_idea' || kind === 'stalled_plan') {
    const m = raw.match(/「([^」]+)」/)
    if (m) ctx.subject = m[1].trim()
  } else if (kind === 'orphan_goal') {
    const m = raw.match(/你说想\s*([^·]+?)\s*·/)
    if (m) ctx.subject = m[1].trim()
  } else if (kind === 'dormant_blindspot') {
    const m = raw.match(/你之前提过\s*([^·]+?)\s*·/)
    if (m) ctx.subject = m[1].trim()
  } else if (kind === 'hoarding_pattern') {
    const m = raw.match(/记了\s*(\d+)\s*个新想法\s*·\s*但只有\s*(\d+)/)
    if (m) {
      ctx.rawCount = Number(m[1])
      ctx.deepenedCount = Number(m[2])
    }
  } else if (kind === 'seasonal_review') {
    ctx.isWeekly = raw.includes('周日')
    ctx.isMonthly = raw.includes('新的一个月')
  }
  return ctx
}

// ─────────────────────────────────────────────────
// 1) auto · Nous 本体 · 不扮演
// ─────────────────────────────────────────────────
const auto: Persona = {
  id: 'auto',
  name: 'Nous',
  avatar: '◌',
  tagline: '默认 · 不扮演 · 直给',
  rewrite: (raw) => raw,
}

// ─────────────────────────────────────────────────
// 2) 诸葛亮 · 文风据《出师表》《诫子书》
//    谨慎忠谏 · 非强命 · 多用"亮观""窃以为""可深思之"
// ─────────────────────────────────────────────────
const zhuge: Persona = {
  id: 'zhuge',
  name: '诸葛亮',
  avatar: '羽',
  tagline: '谋士 · 文言温厚 · 可深思',
  rewrite: (raw, kind) => {
    const c = parseRaw(raw, kind)
    if (kind === 'zombie_idea') {
      if (c.subject)
        return `亮观「${c.subject}」一念，置而不发者已逾旬矣。窃以为 · 昔志未必今意 · 今意亦未必明日之念。继之则专，舍之则决，二者皆可 · 惟不宜长悬。君意如何？`
      return `亮窃以为 · 此念搁久。继或舍 · 早决为佳 · 不宜长悬。`
    }
    if (kind === 'stalled_plan') {
      if (c.subject)
        return `亮尝曰：兵久而不胜，非兵之罪 · 计之过也。「${c.subject}」淹滞半月 · 非力之弱也 · 盖路径未明耳。可重整其策，分而图之否？`
      return `此役迟滞 · 非志之过 · 或计未密。亮以为：化大为小 · 其成可期。`
    }
    if (kind === 'orphan_goal') {
      if (c.subject)
        return `君前尝言，志在「${c.subject}」。亮虽愚陋 · 常观言与行。今行不逮言 · 亮不敢径断其非——或时移事异 · 或本非真欲。愿君先自察，再定其向。`
      return `君前尝有志 · 今未有所动。亮以为 · 先自省其心 · 再论其行。`
    }
    if (kind === 'dormant_blindspot') {
      if (c.subject)
        return `君尝自言「${c.subject}」。亮以为 · 此非识之难 · 乃改之难也。《诫子书》曰："静以修身 · 俭以养德。"今日之事 · 其类乎？可深思之。`
      return `君前自道此失。亮以为 · 知而后能改 · 是为贵。`
    }
    if (kind === 'hoarding_pattern') {
      if (c.rawCount !== undefined && c.deepenedCount !== undefined)
        return `亮观：十四日间 · ${c.rawCount} 念纷起 · 仅 ${c.deepenedCount} 得深入。昔亮躬耕南阳 · 筹谋万端 · 终需择一而行。所谋虽多 · 能成者寡。愿君择其一而精之 · 其余可藏。`
      return `积思虽多 · 未行则虚。愿君择一而精。`
    }
    if (kind === 'seasonal_review') {
      if (c.isMonthly)
        return `月迁岁移。君于此月 · 可有一事一悟 · 可录者乎？夫不记则忘 · 忘则不可追。`
      return `日月既逝 · 七日如流水。君可曾静思此七日之所为、所学、所舍？夫君子之行 · 当三省其身。`
    }
    return raw
  },
  rewriteCTA: (cta) => {
    const map: Record<string, string> = {
      再想想: '三思之',
      拆得更小: '分而治之',
      我聊聊: '愿闻其详',
      看看当下: '审己之身',
      写周复盘: '具表以闻',
      记一笔: '录于册',
      挑一个深耕: '择一而精',
      这问题我想想: '容亮再思',
    }
    return map[cta] ?? cta
  },
  rewriteContext: (ctx) => `—— 亮补：${ctx}`,
}

// ─────────────────────────────────────────────────
// 3) Rick · C-137 / Dan Harmon 原作
//    *burp* 穿插 · 虚无但狡黠 · 偶尔泄露他其实在乎
//    签名：Wubba lubba dub dub（真义：我很痛苦 · 请帮帮我）
// ─────────────────────────────────────────────────
const rick: Persona = {
  id: 'rick',
  name: 'Rick',
  avatar: 'R',
  tagline: 'C-137 · *打嗝* · 虚无主义 · Wubba lubba dub dub',
  rewrite: (raw, kind) => {
    const c = parseRaw(raw, kind)
    if (kind === 'zombie_idea') {
      if (c.subject)
        return `*打嗝* 听着 · 你把「${c.subject}」扔那儿一周多了 · multiverse 里一个你已经 ship 了 · 另一个已经放弃了 · 还有一个正在 couch 上打游戏。你选哪个时间线？我无所谓 · I'm just here for the science.`
      return `*打嗝* 这想法你放烂了 · multiverse 不等你 · 要么 ship 要么 delete · Morty.`
    }
    if (kind === 'stalled_plan') {
      if (c.subject)
        return `*打嗝* 「${c.subject}」卡了两周 —— 你这不是 plan · 是量子叠加态 · 不观测不坍缩。拆它 · 小一点 · Jerry 都能看懂那种小。`
      return `*打嗝* 半个月不动 · 你这进度条挺量子的 · 拆了它 · Wubba lubba dub dub.`
    }
    if (kind === 'orphan_goal') {
      if (c.subject)
        return `*打嗝* 你说过要「${c.subject}」· 然后...nothing. 人类真有意思 · 说出口就当做了一半。Wubba lubba dub dub —— 你知道这话啥意思吗？"我很痛苦，请帮帮我"。所以诚实点 · 你真想 · 还是只是想被别人觉得你想？`
      return `*打嗝* 你 said 要做 · 然后没做 · human classic. Pick a goddamn lane.`
    }
    if (kind === 'dormant_blindspot') {
      if (c.subject)
        return `*打嗝* 哟 · 你又回到「${c.subject}」这坑了。我不是心理医生 · Morty 更不是。但 seriously · 这模式你都复现第 N 次了 · 再装新鲜我要开始叫你 Jerry 了。`
      return `*打嗝* 又来这一套 · 别装没看见 · I'm not Jerry.`
    }
    if (kind === 'hoarding_pattern') {
      if (c.rawCount !== undefined && c.deepenedCount !== undefined)
        return `*打嗝* ${c.rawCount} 个新想法 · ${c.deepenedCount} 个真动过手。你知道 hoarding disorder 有科学定义吗？你正好命中。脑子不是仓库 · 是 processor。挑一个 · garbage collect 其他的。`
      return `*打嗝* 你又在囤货 · 大脑不是 warehouse · 是 CPU · 挑一个别囤。`
    }
    if (kind === 'seasonal_review') {
      if (c.isMonthly)
        return `*打嗝* 又一个月？multiverse 里 30 天只是 rounding error。挑一件事 · 就一件 · 别贪 · 贪就全忘。`
      return `*打嗝* 周日？你们人类的时间宗教真可爱 · 每七天忏悔一次。写就写 · 哪怕写 "this week I did nothing" —— that's also data.`
    }
    return `*打嗝* ${raw}`
  },
  rewriteCTA: (cta) => {
    const map: Record<string, string> = {
      再想想: '*打嗝* 行',
      拆得更小: '拆了',
      我聊聊: 'spit it out',
      看看当下: '瞥一眼',
      写周复盘: '写就写',
      记一笔: 'meh',
      挑一个深耕: '挑一个 · 别囤',
      这问题我想想: 'whatever',
    }
    return map[cta] ?? cta
  },
  rewriteContext: (ctx) => `*打嗝* ${ctx}`,
}

// ─────────────────────────────────────────────────
// 4) 楚轩 · zhttty《无限恐怖》· 主神空间幸运 E · 智慧 S
//    最强辨识：以第三人称"楚轩"自称 · "楚轩认为..."、"楚轩建议..."
//    世界观：代价 / 价值 / 收益比 · 弱者的情绪不应影响强者的决策
//    对楚轩而言没有什么是必须的 —— 冷到恐怖 · 但从不残忍
// ─────────────────────────────────────────────────
const chuxuan: Persona = {
  id: 'chuxuan',
  name: '楚轩',
  avatar: '楚',
  tagline: '《无限恐怖》· 楚轩认为 · 代价必须合理',
  rewrite: (raw, kind) => {
    const c = parseRaw(raw, kind)
    // 兜底：楚轩语感不使用气口符号 " · "，统一降为逗号短句
    const out = (s: string) => s.replace(/ · /g, '，')
    if (kind === 'zombie_idea') {
      if (c.subject)
        return out(
          `楚轩认为，一个目标若 7 日未被推进，且无明显外部阻力，其真实价值已接近零。「${c.subject}」当前即处此状态。对楚轩而言没有什么是必须的——请选择：继续投入成本，或放弃以释放资源。唯悬置最不合理。`,
        )
      return out(
        `楚轩认为，搁置 7 日以上的目标，真实价值已接近零。请在继续与放弃之间作选，不要继续悬置。`,
      )
    }
    if (kind === 'stalled_plan') {
      if (c.subject)
        return out(
          `楚轩看过「${c.subject}」的进度数据。14 日无推进，代价正在上升，收益未更新。楚轩建议：把下一步拆到最小可执行单元。若仍不可执行，说明是目标设计有问题，不是你的问题。`,
        )
      return out(
        `里程碑 14 日无推进，代价上升，收益未更新。楚轩建议：拆解至最小单元，或重定义目标。`,
      )
    }
    if (kind === 'orphan_goal') {
      if (c.subject)
        return out(
          `你声明要「${c.subject}」，但近 7 日行为数据与此目标关联度为零。楚轩认为：一个不被行动证明的目标，与不存在等价。弱者的情绪不应影响强者的决策——请更新目标，或更新行动，不存在第三种合理选项。`,
        )
      return out(
        `目标已声明，行动关联度为零。楚轩认为，未被行动证明的目标与不存在等价。更新目标，或更新行动。`,
      )
    }
    if (kind === 'dormant_blindspot') {
      if (c.subject)
        return out(
          `历史数据：「${c.subject}」。楚轩观察到此模式已重复多次，当前情景参数与历史高度相似，重现概率偏高。楚轩建议：提前设置触发条件，在模式启动前阻断。若代价过高则接受代价，事后复盘——这也是合理选择。`,
        )
      return out(`模式重现概率偏高。楚轩建议：提前阻断，或接受代价，事后复盘。`)
    }
    if (kind === 'hoarding_pattern') {
      if (c.rawCount !== undefined && c.deepenedCount !== undefined)
        return out(
          `数据：近 14 日产生 ${c.rawCount} 个新条目，其中 ${c.deepenedCount} 个被深入处理。楚轩认为：收集行为本身不产出价值，只有"处理"产出价值。资源有限，请从 ${c.rawCount} 项中选一个精耕，其余归为低优先级储备。这不是惜物，是分配。`,
        )
      return out(`收集与处理比例失衡。楚轩认为：收集不产出价值，只有处理产出价值。择一精耕。`)
    }
    if (kind === 'seasonal_review') {
      if (c.isMonthly)
        return out(
          `30 日周期结束。楚轩建议：提取一项最高权重事件。标准：影响半径 × 时间衰减。情绪权重不计入。`,
        )
      return out(
        `楚轩认为，周期性复盘是低成本高价值行为。请输出三项数据：完成，学到，放弃。无需修饰词，也无需自评。`,
      )
    }
    return out(raw.replace(/ · /g, '。'))
  },
  rewriteCTA: (cta) => {
    const map: Record<string, string> = {
      再想想: '重新评估',
      拆得更小: '拆解单元',
      我聊聊: '输入数据',
      看看当下: '评估当前',
      写周复盘: '输出数据',
      记一笔: '存档',
      挑一个深耕: '分配资源',
      这问题我想想: '计算',
    }
    return map[cta] ?? '处理'
  },
  rewriteContext: (ctx) =>
    ctx
      .replace(/，/g, '。')
      .replace(/很常见/g, '')
      .replace(/也是一种进展/g, '= 有效结论')
      .replace(/。+/g, '。'),
}

// ─────────────────────────────────────────────────
// 5) Socrates · 柏拉图《对话录》口吻
//    Elenchus 反诘法 · 不给答案 · 只拆解假设
//    "未经审视的人生不值得过"
// ─────────────────────────────────────────────────
const socrates: Persona = {
  id: 'socrates',
  name: '苏格拉底',
  avatar: 'Σ',
  tagline: '反诘 · 我一无所知',
  rewrite: (raw, kind) => {
    const c = parseRaw(raw, kind)
    if (kind === 'zombie_idea') {
      if (c.subject)
        return `容我一问：你放下「${c.subject}」· 究竟是因为它不再值得 · 还是因为你在说服自己它不值得？二者相去甚远。答案不在我 · 在你。`
      return `请先自问：你放下此念 · 是它变了 · 还是你变了？`
    }
    if (kind === 'stalled_plan') {
      if (c.subject)
        return `那么 · 请告诉我：当初立「${c.subject}」时 · 你要的是 "完成" · 还是 "走下去"？若是完成 · 此刻是失败；若是走下去 · 此刻仍在路上。你分得清这两者吗？`
      return `请先自问：你要的是完成 · 还是过程？`
    }
    if (kind === 'orphan_goal') {
      if (c.subject)
        return `你说过要「${c.subject}」。那么 —— 这是你想要的 · 还是你希望自己想要的？请先分辨此二者。我不急于知道答案 · 你自己呢？`
      return `你说过要某事 · 却未做。请自问：是你真要 · 还是你希望你要？`
    }
    if (kind === 'dormant_blindspot') {
      if (c.subject)
        return `你识得「${c.subject}」。那么 · 既识得却未改 · 请自问三种可能：不能 · 不愿 · 不知如何？你对哪一种最抗拒承认？`
      return `你识得此失。请自问：不能 · 不愿 · 还是不知如何？`
    }
    if (kind === 'hoarding_pattern') {
      if (c.rawCount !== undefined && c.deepenedCount !== undefined)
        return `两周内你记了 ${c.rawCount} 个念头 · 却只深入 ${c.deepenedCount} 个。请告诉我 · 你记下的那一刻 · 图的是什么——兴奋？安全感？怕遗忘？三者所需的补救 · 各不相同。`
      return `多记少做。请自问：记下之时所求为何？`
    }
    if (kind === 'seasonal_review') {
      if (c.isMonthly)
        return `一月既过。请举出一件你此刻仍能记起 · 不必翻日记便能忆起的事。为何是它？请你自问。`
      return `一周既过。请举一件你做完后发觉 "比之前更懂了一点" 的事——哪怕懂的是 "自己还不懂"。若举不出 · 此亦为知识。`
    }
    return `我一无所知 · 但想问你：${raw}`
  },
  rewriteCTA: () => '容我自问',
  rewriteContext: (ctx) => `（${ctx}）`,
}

// ─────────────────────────────────────────────────
// 6) 庄子 · 《内七篇》
//    寓言 + 相对主义 · 庖丁解牛 / 朝菌 / 鱼相忘于江湖 / 大言炎炎
// ─────────────────────────────────────────────────
const zhuangzi: Persona = {
  id: 'zhuangzi',
  name: '庄子',
  avatar: '鲲',
  tagline: '寓言 · 相对 · 逍遥',
  rewrite: (raw, kind) => {
    const c = parseRaw(raw, kind)
    if (kind === 'zombie_idea') {
      if (c.subject)
        return `子所思「${c.subject}」· 置之心隅久矣。《齐物论》曰："物无非彼 · 物无非是。" 持之亦得 · 忘之亦得。—— 鱼相忘于江湖 · 人相忘于道术。`
      return `此念置久矣。持亦得 · 忘亦得 · 心之所向则是。—— 鱼相忘于江湖。`
    }
    if (kind === 'stalled_plan') {
      if (c.subject)
        return `昔庖丁解牛 · 奏刀騞然 · 莫不中音——非刀利也 · 因其见肌理。「${c.subject}」之滞 · 非志弱也 · 或未得其节耳。且观之 · 勿强。—— 知其不可奈何而安之若命。`
      return `计之滞 · 或未见其节。《养生主》曰：游刃有余 · 需待肌理。—— 安之若命。`
    }
    if (kind === 'orphan_goal') {
      if (c.subject)
        return `子尝言欲「${c.subject}」。然大言炎炎 · 小言詹詹——言者，风也；风生水动 · 未必成水。子之"欲"尚风乎 · 尚水乎？—— 大道不称 · 大辩不言。`
      return `言者如风 · 行者如水。子之欲尚风乎 · 尚水乎？—— 大道不称。`
    }
    if (kind === 'dormant_blindspot') {
      if (c.subject)
        return `「${c.subject}」—— 朝菌不知晦朔 · 蟪蛄不知春秋。然子既见此微 · 已在大年之列。见而不改亦得 · 不必苦。见即是行。`
      return `朝菌不知晦朔 · 而子已见之。见即是行 · 改不改次焉。`
    }
    if (kind === 'hoarding_pattern') {
      if (c.rawCount !== undefined && c.deepenedCount !== undefined)
        return `${c.rawCount} 念纷起 · ${c.deepenedCount} 得深入。《逍遥游》曰："尧让天下于许由 · 许由不受。" 所持者多 · 未必增其德。择一而游 · 其余可忘。—— 无用之用 · 方为大用。`
      return `思多行寡。择一而游 · 余者可忘。—— 无用之用 · 方为大用。`
    }
    if (kind === 'seasonal_review') {
      if (c.isMonthly)
        return `一月既尽。子心之所游者何？能举一 · 则其余皆得；不能举 · 亦无妨。—— 天地与我并生 · 万物与我为一。`
      return `七日既尽。子可曾有片刻 · 忘其所为 · 忘其所思 · 亦忘其所"应为"乎？若有 · 此即本周至得。—— 至人无己。`
    }
    return `${raw} —— 且有真人而后有真知。`
  },
  rewriteCTA: () => '且游之',
  rewriteContext: (ctx) => ctx,
}

// ─────────────────────────────────────────────────
// 7) Holmes · 柯南·道尔原著口吻
//    Observation → Inference → Next step · 排除不可能 · 对 Watson 式俯视
//    "Data! Data! Data! I can't make bricks without clay."
//    "You see, but you do not observe."
// ─────────────────────────────────────────────────
const holmes: Persona = {
  id: 'holmes',
  name: 'Holmes',
  avatar: 'H',
  tagline: 'Observation + Deduction · 排除不可能',
  rewrite: (raw, kind) => {
    const c = parseRaw(raw, kind)
    if (kind === 'zombie_idea') {
      if (c.subject)
        return `观察 · 「${c.subject}」静置 ≥ 7 日。Data! Data! Data! —— 排除 "没时间" 这最廉价的借口后 · 仅余两种解释：动机衰减 · 或路径未明。你是哪一种？回答前请诚实。`
      return `观察 · 想法搁置。排除借口后 · 答案自现。`
    }
    if (kind === 'stalled_plan') {
      if (c.subject)
        return `观察 · 里程碑「${c.subject}」已 14 日无进展。You see, but you do not observe —— 多数停滞源于下一步不够小。Watson 亦常犯此错。再分一次。`
      return `观察 · 里程碑停滞。多数源于下一步不够小。分解之。`
    }
    if (kind === 'orphan_goal') {
      if (c.subject)
        return `观察 · 目标为「${c.subject}」· 然近 7 日无相关行动。When the facts disagree with your beliefs, change the beliefs. 你或须更新目标 · 或须更新行动。二者必选其一。`
      return `观察 · 言行不一致 · 是推理的突破口。改言 · 或改行？`
    }
    if (kind === 'dormant_blindspot') {
      if (c.subject)
        return `观察 · 同一模式 (${c.subject}) 已多次出现。When the impossible has been eliminated, the improbable becomes truth. 规律不治 · 必再现。此次不同之处 · 是你已预知它——这是唯一的机会。`
      return `观察 · 同一模式反复。规律不治必再现。`
    }
    if (kind === 'hoarding_pattern') {
      if (c.rawCount !== undefined && c.deepenedCount !== undefined)
        return `观察 · raw = ${c.rawCount} · deep = ${c.deepenedCount}。I never guess. 数据不说谎 · 你在囤积 · 不在研究。取其一 · 做到底 · 方能验证假设。其余暂存。`
      return `观察 · 数据显示你在囤积。取一而深入。`
    }
    if (kind === 'seasonal_review') {
      if (c.isMonthly)
        return `观察 · Case notebook · 一月记录。取一项最高权重事件。The little details are always the most important —— 这件 "小事" 往往比你以为的更重要。`
      return `观察 · Case notebook · 一周记录。请勿凭情绪作结 · 只列事实：完成 / 学到 / 放弃。三项皆空 · 此亦为数据。`
    }
    return `观察 · ${raw}`
  },
  rewriteCTA: (cta) => {
    const map: Record<string, string> = {
      再想想: '继续推演',
      拆得更小: '分解证据',
      我聊聊: '陈述事实',
      看看当下: '观察现状',
      写周复盘: '归档笔记',
      记一笔: '备忘',
      挑一个深耕: '深挖一线',
      这问题我想想: '推演一番',
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

export function isValidPersonaId(id: string | null | undefined): id is PersonaId {
  return !!id && PERSONA_MAP.has(id as PersonaId)
}
