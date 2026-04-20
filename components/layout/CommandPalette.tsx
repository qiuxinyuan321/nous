'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { usePaletteStore } from '@/lib/stores/palette'
import { useCreateIdea } from '@/lib/hooks/useIdeas'
import { VoiceButton } from '@/components/features/inbox/VoiceButton'

/**
 * ⌘K CommandPalette —— 零摩擦捕获。
 * - 全局 ⌘K / Ctrl+K 唤起
 * - Enter 保存，Shift+Enter 换行，Esc 关闭
 * - 水墨晕染入场（clip-path + blur）
 * - 麦克风按钮: 语音 → Whisper → 填入 textarea
 */
export function CommandPalette() {
  const t = useTranslations('inbox.quickCapture')
  const { open, closePalette } = usePaletteStore()
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { mutateAsync, isPending } = useCreateIdea()

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => textareaRef.current?.focus(), 10)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        usePaletteStore.getState().togglePalette()
      }
      if (e.key === 'Escape' && usePaletteStore.getState().open) {
        usePaletteStore.getState().closePalette()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim() || isPending) return
    try {
      await mutateAsync({ rawContent: value.trim() })
      setValue('')
      closePalette()
    } catch (err) {
      console.error(err)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit(e as unknown as React.FormEvent)
    }
  }

  function handleTranscript(text: string | null) {
    if (!text) return
    // 若输入框已有内容则换行追加,否则直接填入
    setValue((prev) => (prev.trim() ? `${prev.trimEnd()}\n${text}` : text))
    textareaRef.current?.focus()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={closePalette}
        >
          <motion.div
            className="bg-paper-rice/70 absolute inset-0 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="border-ink-light/30 bg-paper-aged/95 relative w-full max-w-xl overflow-hidden rounded-sm border shadow-2xl"
            initial={{ y: -16, opacity: 0, filter: 'blur(6px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: -8, opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={5}
              placeholder={t('placeholder')}
              className="font-serif-cn text-ink-heavy w-full resize-none bg-transparent px-6 py-5 text-lg leading-relaxed outline-none placeholder:text-[color:var(--ink-light)]"
            />
            <div className="border-ink-light/20 flex flex-wrap items-center gap-3 border-t px-4 py-3">
              <VoiceButton onTranscript={handleTranscript} />
              <div className="text-ink-light ml-auto flex items-center gap-3 text-xs">
                <span className="hidden sm:inline">
                  <kbd className="border-ink-light/40 rounded border px-1.5 py-0.5 font-mono text-[10px]">
                    Enter
                  </kbd>{' '}
                  落笔 ·{' '}
                  <kbd className="border-ink-light/40 rounded border px-1.5 py-0.5 font-mono text-[10px]">
                    Esc
                  </kbd>{' '}
                  离开
                </span>
                <button
                  type="submit"
                  disabled={!value.trim() || isPending}
                  className="bg-ink-heavy hover:bg-ink-medium rounded px-3 py-1 text-xs text-[color:var(--paper-rice)] transition disabled:opacity-40"
                >
                  {isPending ? '…' : t('save')}
                </button>
              </div>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
