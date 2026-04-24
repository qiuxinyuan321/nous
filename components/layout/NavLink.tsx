'use client'

import { usePathname } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function NavLink({
  href,
  children,
  className,
  variant = 'desktop',
  icon,
  ...props
}: ComponentProps<typeof Link> & { variant?: 'desktop' | 'mobile'; icon?: ReactNode }) {
  const pathname = usePathname()
  // 去掉 locale 前缀后匹配
  const bare = pathname.replace(/^\/(zh-CN|en-US)/, '')
  const isActive = bare === href || bare.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        variant === 'mobile'
          ? 'relative flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[10px] leading-none transition'
          : 'relative px-1 py-1 text-sm transition',
        isActive ? 'text-ink-heavy font-medium' : 'text-ink-medium hover:text-ink-heavy',
        variant === 'mobile' && isActive ? 'bg-paper-aged/70' : '',
        className,
      )}
      {...props}
    >
      {icon && <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
      <span className={variant === 'mobile' ? 'max-w-full truncate' : undefined}>{children}</span>
      {isActive && variant === 'desktop' && (
        <span className="bg-cinnabar absolute -bottom-[17px] left-0 h-[2px] w-full rounded-full" />
      )}
    </Link>
  )
}
