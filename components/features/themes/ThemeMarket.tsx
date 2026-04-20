'use client'

import { useLocale, useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { useTheme } from '@/lib/hooks/useTheme'
import { InkStroke } from '@/components/ink/InkStroke'
import { cn } from '@/lib/utils'
import type { ThemeDef } from '@/lib/themes/catalog'

export function ThemeMarket() {
  const t = useTranslations('themes')
  const locale = useLocale() as 'zh-CN' | 'en-US'
  const { themeId, themes, apply } = useTheme()

  return (
    <div>
      <div>
        <h1 className="font-serif-cn text-ink-heavy text-3xl">{t('title')}</h1>
        <div className="mt-3 w-16 opacity-70">
          <InkStroke variant="thin" />
        </div>
        <p className="text-ink-medium mt-4 max-w-2xl text-sm leading-relaxed">{t('intro')}</p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            locale={locale}
            active={themeId === theme.id}
            onApply={() => apply(theme.id)}
            applyLabel={t('apply')}
            activeLabel={t('active')}
          />
        ))}
      </div>

      <p className="text-ink-light mt-10 max-w-2xl text-xs leading-relaxed">{t('footnote')}</p>
    </div>
  )
}

interface ThemeCardProps {
  theme: ThemeDef
  locale: 'zh-CN' | 'en-US'
  active: boolean
  onApply: () => void
  applyLabel: string
  activeLabel: string
}

function ThemeCard({ theme, locale, active, onApply, applyLabel, activeLabel }: ThemeCardProps) {
  const { paper, ink, accent } = theme.preview
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={cn(
        'border-ink-light/30 group overflow-hidden rounded-xl border transition',
        active && 'border-ink-heavy shadow-[0_20px_50px_-30px_rgba(28,27,25,0.45)]',
      )}
    >
      {/* 预览区: 用主题自己的 paper/ink/accent 画一幅缩略"作品" */}
      <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: paper }}>
        {/* 水墨笔一划 */}
        <svg
          viewBox="0 0 400 300"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M30 220 Q 140 150 220 180 T 380 120"
            stroke={ink}
            strokeWidth={16}
            fill="none"
            strokeLinecap="round"
            opacity={0.85}
          />
          {/* enso */}
          <path
            d="M90 120 Q 60 160 100 190 Q 140 200 160 170 Q 170 140 140 125"
            stroke={ink}
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            opacity={0.7}
          />
          {/* 朱砂/accent 点 */}
          <rect
            x="310"
            y="40"
            width="46"
            height="46"
            rx="3"
            fill={accent}
            opacity={0.92}
            transform="rotate(-6 333 63)"
          />
          <text
            x="333"
            y="73"
            textAnchor="middle"
            fill={paper}
            fontSize="22"
            fontFamily="Georgia, serif"
            transform="rotate(-6 333 63)"
          >
            思
          </text>
          {/* 小散点 */}
          <circle cx="60" cy="80" r="2.5" fill={ink} opacity={0.35} />
          <circle cx="180" cy="60" r="1.8" fill={ink} opacity={0.25} />
        </svg>

        {active && (
          <span className="bg-ink-heavy text-paper-rice absolute top-3 right-3 rounded-full px-2.5 py-1 text-[10px] tracking-wider uppercase">
            {activeLabel}
          </span>
        )}
      </div>

      <div className="bg-paper-aged/40 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif-cn text-ink-heavy text-lg font-medium">{theme.name[locale]}</h3>
          <span className="text-ink-light text-[10px] tracking-widest uppercase">{theme.kind}</span>
        </div>

        <p className="text-ink-medium mt-2 text-xs leading-relaxed">{theme.description[locale]}</p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-ink-light font-serif-en text-[10px] tracking-wide">
            by {theme.author}
          </span>
          <button
            type="button"
            onClick={onApply}
            disabled={active}
            className={cn(
              'rounded px-3 py-1 text-xs transition',
              active
                ? 'text-ink-light cursor-default'
                : 'bg-ink-heavy hover:bg-ink-medium text-[color:var(--paper-rice)]',
            )}
          >
            {active ? activeLabel : applyLabel}
          </button>
        </div>
      </div>
    </motion.article>
  )
}
