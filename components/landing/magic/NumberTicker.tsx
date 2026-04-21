'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

interface NumberTickerProps {
  value: number
  decimals?: number
  duration?: number // spring 速度感受（越大越慢）
  className?: string
  prefix?: string
  suffix?: string
}

/**
 * 禅意版 NumberTicker：数字滚动到目标值
 * - 墨色风格，不带浮夸 bounce，用温和 spring
 * - 支持 prefixed 数字（如 01 / 02）：value=1 配 decimals=0 + prefix="0"
 * - 尊重 prefers-reduced-motion
 */
export function NumberTicker({
  value,
  decimals = 0,
  duration = 2,
  className,
  prefix,
  suffix,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduce = useReducedMotion()

  const mv = useMotionValue(reduce ? value : 0)
  const spring = useSpring(mv, { damping: 40 + duration * 10, stiffness: 90 })
  const [display, setDisplay] = useState<string>(
    reduce ? value.toFixed(decimals) : (0).toFixed(decimals),
  )

  useEffect(() => {
    if (reduce) return
    if (inView) mv.set(value)
  }, [inView, mv, reduce, value])

  useEffect(() => {
    const unsub = spring.on('change', (latest) => {
      setDisplay(latest.toFixed(decimals))
    })
    return () => unsub()
  }, [spring, decimals])

  return (
    <motion.span
      ref={ref}
      className={className}
      aria-label={`${prefix ?? ''}${value}${suffix ?? ''}`}
    >
      {prefix}
      {display}
      {suffix}
    </motion.span>
  )
}
