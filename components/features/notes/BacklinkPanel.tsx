'use client'

import { useQuery } from '@tanstack/react-query'

interface Backlink {
  noteId: string
  noteTitle: string
  context: string | null
  updatedAt: string
}

async function fetchBacklinks(noteId: string): Promise<Backlink[]> {
  const res = await fetch(`/api/notes/${noteId}/backlinks`)
  if (!res.ok) return []
  return res.json()
}

interface BacklinkPanelProps {
  noteId: string
  onNavigate: (id: string) => void
}

export function BacklinkPanel({ noteId, onNavigate }: BacklinkPanelProps) {
  const { data: backlinks = [], isLoading } = useQuery({
    queryKey: ['backlinks', noteId],
    queryFn: () => fetchBacklinks(noteId),
    enabled: !!noteId,
  })

  if (isLoading) {
    return (
      <div className="border-ink-light/10 border-t px-6 py-4">
        <p className="text-ink-light text-xs">加载反向引用…</p>
      </div>
    )
  }

  if (backlinks.length === 0) return null

  return (
    <div className="border-ink-light/10 mx-auto max-w-3xl border-t px-6 py-6">
      <h4 className="text-ink-medium mb-3 text-xs font-medium tracking-wider uppercase">
        反向引用 ({backlinks.length})
      </h4>
      <ul className="space-y-2">
        {backlinks.map((bl) => (
          <li key={bl.noteId}>
            <button
              onClick={() => onNavigate(bl.noteId)}
              className="text-ink-medium hover:text-ink-heavy group w-full text-left transition"
            >
              <span className="text-sm font-medium">{bl.noteTitle || '无题'}</span>
              {bl.context && (
                <p className="text-ink-light/70 mt-0.5 text-xs leading-relaxed">{bl.context}</p>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
