'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function MessageBubble({
  role,
  content,
  streaming,
}: {
  role: 'user' | 'assistant' | 'system'
  content: string
  streaming?: boolean
}) {
  const reduce = useReducedMotion()
  if (role === 'system') return null

  const isUser = role === 'user'
  // 流式输出期间不做 blur 入场动画，避免每次 token 变化都触发动画
  const animate = !streaming && !reduce

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 8, filter: 'blur(4px)' } : false}
      animate={animate ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'font-serif-cn relative max-w-[82%] rounded-sm px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-ink-heavy text-[color:var(--paper-rice)] shadow-[0_6px_20px_-10px_rgba(28,27,25,0.45)]'
            : 'border-ink-light/30 bg-paper-aged/60 text-ink-heavy border',
        )}
      >
        {content}
        {streaming && (
          <span
            className="text-ink-medium ml-0.5 inline-block h-4 w-[2px] translate-y-[2px] animate-[blink_1s_step-end_infinite] bg-current align-middle"
            aria-hidden="true"
          />
        )}
      </div>
    </motion.div>
  )
}
