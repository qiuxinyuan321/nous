'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { Seal } from '@/components/ink/Seal'
import { cn } from '@/lib/utils'

interface HeroVisualProps {
  alt: string
  className?: string
}

export function HeroVisual({ alt, className }: HeroVisualProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative aspect-[16/9] w-full overflow-hidden rounded-2xl',
        'shadow-[0_40px_80px_-40px_rgba(28,27,25,0.35)]',
        'ring-ink-light/20 ring-1',
        className,
      )}
    >
      <motion.div
        animate={reduce ? undefined : { scale: [1.03, 1, 1.03], x: [-6, 6, -6] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0"
      >
        <Image
          src="/hero.jpg"
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover"
        />
      </motion.div>

      <div className="from-paper-rice/45 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent" />

      <motion.div
        className="absolute top-3 left-3 md:top-5 md:left-5"
        initial={reduce ? false : { rotate: -16, scale: 0.8, opacity: 0 }}
        animate={{ rotate: -6, scale: 1, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ rotate: 0, scale: 1.06 }}
      >
        <Seal size="lg">思</Seal>
      </motion.div>
    </motion.div>
  )
}
