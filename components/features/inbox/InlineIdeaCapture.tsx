'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useCreateIdea } from '@/lib/hooks/useIdeas'

interface InlineIdeaCaptureProps {
  compact?: boolean
  autoNavigate?: boolean
}

export function InlineIdeaCapture({
  compact = false,
  autoNavigate = true,
}: InlineIdeaCaptureProps) {
  const t = useTranslations('inbox.quickCapture')
  const locale = useLocale()
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { mutateAsync, isPending } = useCreateIdea()

  async function submit() {
    const rawContent = value.trim()
    if (!rawContent || isPending) return
    setError(null)
    try {
      const idea = await mutateAsync({ rawContent })
      setValue('')
      if (autoNavigate) router.push(`/${locale}/refine/${idea.id}`)
    } catch (err) {
      setError((err as Error).message || '保存失败，请稍后再试')
    }
  }

  return (
    <div className="border-ink-light/30 bg-paper-aged/30 w-full rounded-lg border p-3 text-left shadow-sm">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void submit()
          }
        }}
        rows={compact ? 3 : 4}
        placeholder={t('placeholder')}
        className="font-serif-cn text-ink-heavy placeholder:text-ink-light min-h-24 w-full resize-none bg-transparent text-base leading-relaxed outline-none"
      />
      <div className="border-ink-light/15 mt-3 flex items-center justify-between gap-3 border-t pt-3">
        <span className="text-ink-light text-xs">Enter 保存 · Shift+Enter 换行</span>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!value.trim() || isPending}
          className="bg-ink-heavy hover:bg-ink-medium rounded-sm px-4 py-2 text-sm text-[color:var(--paper-rice)] transition disabled:opacity-40"
        >
          {isPending ? '落笔中…' : t('save')}
        </button>
      </div>
      {error && <p className="text-cinnabar mt-2 text-xs">{error}</p>}
    </div>
  )
}
