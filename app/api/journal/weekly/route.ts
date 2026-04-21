import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWeeklyReview, type WeeklyMetrics } from '@/lib/ai/journal'
import { resolveProvider } from '@/lib/ai/providers'
import { consumeDemoQuota } from '@/lib/ai/quota'
import { consumeToken } from '@/lib/ai/ratelimit'
import { QuotaExceededError, RateLimitError, type ResolvedProvider } from '@/lib/ai/types'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const bodySchema = z.object({
  locale: z.enum(['zh-CN', 'en-US']).default('zh-CN'),
})

function sevenDaysAgo(): Date {
  const now = new Date()
  const d = new Date(now)
  d.setUTCDate(d.getUTCDate() - 7)
  return d
}

function formatDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

async function aggregateMetrics(userId: string): Promise<WeeklyMetrics> {
  const rangeStart = sevenDaysAgo()
  const rangeEnd = new Date()

  const [
    ideasCreated,
    ideasPlanned,
    ideasDone,
    completedTasks,
    skippedTasks,
    tasksTotal,
    activeIdeas,
  ] = await Promise.all([
    prisma.idea.count({ where: { userId, createdAt: { gte: rangeStart } } }),
    prisma.idea.count({
      where: {
        userId,
        status: { in: ['planned', 'executing'] },
        updatedAt: { gte: rangeStart },
      },
    }),
    prisma.idea.count({
      where: { userId, status: 'done', updatedAt: { gte: rangeStart } },
    }),
    prisma.task.findMany({
      where: {
        status: 'done',
        completedAt: { gte: rangeStart },
        milestone: { plan: { idea: { userId } } },
      },
      select: {
        title: true,
        milestone: { select: { plan: { select: { idea: { select: { title: true } } } } } },
      },
      take: 50,
      orderBy: { completedAt: 'desc' },
    }),
    prisma.task.findMany({
      where: {
        status: 'skipped',
        milestone: { plan: { idea: { userId } } },
      },
      select: {
        title: true,
        milestone: { select: { plan: { select: { idea: { select: { title: true } } } } } },
      },
      take: 30,
    }),
    prisma.task.count({
      where: {
        milestone: { plan: { idea: { userId, createdAt: { gte: rangeStart } } } },
      },
    }),
    prisma.idea.findMany({
      where: { userId, updatedAt: { gte: rangeStart } },
      select: { title: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
  ])

  return {
    rangeStart: formatDate(rangeStart),
    rangeEnd: formatDate(rangeEnd),
    ideasCreated,
    ideasPlanned,
    ideasDone,
    tasksCompleted: completedTasks.length,
    tasksSkipped: skippedTasks.length,
    tasksTotal,
    blockedHints: 0,
    completedTasks: completedTasks.map((t) => ({
      title: t.title,
      ideaTitle: t.milestone.plan.idea.title,
    })),
    skippedTasks: skippedTasks.map((t) => ({
      title: t.title,
      ideaTitle: t.milestone.plan.idea.title,
    })),
    activeIdeaTitles: activeIdeas.map((i) => i.title ?? '无题'),
  }
}

/** POST: 生成本周复盘 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const userId = session.user.id

  const json = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }
  const { locale } = parsed.data

  try {
    await consumeToken(`journal:${userId}`, 3, 300) // 5 分钟 3 次
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', retryAfter: e.retryAfterSec },
        { status: 429, headers: { 'Retry-After': String(e.retryAfterSec) } },
      )
    }
    throw e
  }

  let provider: ResolvedProvider
  try {
    provider = await resolveProvider(userId)
  } catch (e) {
    return NextResponse.json(
      { error: 'PROVIDER_UNAVAILABLE', message: (e as Error).message },
      { status: 503 },
    )
  }

  if (provider.source === 'demo') {
    try {
      await consumeDemoQuota(userId)
    } catch (e) {
      if (e instanceof QuotaExceededError) {
        return NextResponse.json({ error: 'QUOTA_EXCEEDED' }, { status: 402 })
      }
      throw e
    }
  }

  const metrics = await aggregateMetrics(userId)

  let review
  try {
    review = await generateWeeklyReview({ provider, metrics, locale })
  } catch (e) {
    return NextResponse.json(
      { error: 'AI_GENERATION_FAILED', message: (e as Error).message },
      { status: 502 },
    )
  }

  const created = await prisma.reflection.create({
    data: {
      userId,
      kind: 'weekly',
      content: [
        `# ${metrics.rangeStart} ~ ${metrics.rangeEnd}`,
        '',
        review.completed.length
          ? `## 完成\n${review.completed.map((c) => `- ${c}`).join('\n')}`
          : '',
        `## 节奏与阻力\n${review.stuckPatterns}`,
        `## 下周聚焦\n${review.nextWeekFocus}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
      aiInsight: review.insight,
      metadata: {
        ...metrics,
        completedTasks: undefined,
        skippedTasks: undefined,
        activeIdeaTitles: undefined,
      } as unknown as object,
    },
    select: {
      id: true,
      kind: true,
      content: true,
      aiInsight: true,
      createdAt: true,
      metadata: true,
    },
  })

  return NextResponse.json({ ok: true, reflection: created, review, metrics })
}

/** GET: 列出用户所有 weekly 复盘 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const list = await prisma.reflection.findMany({
    where: { userId: session.user.id, kind: 'weekly' },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      content: true,
      aiInsight: true,
      createdAt: true,
      metadata: true,
    },
  })
  return NextResponse.json({ list })
}
