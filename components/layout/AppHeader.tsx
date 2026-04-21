import { getTranslations } from 'next-intl/server'
import type { Session } from 'next-auth'
import { Link } from '@/lib/i18n/navigation'
import { logout } from '@/app/[locale]/(app)/actions'

export async function AppHeader({ user }: { user: NonNullable<Session['user']> }) {
  const t = await getTranslations()

  return (
    <header className="border-ink-light/20 bg-paper-rice/80 supports-[backdrop-filter]:bg-paper-rice/60 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/notes"
            className="font-serif-en text-ink-heavy text-xl tracking-wide"
            aria-label="Nous"
          >
            Nous
          </Link>
          <nav className="text-ink-medium flex items-center gap-6 text-sm">
            <Link href="/notes" className="hover:text-ink-heavy transition">
              {t('nav.notes')}
            </Link>
            <Link href="/inbox" className="hover:text-ink-heavy transition">
              {t('nav.executor')}
            </Link>
            <Link href="/memory" className="hover:text-ink-heavy transition">
              {t('nav.memory')}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-ink-light hidden text-xs sm:inline" title={user.email ?? undefined}>
            {user.email ?? user.name ?? '…'}
          </span>
          <Link
            href="/settings"
            className="text-ink-medium hover:text-ink-heavy text-sm transition"
          >
            {t('nav.settings')}
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="text-ink-medium hover:text-ink-heavy text-sm transition"
            >
              {t('nav.logout')}
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
