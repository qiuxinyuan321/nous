'use client'

import Link from 'next/link'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ShimmerInkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: ReactNode
  /** 外部链接（_blank + rel） */
  external?: boolean
  /** 使用 next/link 还是原生 a（默认 next/link） */
  useNextLink?: boolean
}

/**
 * 禅意版闪光按钮：
 * - 墨色底 + 一道金泥流光周期扫过
 * - 使用 next/link 保持 SPA 导航
 * - hover 时光斑变紧凑，并带微幅抬升
 */
export function ShimmerInkButton({
  href,
  children,
  external,
  useNextLink = true,
  className,
  ...rest
}: ShimmerInkButtonProps) {
  const classes = cn(
    'group relative inline-flex items-center gap-2 overflow-hidden rounded-md',
    'bg-ink-heavy text-[color:var(--paper-rice)] px-7 py-3.5',
    'shadow-[0_20px_40px_-20px_rgba(28,27,25,0.45)]',
    'transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-medium',
    // 金泥流光：用 background-image 扫过，mask 限制在按钮宽度内
    'before:absolute before:inset-0 before:-z-0 before:opacity-60',
    'before:[background-image:linear-gradient(110deg,transparent_25%,var(--gold-leaf)_45%,transparent_55%,transparent_75%)]',
    'before:[background-size:200%_100%]',
    'before:animate-[inkShimmer_3.5s_ease-in-out_infinite]',
    className,
  )

  const inner = (
    <>
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden
        className="relative z-10 translate-x-0 transition-transform duration-300 group-hover:translate-x-1"
      >
        →
      </span>
    </>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
        {inner}
      </a>
    )
  }

  if (useNextLink) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    )
  }

  return (
    <a href={href} className={classes} {...rest}>
      {inner}
    </a>
  )
}
