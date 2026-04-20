'use client'

import { useTransition } from 'react'
import { usePathname, useRouter } from '@/lib/i18n/navigation'
import { locales, localeLabels, type Locale } from '@/lib/i18n/config'

interface Props {
  current: Locale
}

export function LanguagePicker({ current }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const onPick = (locale: Locale) => {
    if (locale === current) return
    startTransition(() => {
      router.replace(pathname, { locale })
      router.refresh()
    })
  }

  return (
    <ul className="space-y-3">
      {locales.map((lc) => (
        <li key={lc}>
          <button
            type="button"
            onClick={() => onPick(lc)}
            disabled={isPending}
            className={`w-full rounded-sm border px-5 py-4 text-left transition disabled:opacity-60 ${
              lc === current
                ? 'border-cinnabar/60 bg-cinnabar/5'
                : 'border-ink-light/30 bg-paper-aged/30 hover:border-ink-heavy/40'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-serif-cn text-ink-heavy text-base font-medium">
                  {localeLabels[lc]}
                </div>
                <div className="text-ink-light mt-0.5 font-mono text-[11px]">{lc}</div>
              </div>
              {lc === current && (
                <span className="text-cinnabar font-mono text-[10px] tracking-widest uppercase">
                  · Active
                </span>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
