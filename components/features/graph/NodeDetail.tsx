'use client'

import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@/lib/i18n/navigation'
import type { GraphData, GraphNode } from '@/lib/graph/types'
import { Seal } from '@/components/ink/Seal'
import { cn } from '@/lib/utils'

const STATUS_SEAL: Record<string, 'decision' | 'pending' | 'done'> = {
  raw: 'pending',
  refining: 'pending',
  planned: 'decision',
  executing: 'decision',
  done: 'done',
  archived: 'pending',
}

interface NodeDetailProps {
  data: GraphData
  selectedId: string | null
  onClose: () => void
}

export function NodeDetail({ data, selectedId, onClose }: NodeDetailProps) {
  const t = useTranslations('graph')

  const node: GraphNode | undefined = selectedId
    ? data.nodes.find((n) => n.id === selectedId)
    : undefined

  return (
    <AnimatePresence>
      {node && (
        <motion.aside
          key={node.id}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'border-ink-light/25 bg-paper-rice/95 absolute top-4 right-4 bottom-4 z-10 w-80 max-w-[85vw] overflow-y-auto rounded-md border p-6 shadow-xl backdrop-blur',
          )}
        >
          <button
            type="button"
            onClick={onClose}
            className="text-ink-light hover:text-ink-heavy absolute top-3 right-3 text-lg leading-none transition"
            aria-label={t('close')}
          >
            ×
          </button>

          {node.kind === 'idea' ? (
            <div>
              <div className="flex items-center gap-3">
                <Seal size="sm" variant={STATUS_SEAL[node.status] ?? 'pending'}>
                  {node.status === 'done' ? '成' : node.status === 'executing' ? '行' : '思'}
                </Seal>
                <span className="text-ink-light text-[11px] tracking-widest uppercase">
                  {t(`status.${node.status}`)}
                </span>
              </div>

              <h2 className="font-serif-cn text-ink-heavy mt-4 text-xl font-medium">
                {node.title}
              </h2>

              <p className="text-ink-medium mt-4 text-sm leading-relaxed whitespace-pre-line">
                {node.excerpt}
                {node.excerpt.length >= 140 && '…'}
              </p>

              <dl className="text-ink-light mt-6 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <dt>{t('stats.tags')}</dt>
                  <dd className="text-ink-heavy font-serif-en mt-0.5 text-base">{node.tagCount}</dd>
                </div>
                <div>
                  <dt>{t('stats.messages')}</dt>
                  <dd className="text-ink-heavy font-serif-en mt-0.5 text-base">
                    {node.messageCount}
                  </dd>
                </div>
                <div>
                  <dt>{t('stats.plan')}</dt>
                  <dd
                    className={cn(
                      'mt-0.5 text-base',
                      node.hasPlan ? 'text-celadon font-serif-en' : 'text-ink-light',
                    )}
                  >
                    {node.hasPlan ? '✓' : '—'}
                  </dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-col gap-2">
                <Link
                  href={`/refine/${node.id.slice('idea:'.length)}`}
                  className="bg-ink-heavy hover:bg-ink-medium rounded-sm px-4 py-2 text-center text-sm text-[color:var(--paper-rice)] transition"
                >
                  {t('actions.openRefine')}
                </Link>
                {node.hasPlan && (
                  <Link
                    href={`/plan/${node.id.slice('idea:'.length)}`}
                    className="border-ink-light/60 text-ink-medium hover:border-ink-heavy hover:text-ink-heavy rounded-sm border px-4 py-2 text-center text-sm transition"
                  >
                    {t('actions.openPlan')}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div>
              <Seal size="sm">{node.name.charAt(0)}</Seal>
              <h2 className="font-serif-cn text-ink-heavy mt-4 text-xl font-medium break-all">
                #{node.name}
              </h2>
              <p className="text-ink-medium mt-4 text-sm">
                {t('tagDescription', { count: node.count })}
              </p>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
