'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface FaqItem {
  key: string
  q: string
  a: string
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {items.map((item) => {
        const isOpen = open === item.key
        return (
          <div
            key={item.key}
            className={cn(
              'border-ink-light/25 bg-paper-aged/30 overflow-hidden rounded-md border transition-colors duration-300',
              isOpen && 'border-ink-heavy/45 bg-paper-aged/60 shadow-sm',
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : item.key)}
              aria-expanded={isOpen}
              className="font-serif-cn text-ink-heavy flex w-full items-center justify-between gap-6 px-5 py-4 text-left text-base font-medium"
            >
              <span>{item.q}</span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="text-ink-light shrink-0 text-xl leading-none"
                aria-hidden
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="text-ink-medium px-5 pb-5 text-sm leading-relaxed whitespace-pre-line">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
