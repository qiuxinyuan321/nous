'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useMemories,
  useCreateMemory,
  useDeleteMemory,
  useUpdateMemory,
  type MemoryDTO,
} from '@/lib/hooks/useMemories'
import { MEMORY_KINDS, type MemoryKind } from '@/lib/memory/store'
import { Seal } from '@/components/ink/Seal'
import { InkStroke } from '@/components/ink/InkStroke'
import { cn } from '@/lib/utils'

const KIND_ACCENT: Record<MemoryKind, string> = {
  preference: 'bg-cinnabar/70',
  habit: 'bg-celadon/70',
  goal: 'bg-gold-leaf/80',
  blindspot: 'bg-indigo-stone/70',
  fact: 'bg-ink-heavy/70',
}

export function MemoryView() {
  const t = useTranslations('memory')
  const tCommon = useTranslations('common')
  const { data, isLoading, error } = useMemories()
  const create = useCreateMemory()
  const remove = useDeleteMemory()

  const [kind, setKind] = useState<MemoryKind>('preference')
  const [content, setContent] = useState('')
  const [importance, setImportance] = useState(3)
  const [filter, setFilter] = useState<MemoryKind | 'all'>('all')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || create.isPending) return
    try {
      await create.mutateAsync({ kind, content: content.trim(), importance })
      setContent('')
      setImportance(3)
    } catch (err) {
      console.error(err)
    }
  }

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

  const memories = data ?? []
  const filtered = filter === 'all' ? memories : memories.filter((m) => m.kind === filter)
  const counts = new Map<MemoryKind, number>()
  for (const m of memories) counts.set(m.kind, (counts.get(m.kind) ?? 0) + 1)

  return (
    <div>
      {/* 标题 */}
      <div>
        <h1 className="font-serif-cn text-ink-heavy text-3xl">{t('title')}</h1>
        <div className="mt-3 w-16 opacity-70">
          <InkStroke variant="thin" />
        </div>
        <p className="text-ink-medium mt-4 max-w-2xl text-sm leading-relaxed">{t('intro')}</p>
      </div>

      {/* 添加表单 */}
      <section className="mt-10">
        <form
          onSubmit={handleSubmit}
          className="border-ink-light/30 bg-paper-aged/40 space-y-4 rounded-md border p-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            {MEMORY_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  'font-serif-cn rounded-full px-3 py-1 text-xs transition',
                  kind === k
                    ? 'bg-ink-heavy text-paper-rice'
                    : 'border-ink-light/50 text-ink-medium hover:border-ink-heavy border',
                )}
              >
                {t(`kind.${k}`)}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('placeholder')}
            rows={3}
            maxLength={500}
            className="font-serif-cn text-ink-heavy placeholder:text-ink-light/70 w-full resize-none rounded-sm bg-transparent p-3 text-sm leading-relaxed outline-none"
          />
          <div className="flex items-center justify-between">
            <label className="text-ink-light flex items-center gap-3 text-xs">
              <span>{t('importance')}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setImportance(n)}
                    aria-label={`${n}`}
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition',
                      n <= importance ? 'bg-cinnabar' : 'bg-ink-light/30',
                    )}
                  />
                ))}
              </div>
            </label>
            <button
              type="submit"
              disabled={!content.trim() || create.isPending}
              className="bg-ink-heavy hover:bg-ink-medium rounded px-4 py-1.5 text-xs text-[color:var(--paper-rice)] transition disabled:opacity-40"
            >
              {create.isPending ? '…' : t('save')}
            </button>
          </div>
        </form>
      </section>

      {/* 过滤 chips */}
      <section className="mt-8 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-full border px-3 py-1 text-xs transition',
            filter === 'all'
              ? 'border-ink-heavy text-ink-heavy'
              : 'border-ink-light/40 text-ink-medium hover:border-ink-heavy',
          )}
        >
          {t('filter.all')} · {memories.length}
        </button>
        {MEMORY_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition',
              filter === k
                ? 'border-ink-heavy text-ink-heavy'
                : 'border-ink-light/40 text-ink-medium hover:border-ink-heavy',
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', KIND_ACCENT[k])} />
            {t(`kind.${k}`)} · {counts.get(k) ?? 0}
          </button>
        ))}
      </section>

      {/* 列表 */}
      <section className="mt-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Seal variant="pending" size="lg">
              待
            </Seal>
            <p className="text-ink-medium mt-8 text-sm">
              {memories.length === 0 ? t('empty') : t('emptyFilter')}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {filtered.map((m) => (
                <MemoryRow key={m.id} memory={m} onDelete={() => remove.mutate(m.id)} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  )
}

function MemoryRow({ memory, onDelete }: { memory: MemoryDTO; onDelete: () => void }) {
  const t = useTranslations('memory')
  const update = useUpdateMemory()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(memory.content)

  async function save() {
    if (!draft.trim() || draft.trim() === memory.content) {
      setEditing(false)
      return
    }
    try {
      await update.mutateAsync({ id: memory.id, content: draft.trim() })
      setEditing(false)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2 }}
      className="border-ink-light/25 bg-paper-rice/60 hover:border-ink-heavy/50 group flex gap-4 rounded-md border p-4 transition"
    >
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <span
          className={cn('h-2 w-2 rounded-full', KIND_ACCENT[memory.kind])}
          title={t(`kind.${memory.kind}`)}
        />
        <div className="mt-1 flex flex-col gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={cn(
                'h-1 w-1 rounded-full',
                n <= memory.importance ? 'bg-cinnabar/80' : 'bg-ink-light/25',
              )}
            />
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-ink-light font-serif-en text-[10px] tracking-widest uppercase">
            {t(`kind.${memory.kind}`)}
          </span>
          {memory.source !== 'manual' && (
            <span className="text-ink-light bg-ink-light/10 rounded px-1.5 py-0.5 text-[9px] tracking-wide">
              {t(`source.${memory.source.replace('-', '_')}`)}
            </span>
          )}
          {!memory.hasEmbedding && (
            <span
              className="text-ink-light/70 text-[9px] tracking-wide"
              title={t('noEmbeddingHint')}
            >
              ⋯
            </span>
          )}
        </div>

        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                save()
              }
              if (e.key === 'Escape') {
                setDraft(memory.content)
                setEditing(false)
              }
            }}
            rows={2}
            autoFocus
            className="text-ink-heavy mt-1.5 w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
          />
        ) : (
          <p
            onClick={() => setEditing(true)}
            className="text-ink-heavy mt-1.5 cursor-text text-sm leading-relaxed"
            title={t('clickToEdit')}
          >
            {memory.content}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        aria-label={t('delete')}
        className="text-ink-light/60 hover:text-cinnabar shrink-0 self-start text-sm opacity-0 transition group-hover:opacity-100"
      >
        ×
      </button>
    </motion.li>
  )
}
