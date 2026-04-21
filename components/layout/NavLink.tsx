'use client'

import { usePathname } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import type { ComponentProps } from 'react'

export function NavLink({
  href,
  children,
  ...props
}: ComponentProps<typeof Link>) {
  const pathname = usePathname()
  // 去掉 locale 前缀后匹配
  const bare = pathname.replace(/^\/(zh-CN|en-US)/, '')
  const isActive = bare === href || bare.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={`relative px-1 py-1 text-sm transition ${
        isActive
          ? 'text-ink-heavy font-medium'
          : 'text-ink-medium hover:text-ink-heavy'
      }`}
      {...props}
    >
      {children}
      {isActive && (
        <span className="bg-cinnabar absolute -bottom-[17px] left-0 h-[2px] w-full rounded-full" />
      )}
    </Link>
  )
}
