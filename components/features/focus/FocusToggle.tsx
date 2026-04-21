'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface FocusToggleProps {
  taskId: string
  focused: boolean
  size?: 'sm' | 'md'
}

/** 加入/移出今日聚焦的小按钮 */
export function FocusToggle({ taskId, focused, size = 'sm' }: FocusToggleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useState(focused)

  const onClick = () => {
    const next = !optimistic
    setOptimistic(next)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/focus`, {
          method: next ? 'POST' : 'DELETE',
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        if (next) {
          router.push('/focus')
        } else {
          router.refresh()
        }
      } catch {
        setOptimistic(!next) // 回滚
      }
    })
  }

  const base =
    size === 'sm'
      ? 'text-[11px] px-2 py-0.5 rounded-sm border transition'
      : 'text-xs px-3 py-1 rounded-sm border transition'

  const classes = optimistic
    ? `${base} border-cinnabar/60 text-cinnabar bg-cinnabar/5 hover:bg-cinnabar/10`
    : `${base} border-ink-light/40 text-ink-medium hover:border-ink-heavy/50 hover:text-ink-heavy`

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={`${classes} disabled:opacity-50`}
      aria-pressed={optimistic}
    >
      {optimistic ? '✓ 今日' : '加入今日'}
    </button>
  )
}
