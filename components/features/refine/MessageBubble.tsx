'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getPersona, isValidPersonaId } from '@/lib/proactive/personas'
import { PersonaAvatar } from '@/components/proactive/PersonaAvatar'

export function MessageBubble({
  role,
  content,
  streaming,
  personaId,
}: {
  role: 'user' | 'assistant' | 'system'
  content: string
  streaming?: boolean
  /** assistant 消息可选 · 展示当时用的 persona 小标识 */
  personaId?: string | null
}) {
  const reduce = useReducedMotion()
  if (role === 'system') return null

  const isUser = role === 'user'
  // 流式输出期间不做 blur 入场动画，避免每次 token 变化都触发动画
  const animate = !streaming && !reduce

  // assistant 且 persona 有效且非 auto 才显示小徽章
  const persona =
    !isUser && isValidPersonaId(personaId) && personaId !== 'auto' ? getPersona(personaId) : null

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 8, filter: 'blur(4px)' } : false}
      animate={animate ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}
    >
      {persona && (
        <span
          className="text-ink-light font-serif-cn inline-flex items-center gap-1.5 px-1 text-[10px] tracking-[0.15em]"
          title={`由 ${persona.name} 回应`}
        >
          <PersonaAvatar persona={persona} size={16} />
          <span>{persona.name}</span>
        </span>
      )}
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
