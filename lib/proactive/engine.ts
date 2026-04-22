/**
 * Proactive engine · 并发跑规则 · 合并 · 上限 3 条
 * -----------------------------------------------------------
 * LLM 润色留 hook · 默认跳过（成本控制 + 可离线）
 * 频率控制：dismiss 追踪放在客户端 localStorage · 服务端不持久化
 */

import type { ProactivePrompt, ProactiveResponse } from './types'
import {
  findDormantBlindspots,
  findOrphanGoals,
  findSeasonalReview,
  findStalledPlans,
  findZombieIdeas,
  type RuleContext,
} from './rules'

const MAX_PROMPTS = 3

export interface GenerateOptions extends RuleContext {
  /** 是否跑 LLM 润色（将来再开，当前 no-op） */
  useLLM?: boolean
}

export async function generatePrompts(opts: GenerateOptions): Promise<ProactiveResponse> {
  const ctx: RuleContext = { userId: opts.userId, now: opts.now }

  const results = await Promise.allSettled([
    findZombieIdeas(ctx),
    findStalledPlans(ctx),
    findOrphanGoals(ctx),
    findDormantBlindspots(ctx),
    findSeasonalReview(ctx),
  ])

  const merged: ProactivePrompt[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') merged.push(...r.value)
  }

  // 按 severity alert > gentle · 同 kind 最多 1 条 · 同 key 去重
  const seenKey = new Set<string>()
  const seenKind = new Set<string>()
  const deduped: ProactivePrompt[] = []
  const take = (p: ProactivePrompt) => {
    if (seenKey.has(p.key) || seenKind.has(p.kind)) return
    seenKey.add(p.key)
    seenKind.add(p.kind)
    deduped.push(p)
  }
  // alert 优先
  for (const p of merged) if (p.severity === 'alert') take(p)
  for (const p of merged) if (p.severity === 'gentle') take(p)

  const prompts = deduped.slice(0, MAX_PROMPTS)

  return {
    prompts,
    generatedAt: (opts.now ?? new Date()).toISOString(),
    usedLLM: false,
  }
}
