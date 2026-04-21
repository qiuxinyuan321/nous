'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ChatMessage } from '@/lib/ai/types'
import { InkBorderBeam } from '@/components/landing/magic/InkBorderBeam'

interface PlanConfirmDialogProps {
  open: boolean
  messages: ChatMessage[]
  ideaTitle: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

/**
 * 生成方案前的"预览确认"对话框：
 * - 展示 AI 对话里最后 4 条用户回答作为要点，让用户看到 AI 当前掌握的信息
 * - 确认后才真正调用 generatePlanAction
 * - 避免点错/理解不一致时浪费一次 AI 生成调用
 */
export function PlanConfirmDialog({
  open,
  messages,
  ideaTitle,
  onConfirm,
  onCancel,
  loading = false,
}: PlanConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, loading, onCancel])

  const reduce = useReducedMotion()

  const userAnswers = messages
    .filter((m) => m.role === 'user')
    .slice(-4)
    .map((m) => m.content.trim())
    .filter(Boolean)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={() => !loading && onCancel()}
          role="presentation"
        >
          <motion.div
            initial={
              reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20, filter: 'blur(8px)' }
            }
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="border-ink-light/30 bg-paper-rice relative max-w-lg overflow-hidden rounded-md border p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <InkBorderBeam duration={12} />
            <h2 className="font-serif-cn text-ink-heavy text-xl">准备把对话落成方案</h2>
            <p className="text-ink-medium mt-2 text-sm leading-relaxed">
              AI 会基于当前掌握的信息生成目标、里程碑和任务。生成通常需要 10-20 秒。
            </p>

            <div className="border-ink-light/20 bg-paper-aged/40 mt-5 rounded-sm border p-4">
              <p className="text-ink-light mb-3 text-[11px] tracking-wider uppercase">当前理解</p>
              {ideaTitle && (
                <p className="font-serif-cn text-ink-heavy mb-3 text-sm">
                  题目：<span className="text-ink-medium">{ideaTitle}</span>
                </p>
              )}
              {userAnswers.length > 0 ? (
                <ul className="space-y-2">
                  {userAnswers.map((answer, i) => (
                    <li
                      key={i}
                      className="text-ink-medium border-ink-light/25 border-l pl-3 text-xs leading-relaxed"
                    >
                      <span className="text-ink-light font-mono text-[10px]">
                        {String(i + 1).padStart(2, '0')}
                      </span>{' '}
                      {answer.length > 120 ? `${answer.slice(0, 120)}…` : answer}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ink-light text-xs">（暂无对话记录）</p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="text-ink-medium hover:text-ink-heavy px-3 py-1.5 text-sm transition disabled:opacity-50"
              >
                再聊聊
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="bg-gold-leaf hover:bg-ink-heavy flex items-center gap-2 rounded-sm px-4 py-1.5 text-sm text-[color:var(--paper-rice)] transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="bg-paper-rice inline-block h-1.5 w-1.5 animate-bounce rounded-full" />
                    生成中…
                  </>
                ) : (
                  '确认生成'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
