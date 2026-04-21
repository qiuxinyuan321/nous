'use client'

import { cn } from '@/lib/utils'

interface InkBorderBeamProps {
  /** 流光循环时长（秒） */
  duration?: number
  /** 边框粗细（px） */
  width?: number
  /** 起始 / 经过 / 结束三段色，默认：金泥 → 朱砂 → 透明 */
  colorFrom?: string
  colorVia?: string
  colorTo?: string
  className?: string
}

/**
 * 禅意版流光边框：
 * - 用 CSS @property 注册 --ink-beam-angle 使其可以做渐变动画
 * - 只让 conic-gradient 的起始角度变化，mask 不动，不会穿帮
 * - 需要 globals.css 里定义 @property --ink-beam-angle 和 @keyframes inkBeamSpin
 *
 * 用法（父容器需 relative + overflow-hidden + rounded-*）：
 *   <div className="relative overflow-hidden rounded-xl ...">
 *     <InkBorderBeam />
 *     { 真实内容 }
 *   </div>
 */
export function InkBorderBeam({
  duration = 10,
  width = 1.5,
  colorFrom = 'var(--gold-leaf)',
  colorVia = 'var(--cinnabar)',
  colorTo = 'transparent',
  className,
}: InkBorderBeamProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit]',
        'before:absolute before:inset-0 before:rounded-[inherit]',
        'before:[padding:var(--beam-w)]',
        'before:[background-image:conic-gradient(from_var(--ink-beam-angle),var(--beam-to)_0%,var(--beam-from)_10%,var(--beam-via)_20%,var(--beam-to)_30%,var(--beam-to)_100%)]',
        'before:[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)]',
        'before:[mask-composite:exclude]',
        'before:[-webkit-mask-composite:xor]',
        'before:animate-[inkBeamSpin_var(--beam-duration)_linear_infinite]',
        className,
      )}
      style={
        {
          '--beam-duration': `${duration}s`,
          '--beam-w': `${width}px`,
          '--beam-from': colorFrom,
          '--beam-via': colorVia,
          '--beam-to': colorTo,
        } as React.CSSProperties
      }
    />
  )
}
