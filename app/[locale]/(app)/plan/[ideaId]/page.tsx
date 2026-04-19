import { setRequestLocale } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { FirstActionCard } from '@/components/features/plan/FirstActionCard'
import { MilestoneSection } from '@/components/features/plan/MilestoneSection'
import { InkStroke } from '@/components/ink/InkStroke'
import { Seal } from '@/components/ink/Seal'
import { Link } from '@/lib/i18n/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function PlanPage({
  params,
}: {
  params: Promise<{ locale: string; ideaId: string }>
}) {
  const { locale, ideaId } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/plan/${ideaId}`)
  }

  const idea = await prisma.idea.findFirst({
    where: { id: ideaId, userId: session.user.id },
    include: {
      plan: {
        include: {
          milestones: {
            orderBy: { orderIdx: 'asc' },
            include: { tasks: { orderBy: { orderIdx: 'asc' } } },
          },
        },
      },
    },
  })
  if (!idea || !idea.plan) notFound()

  const { plan } = idea
  const successCriteria = (plan.successCriteria as unknown as string[]) ?? []
  const risks = (plan.risks as unknown as string[]) ?? []

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-12 flex items-start justify-between gap-6">
        <div className="flex-1">
          <p className="text-ink-light text-xs tracking-widest uppercase">{idea.title || '无题'}</p>
          <h1 className="font-serif-cn text-ink-heavy mt-2 text-3xl leading-tight">{plan.goal}</h1>
          <div className="mt-4 w-16">
            <InkStroke variant="medium" />
          </div>
        </div>
        <Seal variant="done" size="lg">
          已定
        </Seal>
      </header>

      <FirstActionCard text={plan.firstAction} />

      <section className="mt-12">
        <h2 className="font-serif-cn text-ink-heavy mb-6 text-lg">成功标准</h2>
        <ul className="space-y-2">
          {successCriteria.map((c, i) => (
            <li
              key={i}
              className="text-ink-medium border-ink-light/20 flex items-start gap-3 border-l pl-4 text-sm leading-relaxed"
            >
              <span className="text-celadon font-mono text-xs">✓</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="font-serif-cn text-ink-heavy mb-8 text-lg">里程碑</h2>
        <div className="flex flex-col gap-10">
          {plan.milestones.map((m, i) => (
            <MilestoneSection
              key={m.id}
              index={i}
              title={m.title}
              deadline={m.deadline}
              tasks={m.tasks.map((t) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                priority: t.priority,
                estimatedMin: t.estimatedMin,
              }))}
            />
          ))}
        </div>
      </section>

      {risks.length > 0 && (
        <section className="mt-14">
          <h2 className="font-serif-cn text-ink-heavy mb-4 text-lg">风险</h2>
          <ul className="space-y-2">
            {risks.map((r, i) => (
              <li
                key={i}
                className="text-ink-medium border-cinnabar/40 flex items-start gap-3 border-l pl-4 text-sm leading-relaxed"
              >
                <span className="text-cinnabar font-mono text-xs">!</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-ink-light/20 mt-20 flex items-center justify-between border-t pt-6">
        <Link
          href={`/refine/${idea.id}`}
          className="text-ink-light hover:text-ink-heavy text-xs transition"
        >
          ← 回到对话
        </Link>
        <Link href="/inbox" className="text-ink-light hover:text-ink-heavy text-xs transition">
          ↑ 所有想法
        </Link>
      </footer>
    </main>
  )
}
