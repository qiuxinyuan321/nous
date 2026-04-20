'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Seal } from '@/components/ink/Seal'
import { InkStroke } from '@/components/ink/InkStroke'
import { useGraph } from '@/lib/hooks/useGraph'
import { IdeaGraph } from '@/components/features/graph/IdeaGraph'
import { NodeDetail } from '@/components/features/graph/NodeDetail'
import { cn } from '@/lib/utils'
import type { IdeaStatus } from '@/lib/graph/types'

const STATUS_OPTIONS: Array<{ key: IdeaStatus | 'all'; color: string }> = [
  { key: 'all', color: '#1C1B19' },
  { key: 'raw', color: '#8B8880' },
  { key: 'refining', color: '#3E5871' },
  { key: 'planned', color: '#B8955A' },
  { key: 'executing', color: '#6B8E7A' },
  { key: 'done', color: '#1C1B19' },
]

export function GraphView() {
  const t = useTranslations('graph')
  const tCommon = useTranslations('common')
  const { data, isLoading, error } = useGraph()

  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<IdeaStatus | 'all'>('all')

  // 观察容器尺寸
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect
        setSize({ w: Math.max(320, width), h: Math.max(360, height) })
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

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
  if (!data) return null

  const isEmpty = data.meta.ideaCount === 0

  return (
    <div className="flex h-[calc(100vh-3.5rem-6rem)] min-h-[560px] flex-col gap-4">
      {/* 头部 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif-cn text-ink-heavy text-3xl">{t('title')}</h1>
          <div className="mt-3 w-16 opacity-70">
            <InkStroke variant="thin" />
          </div>
          <p className="text-ink-light mt-3 text-xs tracking-wide">
            {t('summary', {
              ideas: data.meta.ideaCount,
              tags: data.meta.tagCount,
              untagged: data.meta.untaggedIdeaCount,
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_OPTIONS.map((s) => {
            const active = filter === s.key
            return (
              <button
                key={s.key}
                onClick={() => setFilter(s.key)}
                type="button"
                className={cn(
                  'border-ink-light/40 hover:border-ink-heavy flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition',
                  active && 'border-ink-heavy bg-ink-heavy/5 text-ink-heavy',
                  !active && 'text-ink-medium',
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                  aria-hidden
                />
                {t(`filter.${s.key}`)}
              </button>
            )
          })}
        </div>
      </div>

      {/* 画布 + 侧栏 */}
      <div
        ref={containerRef}
        className="border-ink-light/30 relative flex-1 overflow-hidden rounded-lg border"
      >
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <Seal variant="pending" size="lg">
              空
            </Seal>
            <p className="text-ink-medium text-sm">{t('empty')}</p>
          </div>
        ) : (
          <>
            <IdeaGraph
              data={data}
              width={size.w}
              height={size.h}
              selectedId={selectedId}
              onSelect={setSelectedId}
              statusFilter={filter}
            />
            <NodeDetail data={data} selectedId={selectedId} onClose={() => setSelectedId(null)} />
            <div className="border-ink-light/30 bg-paper-rice/90 text-ink-light pointer-events-none absolute bottom-3 left-3 rounded border px-3 py-1.5 text-[11px] backdrop-blur-sm">
              {t('hint')}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
