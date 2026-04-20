import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { FocusView, type FocusTaskItem } from '@/components/features/focus/FocusView'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function FocusPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/focus`)
  }

  // 今日 0 点 UTC（与 API route 保持一致）
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

  const items: FocusTaskItem[] = tasks.map((t: typeof tasks[0]) => ({
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

  return <FocusView tasks={items} dateLabel={dateLabel} />
}
