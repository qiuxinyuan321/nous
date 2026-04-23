import { setRequestLocale } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { phaseForMessageCount } from '@/lib/ai/socratic'
import type { ChatMessage, Phase } from '@/lib/ai/types'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { RefineView } from '@/components/features/refine/RefineView'
import { RelationRail } from '@/components/features/relations/RelationRail'

export default async function RefinePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/refine/${id}`)
  }

  const idea = await prisma.idea.findFirst({
    where: { id, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      plan: { select: { id: true } },
    },
  })
  if (!idea) notFound()

  const initialMessages: ChatMessage[] = idea.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      personaId: m.personaId ?? null,
    }))

  const userTurnCount = initialMessages.filter((m) => m.role === 'user').length
  const initialPhase: Phase = phaseForMessageCount(userTurnCount)

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 px-0 lg:px-4">
      <div className="min-w-0 flex-1">
        <RefineView
          ideaId={idea.id}
          ideaTitle={idea.title ?? ''}
          ideaContent={idea.rawContent}
          initialMessages={initialMessages}
          initialPhase={initialPhase}
          locale={locale === 'en-US' ? 'en-US' : 'zh-CN'}
          hasPlan={!!idea.plan}
        />
      </div>
      <aside className="sticky top-20 hidden w-80 shrink-0 self-start py-10 lg:block">
        <RelationRail entityType="idea" entityId={idea.id} userId={session.user.id} />
      </aside>
    </div>
  )
}
