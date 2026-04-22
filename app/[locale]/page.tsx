import { getTranslations, setRequestLocale } from 'next-intl/server'
import { InkStroke } from '@/components/ink/InkStroke'
import { Reveal } from '@/components/landing/Reveal'
import { HeroVisual } from '@/components/landing/HeroVisual'
import { FeatureCard } from '@/components/landing/FeatureCard'
import { FlowTimeline } from '@/components/landing/FlowTimeline'
import { FaqAccordion } from '@/components/landing/FaqAccordion'
import { CodeBlock } from '@/components/landing/CodeBlock'
import { AuroraInkText } from '@/components/landing/magic/AuroraInkText'
import { InkBorderBeam } from '@/components/landing/magic/InkBorderBeam'
import { ShimmerInkButton } from '@/components/landing/magic/ShimmerInkButton'
import { auth } from '@/lib/auth'

const FAQ_KEYS = ['byok', 'privacy', 'selfhost', 'free'] as const
const FLOW_KEYS = ['capture', 'refine', 'plan', 'focus', 'review'] as const
const FEATURE_KEYS = ['capture', 'socratic', 'plan'] as const

const FEATURE_ACCENT: Record<
  (typeof FEATURE_KEYS)[number],
  'cinnabar' | 'celadon' | 'indigo-stone'
> = {
  capture: 'cinnabar',
  socratic: 'indigo-stone',
  plan: 'celadon',
}

