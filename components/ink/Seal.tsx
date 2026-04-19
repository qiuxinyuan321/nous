import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type SealVariant = 'decision' | 'pending' | 'done'

const variantStyles: Record<SealVariant, string> = {
  decision: 'bg-cinnabar text-[color:var(--paper-rice)]',
  pending: 'bg-[color:var(--paper-aged)] text-ink-medium border border-ink-light/40',
  done: 'bg-celadon text-[color:var(--paper-rice)]',
}

interface SealProps {
  children: ReactNode
  variant?: SealVariant
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * 朱砂印章组件
 * ----------
 * 东方书画传统中的落印，用于标记「已定」「已成」「待思」等状态。
 */
export function Seal({ children, variant = 'decision', size = 'md', className }: SealProps) {
  const sizeStyles = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-14 w-14 text-lg',
    lg: 'h-20 w-20 text-2xl',
  }[size]

  return (
    <span
      className={cn(
        'font-serif-cn inline-flex -rotate-6 items-center justify-center rounded-sm shadow-sm select-none',
        variantStyles[variant],
        sizeStyles,
        className,
      )}
      aria-label="seal"
    >
      {children}
    </span>
  )
}
