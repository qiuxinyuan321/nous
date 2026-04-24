import { getTranslations } from 'next-intl/server'
import type { Session } from 'next-auth'
import { BookOpen, Brain, Home, Network, ScrollText, Settings } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import { NavLink } from '@/components/layout/NavLink'
import { logout } from '@/app/[locale]/(app)/actions'

export async function AppHeader({ user }: { user: NonNullable<Session['user']> }) {
  const t = await getTranslations()

  return (
    <>
      <header className="border-ink-light/15 bg-paper-rice/80 supports-[backdrop-filter]:bg-paper-rice/60 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link
              href="/workspace"
              className="font-serif-en text-ink-heavy text-xl tracking-wide"
              aria-label="Nous"
            >
              Nous
            </Link>
            <nav className="hidden items-center gap-5 md:flex" aria-label="主导航">
              <NavLink href="/workspace">{t('nav.workspace')}</NavLink>
              <NavLink href="/notes">{t('nav.notes')}</NavLink>
              <span className="bg-ink-light/20 h-4 w-px" />
              <NavLink href="/chronicle">{t('nav.chronicle')}</NavLink>
              <NavLink href="/journal">{t('nav.journal')}</NavLink>
              <NavLink href="/memory">{t('nav.memory')}</NavLink>
              <NavLink href="/graph">{t('nav.graph')}</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span
              className="text-ink-light hidden text-xs sm:inline"
              title={user.email ?? undefined}
            >
              {user.email ?? user.name ?? '…'}
            </span>
            <span className="hidden md:inline-flex">
              <NavLink href="/settings">{t('nav.settings')}</NavLink>
            </span>
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
      <nav
        className="border-ink-light/15 bg-paper-rice/90 supports-[backdrop-filter]:bg-paper-rice/75 fixed inset-x-0 bottom-0 z-40 border-t px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur md:hidden"
        aria-label="移动端主导航"
      >
        <div className="mx-auto grid max-w-md grid-cols-6 gap-1">
          <NavLink href="/workspace" variant="mobile" icon={<Home aria-hidden />}>
            {t('nav.workspace')}
          </NavLink>
          <NavLink href="/notes" variant="mobile" icon={<BookOpen aria-hidden />}>
            {t('nav.notes')}
          </NavLink>
          <NavLink href="/chronicle" variant="mobile" icon={<ScrollText aria-hidden />}>
            {t('nav.chronicle')}
          </NavLink>
          <NavLink href="/memory" variant="mobile" icon={<Brain aria-hidden />}>
            {t('nav.memory')}
          </NavLink>
          <NavLink href="/graph" variant="mobile" icon={<Network aria-hidden />}>
            {t('nav.graph')}
          </NavLink>
          <NavLink href="/settings" variant="mobile" icon={<Settings aria-hidden />}>
            {t('nav.settings')}
          </NavLink>
        </div>
      </nav>
    </>
  )
}
