'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { NumberTicker } from '@/components/landing/magic/NumberTicker'

type Accent = 'ink' | 'cinnabar' | 'celadon' | 'gold-leaf' | 'indigo-stone'

const ACCENT_TEXT: Record<Accent, string> = {
  ink: 'text-ink-heavy',
  cinnabar: 'text-cinnabar',
  celadon: 'text-celadon',
  'gold-leaf': 'text-gold-leaf',
  'indigo-stone': 'text-indigo-stone',
}

const ACCENT_RING: Record<Accent, string> = {
  ink: 'from-ink-heavy/10',
  cinnabar: 'from-cinnabar/12',
  celadon: 'from-celadon/12',
  'gold-leaf': 'from-gold-leaf/12',
  'indigo-stone': 'from-indigo-stone/12',
}

interface StatCardProps {
  label: string
  value: number
  /** 数字前缀（例如 "0"、货币符号） */
  prefix?: string
  /** 数字后缀（例如 "天"、"%"） */
  suffix?: string
  /** 强调色，影响数字与装饰色 */
  accent?: Accent
  /** 对比信息（譬如 "较上周 +3"） */
  delta?: { direction: 'up' | 'down' | 'flat'; label: string }
  /** 右下角额外内容（譬如 SparkLine） */
  footer?: ReactNode
  /** 左上小图标 */
  icon?: ReactNode
  /** 数字滚动动画（默认开启） */
  animate?: boolean
  className?: string
}

/**
 * 禅意版数据卡片：
 * - 玻璃宣纸底 + accent 色渐晕（不点睛，靠角落微微烘托）
 * - label · number · delta · footer 四段式排版
 * - 数字用 NumberTicker 滚动
 */
export function StatCard({
  label,
  value,
  prefix,
  suffix,
  accent = 'ink',
  delta,
  footer,
  icon,
  animate = true,
  className,
}: StatCardProps) {
  const deltaArrow = delta?.direction === 'up' ? '↑' : delta?.direction === 'down' ? '↓' : '·'
  const deltaColor =
    delta?.direction === 'up'
      ? 'text-celadon'
      : delta?.direction === 'down'
        ? 'text-cinnabar'
        : 'text-ink-light'

  return (
    <article
      className={cn(
        'group bg-paper-rice/40 relative overflow-hidden rounded-xl border border-white/40 p-5',
        'shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-lg',
        'dark:border-white/10 dark:bg-black/10 dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)]',
        className,
      )}
    >
      {/* accent 色渐晕 */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100',
          ACCENT_RING[accent],
        )}
      />

      {/* 顶部 label + icon */}
      <header className="relative mb-3 flex items-center justify-between">
        <span className="text-ink-light text-[11px] tracking-[0.18em] uppercase">{label}</span>
        {icon && (
          <span className={cn('opacity-60', ACCENT_TEXT[accent])} aria-hidden>
            {icon}
          </span>
        )}
      </header>

      {/* 主数字 */}
      <div
        className={cn(
          'font-serif-en relative flex items-baseline gap-1 leading-none',
          ACCENT_TEXT[accent],
        )}
      >
        <span className="text-4xl font-medium tracking-tight md:text-[2.5rem]">
          {animate ? (
            <NumberTicker value={value} prefix={prefix} duration={1.2} />
          ) : (
            <>
              {prefix}
              {value}
            </>
          )}
        </span>
        {suffix && (
          <span className="font-serif-cn text-ink-medium text-sm font-normal">{suffix}</span>
        )}
      </div>

      {/* 底部：delta + footer */}
      {(delta || footer) && (
        <footer className="relative mt-4 flex items-end justify-between gap-3">
          {delta ? (
            <span className={cn('text-[11px]', deltaColor)}>
              <span className="font-mono">{deltaArrow}</span> {delta.label}
            </span>
          ) : (
            <span />
          )}
          {footer && <div className="shrink-0">{footer}</div>}
        </footer>
      )}
    </article>
  )
}
