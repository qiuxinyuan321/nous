/**
 * 主动问规则引擎 · 5 条典型 INTP 卡点
 * -----------------------------------------------------------
 * 每条规则是独立函数 · 并发跑 · 输出 ProactivePrompt[] 合并
 * 规则本身不调 LLM · 只做数据查询 + 模板化文案
 * 上层 engine.ts 可选把 question 送给 LLM 做二次润色
 */

import { prisma } from '@/lib/db'
import type { ProactivePrompt } from './types'

const ZOMBIE_DAYS = 7
const STALLED_DAYS = 14
const ORPHAN_DAYS = 7
const BLINDSPOT_DAYS = 30

export interface RuleContext {
  userId: string
  /** 当前时间 · 便于测试注入 */
  now?: Date
}

const day = 24 * 3600 * 1000

/** 1. 僵尸想法 · status=raw/refining 且 ZOMBIE_DAYS+ 天未动 */
export async function findZombieIdeas(ctx: RuleContext): Promise<ProactivePrompt[]> {
  const now = ctx.now ?? new Date()
  const threshold = new Date(now.getTime() - ZOMBIE_DAYS * day)

  const rows = await prisma.idea.findMany({
    where: {
      userId: ctx.userId,
      status: { in: ['raw', 'refining'] },
      updatedAt: { lte: threshold },
    },
    orderBy: { updatedAt: 'asc' },
    take: 3,
  })

  return rows.map((r) => ({
    key: `zombie_idea:${r.id}`,
    kind: 'zombie_idea' as const,
    question: `「${r.title || r.rawContent.slice(0, 20)}」这个想法搁置一周多了 · 还想继续往下走吗？`,
    context: '如果不想继续，归档也是结论。',
    severity: 'gentle' as const,
    relatedRef: { type: 'idea' as const, id: r.id },
    ctaLabel: '再想想',
    generatedAt: now.toISOString(),
  }))
}

/** 2. 卡住的 Plan · 活跃 milestone 已超 STALLED_DAYS 无 task 推进 */
export async function findStalledPlans(ctx: RuleContext): Promise<ProactivePrompt[]> {
  const now = ctx.now ?? new Date()
  const threshold = new Date(now.getTime() - STALLED_DAYS * day)

  // 找活跃 milestone · 它的 tasks 里最新 completedAt < threshold (或全部没完成)
  const milestones = await prisma.milestone.findMany({
    where: {
      plan: { idea: { userId: ctx.userId } },
      status: 'active',
    },
    include: {
      plan: { include: { idea: { select: { id: true, title: true } } } },
      tasks: {
        where: { status: 'done' },
        orderBy: { completedAt: 'desc' },
        take: 1,
      },
    },
    take: 5,
  })

  const stalled = milestones.filter((m) => {
    const lastDone = m.tasks[0]?.completedAt
    return !lastDone || lastDone.getTime() < threshold.getTime()
  })

  return stalled.slice(0, 2).map((m) => ({
    key: `stalled_plan:${m.id}`,
    kind: 'stalled_plan' as const,
    question: `「${m.title}」这个里程碑半个月没推进 · 是卡在了某一步，还是方向变了？`,
    context: `所属想法：${m.plan.idea.title ?? '无题'}`,
    severity: 'alert' as const,
    relatedRef: { type: 'idea' as const, id: m.plan.idea.id },
    ctaLabel: '拆得更小',
    generatedAt: now.toISOString(),
  }))
}

/** 3. 目标无行动 · memory.kind=goal · 过去 ORPHAN_DAYS 天没有相关内容（tags 不重叠就判定 orphan） */
export async function findOrphanGoals(ctx: RuleContext): Promise<ProactivePrompt[]> {
  const now = ctx.now ?? new Date()
  const threshold = new Date(now.getTime() - ORPHAN_DAYS * day)

  const goals = await prisma.memory.findMany({
    where: {
      userId: ctx.userId,
      kind: 'goal',
      importance: { gte: 3 }, // 至少 3 分重要性才值得提醒
    },
    orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
    take: 3,
  })

  if (goals.length === 0) return []

  // 过去 ORPHAN_DAYS 的活跃实体数
  const [recentIdeasCount, recentTasksCount] = await Promise.all([
    prisma.idea.count({
      where: { userId: ctx.userId, updatedAt: { gte: threshold } },
    }),
    prisma.task.count({
      where: {
        milestone: { plan: { idea: { userId: ctx.userId } } },
        completedAt: { gte: threshold },
      },
    }),
  ])

  // 如果用户近期很活跃（>= 5 条）· 不提醒 goal · 避免打扰
  if (recentIdeasCount + recentTasksCount >= 5) return []

  // 取第一条最重要的 goal
  const g = goals[0]
  return [
    {
      key: `orphan_goal:${g.id}`,
      kind: 'orphan_goal' as const,
      question: `上次你说想 ${g.content} · 最近这周没有直接相关的动作 · 要不要聊聊现在在想什么？`,
      context: '想法和目标对不上，很常见。先放下目标也是一种进展。',
      severity: 'gentle' as const,
      relatedRef: { type: 'memory' as const, id: g.id },
      ctaLabel: '我聊聊',
      generatedAt: now.toISOString(),
    },
  ]
}

/** 4. 盲点唤起 · memory.kind=blindspot · lastUsedAt 或 createdAt 老于 BLINDSPOT_DAYS */
export async function findDormantBlindspots(ctx: RuleContext): Promise<ProactivePrompt[]> {
  const now = ctx.now ?? new Date()
  const threshold = new Date(now.getTime() - BLINDSPOT_DAYS * day)

  const spots = await prisma.memory.findMany({
    where: {
      userId: ctx.userId,
      kind: 'blindspot',
      OR: [{ lastUsedAt: null }, { lastUsedAt: { lte: threshold } }],
    },
    orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
    take: 1,
  })

  return spots.map((s) => ({
    key: `blindspot:${s.id}`,
    kind: 'dormant_blindspot' as const,
    question: `你之前提过 ${s.content} · 这次是不是又有点类似的感觉？`,
    context: '盲点只是识别到，不解决。认出来就是进展。',
    severity: 'gentle' as const,
    relatedRef: { type: 'memory' as const, id: s.id },
    ctaLabel: '看看当下',
    generatedAt: now.toISOString(),
  }))
}

/** 5. 季节性复盘 · 每周日 · 每月 1 号 */
export async function findSeasonalReview(ctx: RuleContext): Promise<ProactivePrompt[]> {
  const now = ctx.now ?? new Date()
  const dow = now.getDay() // 0 = Sunday
  const dom = now.getDate()

  const prompts: ProactivePrompt[] = []

  if (dow === 0) {
    prompts.push({
      key: `seasonal:weekly:${now.toISOString().slice(0, 10)}`,
      kind: 'seasonal_review' as const,
      question: '今天是周日 · 这周做完了什么、想清了什么？',
      context: '写一条简短复盘比完美的长报告有用。',
      severity: 'gentle' as const,
      ctaLabel: '写周复盘',
      generatedAt: now.toISOString(),
    })
  }
  if (dom === 1) {
    prompts.push({
      key: `seasonal:monthly:${now.toISOString().slice(0, 7)}`,
      kind: 'seasonal_review' as const,
      question: `新的一个月 · 上个月你最想记住的一件事是什么？`,
      context: '标记一条 · 就算这个月的底色。',
      severity: 'gentle' as const,
      ctaLabel: '记一笔',
      generatedAt: now.toISOString(),
    })
  }

  return prompts
}
