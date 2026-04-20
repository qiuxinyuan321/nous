import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { Seal } from '@/components/ink/Seal'
import { InkStroke } from '@/components/ink/InkStroke'
import { auth } from '@/lib/auth'
import { CanvasBackground } from '@/components/canvas-background'
import { FeatureCard } from '@/components/feature-card'
import { WorkflowItem } from '@/components/workflow-item'

const FAQ_KEYS = ['byok', 'privacy', 'selfhost', 'free'] as const

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()
  const session = await auth()
  const ctaHref = session?.user ? '/inbox' : '/login'

  return (
    <main className="relative mx-auto max-w-5xl px-6">
      {/* ─── Hero ─── */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-24">
        <CanvasBackground />

        <div className="absolute top-10 right-10 hidden md:block">
          <Seal size="lg">思</Seal>
        </div>

        <h1 className="font-serif-en text-ink-heavy text-center text-6xl leading-tight font-medium tracking-tight md:text-8xl">
          Nous
        </h1>

        <div className="mt-6 w-24">
          <InkStroke variant="medium" />
        </div>

        <p className="font-serif-cn text-ink-medium mt-10 text-center text-2xl md:text-3xl">
          {t('marketing.hero.title')}
        </p>

        <p className="text-ink-light mt-4 max-w-xl text-center text-base md:text-lg">
          {t('marketing.hero.subtitle')}
        </p>

        <div className="mt-14 flex gap-4">
          <Link
            href={ctaHref}
            className="bg-ink-heavy hover:bg-ink-medium rounded-md px-6 py-3 text-[color:var(--paper-rice)] transition"
          >
            {t('marketing.hero.cta')}
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="border-ink-light text-ink-medium hover:border-ink-heavy hover:text-ink-heavy rounded-md border px-6 py-3 transition"
          >
            GitHub
          </a>
        </div>
      </section>

      {/* ─── 三个卖点 ─── */}
      <section className="py-20">
        <div className="mb-12 text-center">
          <h2 className="font-serif-cn text-ink-heavy text-2xl">三件事</h2>
          <div className="mx-auto mt-3 w-12">
            <InkStroke variant="thin" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {(['capture', 'socratic', 'plan'] as const).map((key, idx) => (
            <FeatureCard
              key={key}
              index={idx}
              title={t(`marketing.features.${key}.title`)}
              desc={t(`marketing.features.${key}.desc`)}
            />
          ))}
        </div>
      </section>

      {/* ─── 工作流 ─── */}
      <section className="py-20">
        <div className="mb-12 text-center">
          <h2 className="font-serif-cn text-ink-heavy text-2xl">{t('marketing.flow.title')}</h2>
          <div className="mx-auto mt-3 w-12">
            <InkStroke variant="thin" />
          </div>
        </div>
        <ol className="mx-auto max-w-3xl space-y-6">
          {(['capture', 'refine', 'plan', 'focus', 'review'] as const).map((k, idx) => (
            <WorkflowItem
              key={k}
              index={idx}
              title={t(`marketing.flow.steps.${k}.title`)}
              desc={t(`marketing.flow.steps.${k}.desc`)}
            />
          ))}
        </ol>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20">
        <div className="mb-12 text-center">
          <h2 className="font-serif-cn text-ink-heavy text-2xl">{t('marketing.faq.title')}</h2>
          <div className="mx-auto mt-3 w-12">
            <InkStroke variant="thin" />
          </div>
        </div>
        <div className="mx-auto max-w-3xl space-y-4">
          {FAQ_KEYS.map((k) => (
            <details
              key={k}
              className="border-ink-light/30 bg-paper-aged/30 rounded-sm border p-5 open:shadow-sm"
            >
              <summary className="font-serif-cn text-ink-heavy cursor-pointer list-none text-base font-medium">
                {t(`marketing.faq.items.${k}.q`)}
              </summary>
              <p className="text-ink-medium mt-3 text-sm leading-relaxed whitespace-pre-line">
                {t(`marketing.faq.items.${k}.a`)}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ─── 自托管引导 ─── */}
      <section className="py-20">
        <div className="border-ink-heavy/30 bg-paper-aged/50 mx-auto max-w-3xl rounded-sm border p-8">
          <p className="text-ink-light text-xs tracking-widest uppercase">Self-hosted</p>
          <h2 className="font-serif-cn text-ink-heavy mt-2 text-2xl">
            {t('marketing.selfhost.title')}
          </h2>
          <p className="text-ink-medium mt-4 text-sm leading-relaxed">
            {t('marketing.selfhost.desc')}
          </p>
          <pre className="bg-ink-heavy/95 text-paper-rice mt-5 overflow-x-auto rounded-sm p-4 font-mono text-xs leading-relaxed">
            {`# 克隆
git clone https://github.com/<you>/nous.git && cd nous

# 配置
cp .env.example .env.prod
vim .env.prod

# 启动
docker compose -f docker/docker-compose.prod.yml up -d`}
          </pre>
          <div className="mt-6 flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-stone text-sm underline"
            >
              {t('marketing.selfhost.docs')} →
            </a>
            <span className="text-ink-light text-xs">MIT · 可商用</span>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <div className="mx-auto mt-10 w-48 opacity-50">
        <InkStroke variant="thin" />
      </div>
      <footer className="text-ink-light pt-6 pb-12 text-center text-xs">
        · {t('common.appName')} · MIT · {new Date().getFullYear()} ·
      </footer>
    </main>
  )
}
