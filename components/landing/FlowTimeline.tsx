'use client'

import { motion, useReducedMotion } from 'framer-motion'

export interface FlowStep {
  key: string
  title: string
  desc: string
}

export function FlowTimeline({ steps }: { steps: FlowStep[] }) {
  const reduce = useReducedMotion()

  return (
    <ol className="relative mx-auto max-w-3xl space-y-9 pl-10 md:pl-14">
      <span
        className="from-ink-heavy/50 via-ink-light/30 pointer-events-none absolute top-2 bottom-2 left-3 w-px bg-gradient-to-b to-transparent md:left-5"
        aria-hidden
      />

      {steps.map((step, idx) => (
        <motion.li
          key={step.key}
          initial={reduce ? false : { opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <span
            className="bg-ink-heavy text-paper-rice font-serif-en absolute top-0.5 left-[-2.5rem] flex h-7 w-7 items-center justify-center rounded-full text-xs shadow-[0_0_0_4px_var(--paper-rice)] md:left-[-3rem] md:h-8 md:w-8 md:text-sm"
            aria-hidden
          >
            {idx + 1}
          </span>

          <h3 className="font-serif-cn text-ink-heavy text-base font-medium md:text-lg">
            {step.title}
          </h3>
          <p className="text-ink-medium mt-1.5 text-sm leading-relaxed">{step.desc}</p>
        </motion.li>
      ))}
    </ol>
  )
}
