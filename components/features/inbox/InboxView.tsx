'use client'

import { useTranslations } from 'next-intl'
import { IdeaCard } from '@/components/features/inbox/IdeaCard'
import { Seal } from '@/components/ink/Seal'
import { useIdeas } from '@/lib/hooks/useIdeas'
import { usePaletteStore } from '@/lib/stores/palette'

export function InboxView() {
  const t = useTranslations('inbox')
  const tCommon = useTranslations('common')
  const { data: ideas, isLoading, error } = useIdeas()
  const openPalette = usePaletteStore((s) => s.openPalette)

  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)
  const kbd = isMac ? '⌘K' : 'Ctrl+K'

  if (isLoading) {
    return <p className="text-ink-light py-24 text-center text-sm">{tCommon('loading')}</p>
  }

  if (error) {
    return (
      <p className="text-cinnabar py-24 text-center text-sm">
        {tCommon('error')}: {(error as Error).message}
      </p>
    )
  }

  return (
    <div>
      <div className="mb-10 flex items-center justify-between">
        <h1 className="font-serif-cn text-ink-heavy text-3xl">{t('title')}</h1>
        <button
          onClick={openPalette}
          className="border-ink-light/50 bg-paper-aged/50 text-ink-medium hover:border-ink-heavy hover:text-ink-heavy flex items-center gap-2 rounded-sm border px-3 py-1.5 text-sm transition"
        >
          <span>+</span>
          <span>落一笔</span>
          <kbd className="border-ink-light/40 rounded border px-1.5 py-0.5 font-mono text-[10px]">
            {kbd}
          </kbd>
        </button>
      </div>

      {!ideas || ideas.length === 0 ? (
        <div className="flex flex-col items-center py-32 text-center">
          <Seal variant="pending" size="lg">
            待
          </Seal>
          <p className="text-ink-medium mt-8 text-base">{t('empty')}</p>
          <button
            onClick={openPalette}
            className="text-indigo-stone hover:text-ink-heavy mt-6 text-sm underline-offset-4 transition hover:underline"
          >
            按 {kbd} 开始
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  )
}
