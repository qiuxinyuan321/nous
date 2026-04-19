'use client'

import { Link, usePathname } from '@/lib/i18n/navigation'

const ITEMS = [
  { href: '/settings/profile', label: '个人', key: 'profile' },
  { href: '/settings/api-keys', label: 'API Key', key: 'api-keys' },
  { href: '/settings/language', label: '语言', key: 'language' },
] as const

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 text-sm">
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`font-serif-cn rounded-sm px-3 py-2 transition ${
              active
                ? 'bg-ink-heavy/5 text-ink-heavy border-ink-heavy/60 border-l-2'
                : 'text-ink-medium hover:text-ink-heavy hover:bg-ink-heavy/3 border-l-2 border-transparent'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
