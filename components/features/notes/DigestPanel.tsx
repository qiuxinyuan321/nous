'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { marked } from 'marked'
import { useCreateNote } from '@/lib/hooks/useNotes'
import type { NoteDTO } from '@/lib/types/note'

interface DigestPanelProps {
  notes: NoteDTO[]
  onClose: () => void
  onNavigate: (id: string) => void
}

async function requestDigest(data: {
  noteIds: string[]
  prompt?: string
}): Promise<{ id: string; result: string; noteCount: number }> {
  const res = await fetch('/api/notes/digest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `Digest failed: ${res.status}`)
  }
  return res.json()
}

export function DigestPanel({ notes, onClose, onNavigate }: DigestPanelProps) {
  const [prompt, setPrompt] = useState('')
  const createNote = useCreateNote()

  const digest = useMutation({
    mutationFn: requestDigest,
  })

  // Esc 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Markdown → HTML
  const digestResult = digest.data?.result
  const renderedHtml = useMemo(() => {
    if (!digestResult) return ''
    return marked.parse(digestResult, { async: false }) as string
  }, [digestResult])

  const handleGenerate = () => {
    digest.mutate({
      noteIds: notes.map((n) => n.id),
      prompt: prompt.trim() || undefined,
    })
  }

  const handleSaveAsNote = async () => {
    if (!digest.data) return
    const titles = notes.map((n) => n.title || '无题').join('、')
    const note = await createNote.mutateAsync({
      title: `整理: ${titles}`.slice(0, 100),
      content: digest.data.result,
    })
    onNavigate(note.id)
    onClose()
  }

  return (
    <div
      className="bg-paper-rice/95 border-ink-light/20 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="border-ink-light/30 bg-paper-rice mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border shadow-lg">
        {/* header */}
        <div className="border-ink-light/10 flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="font-serif-cn text-ink-heavy text-lg">AI 整理</h3>
            <p className="text-ink-light mt-1 text-xs">已选 {notes.length} 篇笔记</p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-light hover:text-ink-heavy text-lg transition"
          >
            ✕
          </button>
        </div>

        {/* 笔记列表 */}
        <div className="border-ink-light/10 border-b px-6 py-3">
          <div className="flex flex-wrap gap-2">
            {notes.map((n) => (
              <span
                key={n.id}
                className="border-ink-light/40 text-ink-medium rounded border px-2 py-0.5 text-xs"
              >
                {n.title || '无题'}
              </span>
            ))}
          </div>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="附加要求（可选）：如「侧重行动项」「用英文整理」"
            className="text-ink-heavy placeholder:text-ink-light/50 mt-3 w-full bg-transparent text-sm outline-none"
          />
        </div>

        {/* result */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {digest.isPending ? (
            <div className="text-ink-light flex items-center gap-2 py-8 text-center text-sm">
              <span className="animate-pulse">AI 正在整理中…</span>
            </div>
          ) : digest.isError ? (
            <p className="text-cinnabar py-4 text-sm">
              整理失败: {(digest.error as Error).message}
            </p>
          ) : digest.data ? (
            <div
              className="prose prose-sm text-ink-heavy max-w-none"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          ) : (
            <p className="text-ink-light py-8 text-center text-sm">点击下方按钮开始整理</p>
          )}
        </div>

        {/* footer */}
        <div className="border-ink-light/10 flex items-center justify-end gap-3 border-t px-6 py-4">
          {digest.data && (
            <button
              onClick={handleSaveAsNote}
              disabled={createNote.isPending}
              className="border-ink-light/40 text-ink-medium hover:border-ink-heavy hover:text-ink-heavy rounded border px-4 py-1.5 text-sm transition"
            >
              {createNote.isPending ? '保存中…' : '保存为新笔记'}
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={digest.isPending}
            className="bg-ink-heavy text-paper-rice hover:bg-ink-heavy/90 rounded px-4 py-1.5 text-sm transition disabled:opacity-50"
          >
            {digest.isPending ? '整理中…' : digest.data ? '重新整理' : '开始整理'}
          </button>
        </div>
      </div>
    </div>
  )
}