const DEPLOY_SNIPPET = `# 克隆
git clone https://github.com/<you>/nous.git && cd nous

# 配置
cp .env.example .env.prod
vim .env.prod

# 启动
docker compose -f docker/docker-compose.prod.yml up -d`

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()
  const session = await auth()
  const ctaHref = session?.user ? '/workspace' : '/login'

  const flowSteps = FLOW_KEYS.map((k) => ({
    key: k,
    title: t(`marketing.flow.steps.${k}.title`),
    desc: t(`marketing.flow.steps.${k}.desc`),
  }))
  const faqItems = FAQ_KEYS.map((k) => ({
    key: k,
    q: t(`marketing.faq.items.${k}.q`),
    a: t(`marketing.faq.items.${k}.a`),
  }))

  return (
    <main className="relative mx-auto max-w-6xl px-6">
      {/* 纸面装饰 · 柔色光晕 · 移动端隐藏（4 个 blur-100px 合成层是 GPU 灾难） */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden md:block"
        aria-hidden="true"
      >
        <div className="bg-cinnabar/20 dark:bg-cinnabar/30 absolute top-[-10rem] right-[-10rem] h-[32rem] w-[32rem] rounded-full mix-blend-multiply blur-[100px] dark:mix-blend-screen" />
        <div className="bg-indigo-stone/20 dark:bg-indigo-stone/30 absolute top-[20rem] left-[-12rem] h-[28rem] w-[28rem] rounded-full mix-blend-multiply blur-[100px] dark:mix-blend-screen" />
        <div className="bg-celadon/20 dark:bg-celadon/30 absolute top-[70rem] right-[-8rem] h-[24rem] w-[24rem] rounded-full mix-blend-multiply blur-[100px] dark:mix-blend-screen" />
        <div className="bg-gold-leaf/15 dark:bg-gold-leaf/20 absolute top-[45rem] left-[20%] h-[20rem] w-[20rem] rounded-full mix-blend-multiply blur-[80px] dark:mix-blend-screen" />
      </div>

      {/* ─── Hero · 首屏脱掉所有 Reveal 入场（opacity:0 + whileInView 是 LCP 主因） ─── */}
      <section className="relative grid min-h-[calc(100vh-4rem)] items-center gap-12 py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-16 md:py-28">
        <div className="order-2 md:order-1">
          <p className="text-ink-light font-serif-en mb-5 text-xs tracking-[0.3em] uppercase">
            {t('marketing.hero.lede')}
          </p>

          <h1 className="font-serif-en text-ink-heavy text-6xl leading-[0.95] font-medium tracking-tight md:text-7xl lg:text-8xl">
            Nous
          </h1>

          <div className="mt-6 w-28">
            <InkStroke variant="medium" />
          </div>

          <p className="font-serif-cn mt-8 text-2xl leading-snug md:text-3xl">
            <AuroraInkText duration={12}>{t('marketing.hero.title')}</AuroraInkText>
          </p>

          <p className="text-ink-light mt-5 max-w-xl text-base leading-relaxed md:text-lg">
            {t('marketing.hero.subtitle')}
          </p>

          <div className="mt-12 flex flex-wrap gap-4">
            <ShimmerInkButton href={ctaHref}>{t('marketing.hero.cta')}</ShimmerInkButton>
            <a
              href="https://github.com/qiuxinyuan321/nous"
              target="_blank"
              rel="noopener noreferrer"
              className="border-ink-light/60 text-ink-medium hover:border-ink-heavy hover:text-ink-heavy inline-flex items-center gap-2 rounded-md border px-7 py-3.5 transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.57.1.78-.25.78-.55v-2.1c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.76 2.7 1.25 3.36.96.1-.74.4-1.25.74-1.54-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.28 1.2-3.08-.12-.3-.52-1.48.11-3.1 0 0 .97-.31 3.2 1.18a11.1 11.1 0 0 1 5.82 0c2.22-1.49 3.2-1.18 3.2-1.18.63 1.62.23 2.8.11 3.1.75.8 1.2 1.82 1.2 3.08 0 4.42-2.69 5.39-5.26 5.68.41.35.78 1.05.78 2.12v3.15c0 .3.2.66.78.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>

        <div className="relative order-1 md:order-2">
          <HeroVisual alt={t('marketing.hero.imageAlt')} />
        </div>
      </section>

      {/* ─── 三件事 ─── */}
      <section className="py-24 md:py-28">
        <Reveal className="mb-14 text-center">
          <h2 className="font-serif-cn text-ink-heavy text-3xl md:text-4xl">
            {t('marketing.features.sectionTitle')}
          </h2>
          <div className="mx-auto mt-4 w-14">
            <InkStroke variant="thin" />
          </div>
          <p className="text-ink-light mt-5 text-sm md:text-base">
            {t('marketing.features.sectionDesc')}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {FEATURE_KEYS.map((k, idx) => (
            <Reveal key={k} delay={idx * 0.08}>
              <FeatureCard
                index={idx + 1}
                title={t(`marketing.features.${k}.title`)}
                desc={t(`marketing.features.${k}.desc`)}
                accent={FEATURE_ACCENT[k]}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── 工作流 ─── */}
      <section className="py-24 md:py-28">
        <Reveal className="mb-14 text-center">
          <h2 className="font-serif-cn text-ink-heavy text-3xl md:text-4xl">
            {t('marketing.flow.title')}
          </h2>
          <div className="mx-auto mt-4 w-14">
            <InkStroke variant="thin" />
          </div>
        </Reveal>

        <FlowTimeline steps={flowSteps} />
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-24 md:py-28">
        <Reveal className="mb-14 text-center">
          <h2 className="font-serif-cn text-ink-heavy text-3xl md:text-4xl">
            {t('marketing.faq.title')}
          </h2>
          <div className="mx-auto mt-4 w-14">
            <InkStroke variant="thin" />
          </div>
        </Reveal>

        <FaqAccordion items={faqItems} />
      </section>

      {/* ─── 自托管引导 ─── */}
      <section className="py-24 md:py-28">
        <Reveal>
          <div className="from-paper-aged/80 to-paper-rice/60 dark:from-paper-aged/10 dark:to-paper-rice/5 relative mx-auto max-w-3xl overflow-hidden rounded-xl border border-white/40 bg-gradient-to-br p-8 shadow-[0_30px_60px_-40px_rgba(28,27,25,0.3)] backdrop-blur-xl md:p-10 dark:border-white/10 dark:shadow-[0_30px_60px_-40px_rgba(0,0,0,0.5)]">
            <InkBorderBeam duration={14} />
            <span
              className="bg-cinnabar/25 dark:bg-cinnabar/30 pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-[80px]"
              aria-hidden
            />

            <div className="relative">
              <p className="text-ink-light font-serif-en text-xs tracking-[0.25em] uppercase">
                Self-hosted
              </p>
              <h2 className="font-serif-cn text-ink-heavy mt-3 text-2xl md:text-3xl">
                {t('marketing.selfhost.title')}
              </h2>
              <p className="text-ink-medium mt-4 text-sm leading-relaxed md:text-base">
                {t('marketing.selfhost.desc')}
              </p>

              <div className="mt-6">
                <CodeBlock
                  code={DEPLOY_SNIPPET}
                  copyLabel={t('marketing.selfhost.code.copy')}
                  copiedLabel={t('marketing.selfhost.code.copied')}
                />
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-5">
                <a
                  href="https://github.com/qiuxinyuan321/nous#自托管--5-分钟上线"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-stone hover:text-ink-heavy inline-flex items-center gap-1.5 text-sm underline-offset-4 transition hover:underline"
                >
                  {t('marketing.selfhost.docs')}
                  <span aria-hidden>→</span>
                </a>
                <span className="border-ink-light/40 text-ink-light rounded-full border px-3 py-1 text-xs tracking-wide">
                  {t('marketing.selfhost.badge')}
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── Footer ─── */}
      <div className="mx-auto mt-16 w-48 opacity-40">
        <InkStroke variant="thin" />
      </div>
      <footer className="text-ink-light pt-6 pb-12 text-center text-xs">
        · {t('common.appName')} · MIT · {new Date().getFullYear()} ·
      </footer>
    </main>
  )
}
