import { getTranslations } from 'next-intl/server'
import type { Session } from 'next-auth'
import { Link } from '@/lib/i18n/navigation'
import { NavLink } from '@/components/layout/NavLink'
import { logout } from '@/app/[locale]/(app)/actions'

export async function AppHeader({ user }: { user: NonNullable<Session['user']> }) {
  const t = await getTranslations()

  return (
    <header className="border-ink-light/15 bg-paper-rice/80 supports-[backdrop-filter]:bg-paper-rice/60 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/workspace"
            className="font-serif-en text-ink-heavy text-xl tracking-wide"
            aria-label="Nous"
          >
            Nous
          </Link>
          <nav className="flex items-center gap-5">
            <NavLink href="/workspace">{t('nav.workspace')}</NavLink>
            <NavLink href="/notes">{t('nav.notes')}</NavLink>
            <span className="bg-ink-light/20 h-4 w-px" />
            <NavLink href="/journal">{t('nav.journal')}</NavLink>
            <NavLink href="/memory">{t('nav.memory')}</NavLink>
            <NavLink href="/graph">{t('nav.graph')}</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-ink-light hidden text-xs sm:inline" title={user.email ?? undefined}>
            {user.email ?? user.name ?? '…'}
          </span>
          <NavLink href="/settings">{t('nav.settings')}</NavLink>
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
