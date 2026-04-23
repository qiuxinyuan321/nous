interface NumberTickerProps {
  value: number
  decimals?: number
  /** @deprecated 保留签名向后兼容 · 静态化后不再使用 */
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
}

/**
 * 数字标签 · 服务端组件 · 零 JS
 *
 * 历史：旧版用 `useInView + useSpring` 做 "0 → N" 滚动。
 * 首屏快速浏览时用户会看到编号从 0 跳到 01/02/03 · 和禅意调性不符 ·
 * 也存在 SSR hydration 时机的视觉闪烁。
 *
 * 现在：SSR 直出最终值 · 保留组件签名向后兼容。
 * 如需动效可将具体使用点替换为 framer-motion spring · 不影响此处。
 */
export function NumberTicker({
  value,
  decimals = 0,
  className,
  prefix,
  suffix,
}: NumberTickerProps) {
  const display = value.toFixed(decimals)
  return (
    <span className={className} aria-label={`${prefix ?? ''}${value}${suffix ?? ''}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}
