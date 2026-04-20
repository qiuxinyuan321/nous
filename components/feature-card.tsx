'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface FeatureCardProps {
  title: string
  desc: string
  index: number
}

export function FeatureCard({ title, desc, index }: FeatureCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
      whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
      className="border-ink-light/30 bg-paper-aged/40 hover:bg-paper-aged/60 rounded-md border p-6 backdrop-blur-md transition-colors"
    >
      <h3 className="font-serif-cn text-ink-heavy mb-2 text-lg font-medium">
        {title}
      </h3>
      <p className="text-ink-medium text-sm leading-relaxed">
        {desc}
      </p>
    </motion.article>
  )
}
