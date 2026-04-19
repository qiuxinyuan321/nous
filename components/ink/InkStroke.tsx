import { cn } from '@/lib/utils'

interface InkStrokeProps {
  variant?: 'thin' | 'medium' | 'thick'
  className?: string
}

/**
 * 水墨笔触分割线
 * ----------
 * SVG 模拟毛笔一划，两端渐变、中段饱满。
 */
export function InkStroke({ variant = 'medium', className }: InkStrokeProps) {
  const heights = { thin: 2, medium: 3, thick: 5 }
  const height = heights[variant]

  return (
    <svg
      viewBox="0 0 400 10"
      preserveAspectRatio="none"
      className={cn('text-ink-heavy w-full opacity-70', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ink-stroke-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="10%" stopColor="currentColor" stopOpacity="0.7" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="90%" stopColor="currentColor" stopOpacity="0.6" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 5 Q 100 2, 200 5 T 400 5"
        stroke="url(#ink-stroke-gradient)"
        strokeWidth={height}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
