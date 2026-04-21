'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import LinkExtension from '@tiptap/extension-link'
import { cn } from '@/lib/utils'
import { useUpdateNote } from '@/lib/hooks/useNotes'

interface NoteEditorProps {
  noteId: string
  initialTitle: string
  initialContent: string
  initialPinned?: boolean
  onTitleChange?: (title: string) => void
}

export function NoteEditor({
  noteId,
  initialTitle,
  initialContent,
  initialPinned,
  onTitleChange,
}: NoteEditorProps) {
  const updateNote = useUpdateNote()
  const mutateRef = useRef(updateNote.mutate)
  useEffect(() => {
    mutateRef.current = updateNote.mutate
  })

  const titleRef = useRef<HTMLInputElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pinned, setPinned] = useState(initialPinned ?? false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: '开始书写… 支持 Markdown 快捷键',
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-indigo-stone underline underline-offset-2' },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none outline-none min-h-[60vh] font-serif-cn text-ink-heavy leading-relaxed',
      },
    },
    onUpdate: ({ editor: e }) => {
      debouncedSave(noteId, undefined, e.getHTML())
    },
  })

  const debouncedSave = useCallback((id: string, title?: string, content?: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveStatus('saving')
    saveTimer.current = setTimeout(() => {
      const data: Record<string, unknown> = { id }
      if (title !== undefined) data.title = title
      if (content !== undefined) data.content = content
      mutateRef.current(data as { id: string }, {
        onSuccess: () => {
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 1500)
        },
      })
    }, 600)
  }, [])

  const handleTogglePin = () => {
    const next = !pinned
    setPinned(next)
    mutateRef.current({ id: noteId, pinned: next } as { id: string })
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    onTitleChange?.(title)
    debouncedSave(noteId, title, undefined)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      editor?.commands.focus('start')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pt-6 pb-8">
      <div className="border-ink-light/20 bg-paper-rice/60 rounded-lg border shadow-sm">
        {/* 工具栏 */}
        <div className="border-ink-light/10 flex items-center gap-1 border-b px-5 py-2.5">
          <ToolBtn
            active={editor?.isActive('bold')}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            title="粗体 (Ctrl+B)"
          >
            B
          </ToolBtn>
          <ToolBtn
            active={editor?.isActive('italic')}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            title="斜体 (Ctrl+I)"
            className="italic"
          >
            I
          </ToolBtn>
          <ToolBtn
            active={editor?.isActive('strike')}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            title="删除线"
            className="line-through"
          >
            S
          </ToolBtn>
          <span className="bg-ink-light/20 mx-1 h-4 w-px" />
          <ToolBtn
            active={editor?.isActive('heading', { level: 1 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            title="标题 1"
          >
            H1
          </ToolBtn>
          <ToolBtn
            active={editor?.isActive('heading', { level: 2 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            title="标题 2"
          >
            H2
          </ToolBtn>
          <ToolBtn
            active={editor?.isActive('heading', { level: 3 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            title="标题 3"
          >
            H3
          </ToolBtn>
          <span className="bg-ink-light/20 mx-1 h-4 w-px" />
          <ToolBtn
            active={editor?.isActive('bulletList')}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            title="无序列表"
          >
            •
          </ToolBtn>
          <ToolBtn
            active={editor?.isActive('orderedList')}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            title="有序列表"
          >
            1.
          </ToolBtn>
          <ToolBtn
            active={editor?.isActive('blockquote')}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            title="引用"
          >
            &ldquo;
          </ToolBtn>
          <ToolBtn
            active={editor?.isActive('codeBlock')}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            title="代码块"
          >
            &lt;/&gt;
          </ToolBtn>

          {/* 右侧：pin + 保存状态 */}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={handleTogglePin}
              title={pinned ? '取消置顶' : '置顶'}
              className={cn(
                'text-sm transition',
                pinned ? 'text-cinnabar' : 'text-ink-light/40 hover:text-ink-medium',
              )}
            >
              {pinned ? '📌' : '📌'}
            </button>
            <span
              className={cn(
                'text-[11px] transition-opacity duration-300',
                saveStatus === 'idle'
                  ? 'text-ink-light/30'
                  : saveStatus === 'saving'
                    ? 'text-ink-light animate-pulse'
                    : 'text-celadon',
              )}
            >
              {saveStatus === 'idle' ? '' : saveStatus === 'saving' ? '保存中…' : '已保存'}
            </span>
          </div>
        </div>

        <div className="px-6 pt-5 pb-6">
          <input
            ref={titleRef}
            defaultValue={initialTitle}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            placeholder="无题"
            className="font-serif-cn text-ink-heavy mb-4 w-full bg-transparent text-3xl font-medium outline-none placeholder:text-[color:var(--ink-light)]"
          />
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}

function ToolBtn({
  active,
  onClick,
  title,
  className,
  children,
}: {
  active?: boolean
  onClick?: () => void
  title?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-xs transition',
        active
          ? 'bg-ink-heavy/10 text-ink-heavy'
          : 'text-ink-light hover:bg-ink-heavy/5 hover:text-ink-medium',
        className,
      )}
    >
      {children}
    </button>
  )
}
