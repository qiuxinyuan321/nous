import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

/**
 * 入场动画 · 纯 CSS 实现，不依赖 JS。
 *
 * 原因：旧版用 framer-motion whileInView + `initial: { opacity: 0 }`，
 * 导致 SSR 渲染的内容在 JS hydrate 前不可见，LCP 被推延到 3+ 秒。
 *
 * 现在：
 * - 默认 opacity: 1 · SSR 输出立刻可见，LCP 立即触发
 * - 只做 translateY 的微滑入效果 · 感知动效保留，但不再阻塞首次绘制
 * - motion-safe: 仅在用户未关动效时才跑（prefers-reduced-motion: no-preference）
 * - 纯 CSS · 零 JS 开销，零 IntersectionObserver 挂载
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const style: CSSProperties = delay > 0 ? { animationDelay: `${delay}s` } : {}
  return (
    <div className={cn('animate-revealUp', className)} style={style}>
      {children}
    </div>
  )
}
