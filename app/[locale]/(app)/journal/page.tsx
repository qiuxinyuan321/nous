import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { WeeklyView, type ReflectionItem } from '@/components/features/journal/WeeklyView'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function JournalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/journal`)
  }

  const rows = await prisma.reflection.findMany({
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

  const initial: ReflectionItem[] = rows.map((r) => ({
    id: r.id,
    content: r.content,
    aiInsight: r.aiInsight,
    createdAt: r.createdAt.toISOString(),
    metadata: r.metadata,
  }))

  return <WeeklyView initial={initial} />
}
