'use client'

import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatAnchor, nextAnchor, parseAnchor, prevAnchor } from '@/lib/chronicle/range'
import type { ChronicleView } from '@/lib/chronicle/types'

interface Props {
  view: ChronicleView
  anchor: string
  rangeLabel: string
}

/**
 * Chronicle 顶部导航：view 切换 · ← / → 翻页 · 回今日
 * -----------------------------------------------------------
 * 用 URL query 持久化 (view, date) · 不引新 store。
 */
export function DateNav({ view, anchor, rangeLabel }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function go(nextView: ChronicleView, nextDate: string) {
    const usp = new URLSearchParams(params.toString())
    usp.set('view', nextView)
    usp.set('date', nextDate)
    router.push(`${pathname}?${usp.toString()}`)
  }

  const anchorDate = parseAnchor(anchor)

  return (
    <header className="border-ink-light/15 mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
      <div className="flex items-center gap-3">
        <CalendarDays className="text-ink-medium h-5 w-5" aria-hidden />
        <h1 className="font-serif-cn text-ink-heavy text-xl tracking-wide">编年</h1>
        <span className="text-ink-light text-xs tabular-nums">{rangeLabel}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* view 切换 */}
        <div className="border-ink-light/20 inline-flex overflow-hidden rounded-sm border">
          {(['day', 'week', 'month'] as const).map((v) => {
            const label = v === 'day' ? '日' : v === 'week' ? '周' : '月'
            const active = v === view
            return (
              <button
                key={v}
                type="button"
                onClick={() => go(v, anchor)}
                className={cn(
                  'border-ink-light/20 border-r px-3 py-1 text-xs transition last:border-r-0',
                  active
                    ? 'bg-ink-heavy text-[color:var(--paper-rice)]'
                    : 'text-ink-medium hover:bg-paper-aged/60',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* 翻页 */}
        <button
          type="button"
          onClick={() => go(view, formatAnchor(prevAnchor(view, anchorDate)))}
          className="border-ink-light/20 text-ink-medium hover:bg-paper-aged/60 rounded-sm border p-1.5 transition"
          aria-label="上一个"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => go(view, formatAnchor(new Date()))}
          className="border-ink-light/20 text-ink-medium hover:bg-paper-aged/60 rounded-sm border px-2.5 py-1 text-[11px] transition"
        >
          今日
        </button>
        <button
          type="button"
          onClick={() => go(view, formatAnchor(nextAnchor(view, anchorDate)))}
          className="border-ink-light/20 text-ink-medium hover:bg-paper-aged/60 rounded-sm border p-1.5 transition"
          aria-label="下一个"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
