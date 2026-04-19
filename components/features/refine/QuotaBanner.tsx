'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { useQuota } from '@/lib/hooks/useQuota'

export function QuotaBanner() {
  const t = useTranslations('quota')
  const { data } = useQuota()

  if (!data) return null
  if (data.source === 'byok') return null
  if (data.remaining === null) return null

  const exhausted = data.remaining === 0
  const warn = data.remaining <= 5

  if (!warn) return null

  return (
    <div
      className={
        exhausted
          ? 'border-cinnabar/60 bg-cinnabar/10 text-cinnabar mb-6 flex flex-wrap items-center justify-between gap-3 rounded-sm border px-4 py-3 text-sm'
          : 'border-gold-leaf/50 bg-gold-leaf/10 text-ink-heavy mb-6 flex flex-wrap items-center justify-between gap-3 rounded-sm border px-4 py-3 text-sm'
      }
    >
      <span>{exhausted ? t('exhausted') : t('remaining', { count: data.remaining })}</span>
      <Link href="/settings/api-keys" className="underline-offset-4 hover:underline">
        {t('configureKey')} →
      </Link>
    </div>
  )
}
