import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { Seal } from '@/components/ink/Seal'
import { InkStroke } from '@/components/ink/InkStroke'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center px-6 py-24">
      {/* 印章装饰 */}
      <div className="absolute top-10 right-10 hidden md:block">
        <Seal size="lg">思</Seal>
      </div>

      {/* 主标题 */}
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

      {/* CTA */}
      <div className="mt-14 flex gap-4">
        <Link
          href="/inbox"
          className="bg-ink-heavy hover:bg-ink-medium rounded-md px-6 py-3 text-[color:var(--paper-rice)] transition"
        >
          {t('marketing.hero.cta')}
        </Link>
        <a
          href="https://github.com"
          className="border-ink-light text-ink-medium hover:border-ink-heavy hover:text-ink-heavy rounded-md border px-6 py-3 transition"
        >
          GitHub
        </a>
      </div>

      {/* 三个卖点 */}
      <section className="mt-24 grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
        {(['capture', 'socratic', 'plan'] as const).map((key) => (
          <article
            key={key}
            className="border-ink-light/30 bg-paper-aged/40 rounded-md border p-6 backdrop-blur-sm"
          >
            <h3 className="font-serif-cn text-ink-heavy mb-2 text-lg font-medium">
              {t(`marketing.features.${key}.title`)}
            </h3>
            <p className="text-ink-medium text-sm leading-relaxed">
              {t(`marketing.features.${key}.desc`)}
            </p>
          </article>
        ))}
      </section>

      <div className="mt-24 w-48 opacity-50">
        <InkStroke variant="thin" />
      </div>

      <footer className="text-ink-light mt-6 text-xs">
        · {t('common.appName')} · MIT · {new Date().getFullYear()} ·
      </footer>
    </main>
  )
}
