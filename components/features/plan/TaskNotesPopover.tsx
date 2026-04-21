'use client'

import { useEffect, useRef, useState } from 'react'
import { Link } from '@/lib/i18n/navigation'

interface LinkedNote {
  id: string
  title: string
}

interface TaskNotesPopoverProps {
  taskId: string
  initial: LinkedNote[]
}

/**
 * 任务关联笔记 Popover：
 * - 显示已关联笔记徽章 + 数量
 * - 点击展开：列出已关联笔记 + 搜索框 + 点击搜索结果关联
 * - 支持取消关联
 * - 乐观更新，失败时静默回滚
 */
export function TaskNotesPopover({ taskId, initial }: TaskNotesPopoverProps) {
  const [open, setOpen] = useState(false)
  const [linked, setLinked] = useState<LinkedNote[]>(initial)
  const [query, setQuery] = useState('')
  const [rawResults, setRawResults] = useState<LinkedNote[]>([])
  const [searching, setSearching] = useState(false)
  const results = query.trim() ? rawResults : []
  const popoverRef = useRef<HTMLDivElement | null>(null)

  // 关闭 popover：点击外部
  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  // 搜索（防抖 300ms）
  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (!q) return
    let cancelled = false
    const timer = setTimeout(() => {
      setSearching(true)
      fetch(`/api/notes?q=${encodeURIComponent(q)}&limit=8`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return
          const linkedIds = new Set(linked.map((n) => n.id))
          const filtered = (data.notes ?? [])
            .filter((n: LinkedNote) => !linkedIds.has(n.id))
            .map((n: LinkedNote) => ({ id: n.id, title: n.title }))
          setRawResults(filtered)
        })
        .catch(() => setRawResults([]))
        .finally(() => !cancelled && setSearching(false))
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, open, linked])

  async function handleLink(note: LinkedNote) {
    const prev = linked
    setLinked([...prev, note])
    setRawResults(rawResults.filter((r) => r.id !== note.id))
    setQuery('')
    try {
      const res = await fetch(`/api/tasks/${taskId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id, action: 'link' }),
      })
      if (!res.ok) throw new Error('link failed')
    } catch {
      setLinked(prev)
    }
  }

  async function handleUnlink(noteId: string) {
    const prev = linked
    setLinked(prev.filter((n) => n.id !== noteId))
    try {
      const res = await fetch(`/api/tasks/${taskId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, action: 'unlink' }),
      })
      if (!res.ok) throw new Error('unlink failed')
    } catch {
      setLinked(prev)
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`border-ink-light/30 hover:border-ink-heavy/50 hover:text-ink-heavy flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] transition ${
          linked.length > 0
            ? 'bg-celadon/10 border-celadon/40 text-celadon'
            : 'bg-paper-rice/40 text-ink-light'
        }`}
        title={linked.length > 0 ? `${linked.length} 条参考笔记` : '关联参考笔记'}
      >
        <svg
          viewBox="0 0 16 16"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M6 3.5A2.5 2.5 0 0 1 8.5 1h3A2.5 2.5 0 0 1 14 3.5v9A2.5 2.5 0 0 1 11.5 15h-3A2.5 2.5 0 0 1 6 12.5v-9Z" />
          <path d="M10 5v3M10 8h-3" strokeLinecap="round" />
        </svg>
        {linked.length > 0 ? linked.length : '资料'}
      </button>

      {open && (
        <div className="border-ink-light/30 bg-paper-rice absolute right-0 z-10 mt-1 w-72 rounded-sm border shadow-lg">
          {linked.length > 0 && (
            <div className="border-ink-light/20 border-b p-2">
              <p className="text-ink-light mb-2 text-[10px] tracking-wider uppercase">
                已关联 ({linked.length})
              </p>
              <ul className="space-y-1">
                {linked.map((n) => (
                  <li
                    key={n.id}
                    className="hover:bg-paper-aged/60 group flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs"
                  >
                    <Link
                      href={`/notes?noteId=${n.id}`}
                      target="_blank"
                      className="text-ink-heavy flex-1 truncate hover:underline"
                    >
                      {n.title || '无题'}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleUnlink(n.id)}
                      className="text-ink-light hover:text-cinnabar opacity-0 transition group-hover:opacity-100"
                      title="取消关联"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索笔记..."
              className="border-ink-light/30 bg-paper-rice/60 focus:border-ink-heavy text-ink-heavy placeholder:text-ink-light w-full rounded-sm border px-2 py-1.5 text-xs outline-none"
              autoFocus
            />

            {query.trim() && (
              <div className="mt-2 max-h-48 overflow-y-auto">
                {searching && <p className="text-ink-light px-2 py-1 text-xs">搜索中...</p>}
                {!searching && results.length === 0 && (
                  <p className="text-ink-light px-2 py-1 text-xs">没有匹配的笔记</p>
                )}
                <ul className="space-y-0.5">
                  {results.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleLink(n)}
                        className="hover:bg-paper-aged/60 text-ink-heavy w-full truncate rounded-sm px-2 py-1.5 text-left text-xs"
                      >
                        + {n.title || '无题'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
