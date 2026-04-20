'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface WorkflowItemProps {
  title: string
  desc: string
  index: number
}

export function WorkflowItem({ title, desc, index }: WorkflowItemProps) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      className="flex gap-5 group"
    >
      <span className="bg-ink-heavy text-paper-rice font-serif-en flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition-transform group-hover:scale-110">
        {index + 1}
      </span>
      <div>
        <h3 className="font-serif-cn text-ink-heavy text-base font-medium transition-colors group-hover:text-black">
          {title}
        </h3>
        <p className="text-ink-medium mt-1 text-sm leading-relaxed">
          {desc}
        </p>
      </div>
    </motion.li>
  )
}
