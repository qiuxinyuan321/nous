import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { WorkspaceView } from '@/components/features/workspace/WorkspaceView'
import type { FocusTaskItem } from '@/components/features/focus/FocusView'

export default async function WorkspacePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/workspace`)
  }

  const now = new Date()
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const uid = session.user.id

  // 本周一
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
  const weekStart = new Date(today)
  weekStart.setUTCDate(weekStart.getUTCDate() - dayOfWeek)

  // Streak 回溯窗口（30 天足够判定连续打卡）
  const streakWindow = new Date(today)
  streakWindow.setUTCDate(streakWindow.getUTCDate() - 30)

  // 上周同期（用于对比：本周想法数 vs 上周想法数）
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7)

  // 所有查询并行，单个失败降级，不影响整页
  const [tasks, weekIdeas, prevWeekIdeas, weekTasksDone, doneCompletedAt] = await Promise.all([
    prisma.task
      .findMany({
        where: {
          focusedOn: today,
          milestone: { plan: { idea: { userId: uid } } },
        },
        orderBy: [{ status: 'asc' }, { milestone: { orderIdx: 'asc' } }, { orderIdx: 'asc' }],
        include: {
          milestone: {
            select: {
              title: true,
              plan: { select: { idea: { select: { id: true, title: true } } } },
            },
          },
        },
      })
      .catch(() => [] as never[]),
    prisma.idea
      .count({
        where: { userId: uid, createdAt: { gte: weekStart } },
      })
      .catch(() => 0),
    prisma.idea
      .count({
        where: {
          userId: uid,
          createdAt: { gte: prevWeekStart, lt: weekStart },
        },
      })
      .catch(() => 0),
    prisma.task
      .count({
        where: {
          status: 'done',
          completedAt: { gte: weekStart },
          milestone: { plan: { idea: { userId: uid } } },
        },
      })
      .catch(() => 0),
    // 最近 30 天所有已完成任务的 completedAt（只取字段，内存聚合）
    prisma.task
      .findMany({
        where: {
          status: 'done',
          completedAt: { gte: streakWindow },
          milestone: { plan: { idea: { userId: uid } } },
        },
        select: { completedAt: true },
      })
      .catch(() => [] as { completedAt: Date | null }[]),
  ])

  const focusTasks: FocusTaskItem[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    estimatedMin: t.estimatedMin,
    status: t.status,
    ideaId: t.milestone.plan.idea.id,
    ideaTitle: t.milestone.plan.idea.title,
    milestoneTitle: t.milestone.title,
  }))

  // 聚合：按 UTC 日期 key 归桶
  const doneByDay = new Map<string, number>()
  for (const t of doneCompletedAt) {
    if (!t.completedAt) continue
    const d = new Date(
      Date.UTC(
        t.completedAt.getUTCFullYear(),
        t.completedAt.getUTCMonth(),
        t.completedAt.getUTCDate(),
      ),
    )
    const key = d.toISOString().slice(0, 10)
    doneByDay.set(key, (doneByDay.get(key) ?? 0) + 1)
  }

  // 本周 7 天趋势（周一 → 今天之后补 0）
  const weeklyTrend: number[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setUTCDate(d.getUTCDate() + i)
    const key = d.toISOString().slice(0, 10)
    weeklyTrend.push(doneByDay.get(key) ?? 0)
  }

  // Streak：从今天起往前数，连续有 done 的天数（含今天；若今天无，从昨天起）
  let streak = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    const has = (doneByDay.get(key) ?? 0) > 0
    if (has) {
      streak++
    } else if (i === 0) {
      // 今天还没完成不算断，继续往回看
      continue
    } else {
      break
    }
  }

  const dateLabel = new Intl.DateTimeFormat(locale === 'en-US' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(now)

  const todayTotal = focusTasks.length
  const todayDone = focusTasks.filter((t) => t.status === 'done').length

  return (
    <WorkspaceView
      focusTasks={focusTasks}
      dateLabel={dateLabel}
      stats={{
        todayTotal,
        todayDone,
        weekIdeas,
        prevWeekIdeas,
        weekTasksDone,
        streak,
        weeklyTrend,
      }}
    />
  )
}
