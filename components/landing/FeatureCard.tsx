'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Accent = 'cinnabar' | 'celadon' | 'indigo-stone'

interface FeatureCardProps {
  index: number
  title: string
  desc: string
  accent: Accent
}

const accentBorder: Record<Accent, string> = {
  cinnabar: 'group-hover:border-cinnabar/60',
  celadon: 'group-hover:border-celadon/60',
  'indigo-stone': 'group-hover:border-indigo-stone/60',
}

const accentBg: Record<Accent, string> = {
  cinnabar: 'bg-cinnabar',
  celadon: 'bg-celadon',
  'indigo-stone': 'bg-indigo-stone',
}

const accentGradient: Record<Accent, string> = {
  cinnabar: 'from-cinnabar/12',
  celadon: 'from-celadon/12',
  'indigo-stone': 'from-indigo-stone/12',
}

export function FeatureCard({ index, title, desc, accent }: FeatureCardProps) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={cn(
        'group bg-paper-rice/40 relative overflow-hidden rounded-xl border border-white/40 p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-lg transition-colors duration-300 dark:border-white/10 dark:bg-black/10 dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)]',
        accentBorder[accent],
      )}
    >
      <span
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100',
          accentGradient[accent],
        )}
        aria-hidden
      />

      <span
        className={cn(
          'font-serif-en text-paper-rice absolute top-4 right-4 flex h-10 w-10 -rotate-6 items-center justify-center rounded-sm text-sm font-medium shadow-sm transition-transform duration-300 group-hover:rotate-0',
          accentBg[accent],
        )}
      >
        {String(index).padStart(2, '0')}
      </span>

      <h3 className="font-serif-cn text-ink-heavy relative mt-1 mb-3 pr-12 text-lg font-medium">
        {title}
      </h3>
      <p className="text-ink-medium relative text-sm leading-relaxed">{desc}</p>

      <span className="from-ink-light/40 absolute bottom-0 left-6 h-px w-10 bg-gradient-to-r to-transparent transition-all duration-500 group-hover:w-24" />
    </motion.article>
  )
}
