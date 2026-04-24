'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { NotesSidebar } from './NotesSidebar'
import { NoteEditor } from './NoteEditor'
import { BacklinkPanel } from './BacklinkPanel'
import { useNote } from '@/lib/hooks/useNotes'
import { InkStroke } from '@/components/ink/InkStroke'
import { LoadingCards } from '@/components/ui/StateViews'

export function NotesView() {
  const searchParams = useSearchParams()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // URL query 中的 id 作为初始值；后续通过 onSelectNote 更新
  const urlId = searchParams.get('id')
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(urlId)
  const [lastUrlId, setLastUrlId] = useState(urlId)

  // 检测 URL 参数变化（无 effect 模式）
  if (urlId && urlId !== lastUrlId) {
    setLastUrlId(urlId)
    setSelectedNoteId(urlId)
  }

  const { data: note, isLoading } = useNote(selectedNoteId)

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <NotesSidebar
        selectedNoteId={selectedNoteId}
        onSelectNote={setSelectedNoteId}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="flex-1 overflow-y-auto">
        {selectedNoteId && isLoading ? (
          <div className="px-8 py-10">
            <LoadingCards title="正在翻开这篇笔记…" count={2} />
          </div>
        ) : selectedNoteId && note ? (
          <>
            <NoteEditor
              key={note.id}
              noteId={note.id}
              initialTitle={note.title}
              initialContent={note.content}
              initialPinned={note.pinned}
              linkedIdea={note.idea ?? null}
            />
            <BacklinkPanel noteId={note.id} onNavigate={setSelectedNoteId} />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <h2 className="font-serif-cn text-ink-heavy text-2xl">笔记本</h2>
            <div className="w-16 opacity-70">
              <InkStroke variant="thin" />
            </div>
            <p className="text-ink-light text-sm">选择或新建一篇笔记</p>
            <p className="text-ink-light/50 text-xs">
              支持 Markdown · 双向链接 [[笔记名]] · AI 整理
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
