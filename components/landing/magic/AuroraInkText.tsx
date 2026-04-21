'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AuroraInkTextProps {
  children: ReactNode
  className?: string
  /** 动画时长秒，默认 10 */
  duration?: number
}

/**
 * 禅意版极光文字：
 * - 墨色主调，细腻的"墨 → 青石 → 金泥 → 墨"循环
 * - 用 linear-gradient + background-clip:text + 渐变 position 移动
 * - 不像 Magic UI 原版的彩虹色，而是"水墨随时间氲开"的质感
 */
export function AuroraInkText({ children, className, duration = 10 }: AuroraInkTextProps) {
  return (
    <span
      className={cn(
        'inline-block bg-clip-text text-transparent',
        '[background-image:linear-gradient(110deg,var(--ink-heavy)_0%,var(--indigo-stone)_25%,var(--gold-leaf)_50%,var(--cinnabar)_65%,var(--ink-heavy)_100%)]',
        '[background-size:200%_100%]',
        'animate-[inkAuroraFlow_var(--aurora-duration)_ease-in-out_infinite]',
        className,
      )}
      style={{ ['--aurora-duration' as string]: `${duration}s` }}
    >
      {children}
    </span>
  )
}
