import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { WorkspaceView } from '@/components/features/workspace/WorkspaceView'
import type { FocusTaskItem } from '@/components/features/focus/FocusView'

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/workspace`)
  }

  // 今日聚焦任务
  const now = new Date()
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))

  const tasks = await prisma.task.findMany({
    where: {
      focusedOn: today,
      milestone: { plan: { idea: { userId: session.user.id } } },
    },
    orderBy: [{ status: 'asc' }, { milestone: { orderIdx: 'asc' } }, { orderIdx: 'asc' }],
    include: {
      milestone: {
        select: {
          title: true,
          plan: {
            select: {
              idea: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  })

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

  const dateLabel = new Intl.DateTimeFormat(locale === 'en-US' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(now)

  // 本周统计（周一起算）
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - dayOfWeek)

  const [weekIdeas, weekTasksDone] = await Promise.all([
    prisma.idea.count({
      where: { userId: session.user.id, createdAt: { gte: weekStart } },
    }),
    prisma.task.count({
      where: {
        status: 'done',
        updatedAt: { gte: weekStart },
        milestone: { plan: { idea: { userId: session.user.id } } },
      },
    }),
  ])

  const weeklyStats = { ideasCreated: weekIdeas, tasksDone: weekTasksDone }

  return (
    <WorkspaceView
      focusTasks={focusTasks}
      dateLabel={dateLabel}
      weeklyStats={weeklyStats}
    />
  )
}
