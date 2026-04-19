import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { getDemoUsageToday } from '@/lib/ai/quota'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function ProfileSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/settings/profile`)
  }
  const userId = session.user.id

  const [user, hasByokDefault, keyCount, ideaCount, planCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true, createdAt: true },
    }),
    prisma.apiKey.findFirst({
      where: { userId, isDefault: true },
      select: { provider: true, model: true, label: true },
    }),
    prisma.apiKey.count({ where: { userId } }),
    prisma.idea.count({ where: { userId } }),
    prisma.plan.count({ where: { idea: { userId } } }),
  ])

  const usage = await getDemoUsageToday(userId)
  const percentUsed = usage.limit > 0 ? Math.min(100, (usage.count / usage.limit) * 100) : 0

  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-serif-cn text-ink-heavy mb-4 text-lg">账户</h2>
        <div className="border-ink-light/20 bg-paper-aged/30 rounded-sm border p-5">
          <Row label="邮箱" value={user?.email ?? '—'} />
          <Row label="昵称" value={user?.name ?? '—'} />
          <Row
            label="注册时间"
            value={
              user?.createdAt
                ? new Intl.DateTimeFormat('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }).format(user.createdAt)
                : '—'
            }
          />
        </div>
      </section>

      <section>
        <h2 className="font-serif-cn text-ink-heavy mb-4 text-lg">AI 来源</h2>
        <div className="border-ink-light/20 bg-paper-aged/30 rounded-sm border p-5">
          {hasByokDefault ? (
            <>
              <p className="text-ink-heavy font-serif-cn text-base">
                使用自带 Key <span className="text-celadon text-xs">● 已激活</span>
              </p>
              <p className="text-ink-medium mt-2 text-sm">
                {hasByokDefault.label ?? hasByokDefault.provider} · {hasByokDefault.model}
              </p>
              <p className="text-ink-light mt-3 text-xs leading-relaxed">
                BYOK 模式下无每日额度限制,按你自己的账单扣费。共 {keyCount} 个 Key。
              </p>
            </>
          ) : (
            <>
              <p className="text-ink-heavy font-serif-cn text-base">
                使用内置 Demo Key <span className="text-cinnabar text-xs">● 体验中</span>
              </p>
              <p className="text-ink-light mt-2 text-sm">
                今日额度 <span className="text-ink-medium font-mono">{usage.count}</span> /{' '}
                <span className="text-ink-medium font-mono">{usage.limit}</span>
              </p>
              <div className="border-ink-light/20 bg-paper-rice/60 mt-3 h-1.5 overflow-hidden rounded-full border">
                <div
                  className="bg-cinnabar h-full"
                  style={{ width: `${percentUsed}%` }}
                  aria-label={`已用 ${percentUsed.toFixed(0)}%`}
                />
              </div>
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-serif-cn text-ink-heavy mb-4 text-lg">数据</h2>
        <div className="border-ink-light/20 bg-paper-aged/30 grid grid-cols-3 rounded-sm border p-5">
          <Stat label="想法" value={ideaCount} />
          <Stat label="已规划" value={planCount} />
          <Stat label="API Key" value={keyCount} />
        </div>
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-ink-light/15 flex items-baseline gap-4 border-b py-3 last:border-b-0">
      <span className="text-ink-light w-20 text-xs tracking-wider uppercase">{label}</span>
      <span className="font-serif-cn text-ink-heavy text-sm">{value}</span>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-ink-light/20 text-center first:border-r last:border-l">
      <div className="text-ink-heavy font-mono text-2xl font-light tabular-nums">{value}</div>
      <div className="text-ink-light mt-1 text-[10px] tracking-widest uppercase">{label}</div>
    </div>
  )
}
