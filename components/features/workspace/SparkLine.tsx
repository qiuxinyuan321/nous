'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface SparkLineProps {
  data: number[]
  /** 使用 var(--xxx) 颜色变量 */
  stroke?: string
  /** 是否填充下方区域 */
  fill?: boolean
  width?: number
  height?: number
  className?: string
  /** 末端小圆点高亮 */
  lastDot?: boolean
}

/**
 * 禅意版 SparkLine：
 * - 纯 SVG，不依赖 recharts，构建包零增量
 * - 最后一个点默认高亮成朱砂红
 * - 数据全为 0 时退化为一条细线
 */
export function SparkLine({
  data,
  stroke = 'var(--ink-medium)',
  fill = false,
  width = 120,
  height = 32,
  className,
  lastDot = true,
}: SparkLineProps) {
  const { linePath, areaPath, lastPoint, isEmpty } = useMemo(() => {
    if (data.length === 0) {
      return { linePath: '', areaPath: '', lastPoint: null, isEmpty: true }
    }
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1
    const stepX = data.length > 1 ? width / (data.length - 1) : 0

    const points = data.map((v, i) => {
      const x = i * stepX
      // 留 2px 上下留白，避免末端触边
      const y = height - 2 - ((v - min) / range) * (height - 4)
      return { x, y }
    })

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ')

    const areaPath = `${linePath} L ${width.toFixed(2)} ${height} L 0 ${height} Z`
    const lastPoint = points[points.length - 1]
    const isEmpty = data.every((v) => v === 0)

    return { linePath, areaPath, lastPoint, isEmpty }
  }, [data, width, height])

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('block', className)}
      aria-hidden="true"
    >
      {fill && !isEmpty && (
        <defs>
          <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && !isEmpty && <path d={areaPath} fill="url(#sparkline-fill)" />}
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isEmpty ? 0.35 : 1}
      />
      {lastDot && lastPoint && !isEmpty && (
        <circle cx={lastPoint.x} cy={lastPoint.y} r={2} fill="var(--cinnabar)" />
      )}
    </svg>
  )
}
