'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils'
import { useNotes, useCreateNote, useDeleteNote } from '@/lib/hooks/useNotes'
import { useFolders, useCreateFolder } from '@/lib/hooks/useFolders'
import { DigestPanel } from './DigestPanel'
import type { NoteFolderDTO } from '@/lib/types/note'

function relativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m}分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}天前`
  return new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

interface NotesSidebarProps {
  selectedNoteId: string | null
  onSelectNote: (id: string) => void
  selectedFolderId: string | null
  onSelectFolder: (id: string | null) => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

export function NotesSidebar({
  selectedNoteId,
  onSelectNote,
  selectedFolderId,
  onSelectFolder,
  searchQuery,
  onSearchChange,
}: NotesSidebarProps) {
  const params: Record<string, string> = {}
  if (selectedFolderId) params.folder = selectedFolderId
  if (searchQuery) params.q = searchQuery
  const { data, isLoading } = useNotes(params)
  const { data: folders } = useFolders()
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()
  const createFolder = useCreateFolder()
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [selectMode, setSelectMode] = useState(false)

  // confirmDelete 3秒超时自动取消
  useEffect(() => {
    if (!confirmDelete) return
    const t = setTimeout(() => setConfirmDelete(null), 3000)
    return () => clearTimeout(t)
  }, [confirmDelete])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showDigest, setShowDigest] = useState(false)

  const notes = data?.notes ?? []

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleNewNote = useCallback(async () => {
    const note = await createNote.mutateAsync({
      title: '',
      content: '',
      folderId: selectedFolderId ?? undefined,
    })
    onSelectNote(note.id)
  }, [createNote, selectedFolderId, onSelectNote])

  // Ctrl+N 快捷新建
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleNewNote()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleNewNote])

  const handleNewFolder = async () => {
    if (!newFolderName.trim()) return
    await createFolder.mutateAsync({ name: newFolderName.trim() })
    setNewFolderName('')
    setShowNewFolder(false)
  }

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteNote.mutate(id)
      setConfirmDelete(null)
      if (selectedNoteId === id) onSelectNote('')
    } else {
      setConfirmDelete(id)
    }
  }

  // 构建文件夹树
  const rootFolders = (folders ?? []).filter((f) => !f.parentId)

  return (
    <aside className="border-ink-light/20 bg-paper-rice flex h-full w-72 shrink-0 flex-col border-r">
      {/* 搜索 + 新建 */}
      <div className="flex items-center gap-2 p-3">
        <div className="border-ink-light/20 focus-within:border-ink-light/40 flex flex-1 items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition">
          <svg
            className="text-ink-light/50 h-3.5 w-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索笔记…"
            className="text-ink-heavy placeholder:text-ink-light/50 w-full bg-transparent text-sm outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="text-ink-light/40 hover:text-ink-medium text-xs"
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={handleNewNote}
          disabled={createNote.isPending}
          className="text-ink-light hover:text-ink-heavy hover:bg-ink-heavy/5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition"
          title="新建笔记 (Ctrl+N)"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>

      {/* 文件夹 */}
      <div className="border-ink-light/10 border-b px-3 pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onSelectFolder(null)}
            className={cn(
              'text-xs transition',
              !selectedFolderId
                ? 'text-ink-heavy font-medium'
                : 'text-ink-light hover:text-ink-medium',
            )}
          >
            全部笔记
            {notes.length > 0 && (
              <span className="text-ink-light/50 ml-1 font-normal">({notes.length})</span>
            )}
          </button>
          <button
            onClick={() => setShowNewFolder(!showNewFolder)}
            className="text-ink-light hover:text-ink-heavy text-[10px] transition"
          >
            + 文件夹
          </button>
        </div>
        {showNewFolder && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleNewFolder()
            }}
            className="mt-1 flex gap-1"
          >
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="文件夹名"
              autoFocus
              className="text-ink-heavy flex-1 rounded bg-transparent px-1.5 py-1 text-xs outline-none"
            />
            <button type="submit" className="text-ink-light hover:text-ink-heavy text-xs">
              ✓
            </button>
          </form>
        )}
        <div className="mt-1 space-y-0.5">
          {rootFolders.map((f) => (
            <FolderItem
              key={f.id}
              folder={f}
              allFolders={folders ?? []}
              selected={selectedFolderId === f.id}
              onSelect={onSelectFolder}
            />
          ))}
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="border-ink-light/10 flex items-center gap-3 border-b px-3 py-2">
        <Link
          href="/notes/graph"
          className="text-ink-light hover:text-ink-heavy text-[11px] transition"
        >
          🕸 图谱
        </Link>
        <Link
          href="/notes/calendar"
          className="text-ink-light hover:text-ink-heavy text-[11px] transition"
        >
          📅 日历
        </Link>
        <button
          onClick={() => {
            setSelectMode(!selectMode)
            setSelected(new Set())
          }}
          className={cn(
            'text-[11px] transition',
            selectMode ? 'text-indigo-stone font-medium' : 'text-ink-light hover:text-ink-heavy',
          )}
        >
          {selectMode ? '取消多选' : '✓ 多选'}
        </button>
        {selectMode && selected.size > 0 && (
          <button
            onClick={() => setShowDigest(true)}
            className="bg-ink-heavy text-paper-rice ml-auto rounded px-2 py-0.5 text-[11px]"
          >
            AI 整理 ({selected.size})
          </button>
        )}
      </div>

      {/* 笔记列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-ink-light p-4 text-center text-xs">加载中…</p>
        ) : notes.length === 0 ? (
          <p className="text-ink-light p-4 text-center text-xs">暂无笔记</p>
        ) : (
          <ul className="py-1">
            {notes.map((note) => (
              <li
                key={note.id}
                onClick={() => (selectMode ? toggleSelect(note.id) : onSelectNote(note.id))}
                className={cn(
                  'group mx-1 flex cursor-pointer items-center justify-between rounded px-3 py-2 transition',
                  selectedNoteId === note.id && !selectMode
                    ? 'bg-ink-heavy/5 text-ink-heavy'
                    : selected.has(note.id)
                      ? 'bg-indigo-stone/10 text-ink-heavy'
                      : 'text-ink-medium hover:bg-ink-heavy/[0.03]',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {selectMode && (
                      <span
                        className={cn(
                          'mr-1.5 inline-block h-3 w-3 rounded-sm border text-center text-[9px] leading-3',
                          selected.has(note.id)
                            ? 'border-indigo-stone bg-indigo-stone text-white'
                            : 'border-ink-light/40',
                        )}
                      >
                        {selected.has(note.id) ? '✓' : ''}
                      </span>
                    )}
                    {note.pinned && <span className="text-cinnabar mr-1">·</span>}
                    {note.title || '无题'}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="text-ink-light/60 min-w-0 flex-1 truncate text-[11px]">
                      {note.content.replace(/<[^>]*>/g, '').slice(0, 50) || '空白笔记'}
                    </p>
                    <span className="text-ink-light/40 shrink-0 text-[10px]">
                      {relativeTime(note.updatedAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(note.id)
                  }}
                  className={cn(
                    'ml-2 shrink-0 text-xs transition',
                    confirmDelete === note.id
                      ? 'text-cinnabar'
                      : 'text-ink-light/40 hover:text-cinnabar opacity-0 group-hover:opacity-100',
                  )}
                >
                  {confirmDelete === note.id ? '确认' : '×'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {showDigest && (
        <DigestPanel
          notes={notes.filter((n) => selected.has(n.id))}
          onClose={() => {
            setShowDigest(false)
            setSelectMode(false)
            setSelected(new Set())
          }}
          onNavigate={(id) => {
            setShowDigest(false)
            setSelectMode(false)
            setSelected(new Set())
            onSelectNote(id)
          }}
        />
      )}
    </aside>
  )
}

function FolderItem({
  folder,
  allFolders,
  selected,
  onSelect,
}: {
  folder: NoteFolderDTO
  allFolders: NoteFolderDTO[]
  selected: boolean
  onSelect: (id: string | null) => void
}) {
  const children = allFolders.filter((f) => f.parentId === folder.id)

  return (
    <div>
      <button
        onClick={() => onSelect(folder.id)}
        className={cn(
          'flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs transition',
          selected ? 'bg-ink-heavy/5 text-ink-heavy' : 'text-ink-medium hover:text-ink-heavy',
        )}
      >
        <span>{folder.icon ?? '📁'}</span>
        <span className="truncate">{folder.name}</span>
        {folder.noteCount !== undefined && folder.noteCount > 0 && (
          <span className="text-ink-light/50 ml-auto text-[10px]">{folder.noteCount}</span>
        )}
      </button>
      {children.length > 0 && (
        <div className="ml-3">
          {children.map((c) => (
            <FolderItem
              key={c.id}
              folder={c}
              allFolders={allFolders}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
