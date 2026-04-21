'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { Link } from '@/lib/i18n/navigation'
import type { Idea } from '@/lib/types/idea'
import { useDeleteIdea } from '@/lib/hooks/useIdeas'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const statusLabel: Record<string, string> = {
  raw: '未整理',
  refining: '对话中',
  planned: '已规划',
  executing: '执行中',
  done: '已完成',
  archived: '已归档',
}

export function IdeaCard({ idea }: { idea: Idea }) {
  const [confirming, setConfirming] = useState(false)
  const deleteIdea = useDeleteIdea()

  const preview =
    idea.rawContent.length > 160 ? `${idea.rawContent.slice(0, 160)}…` : idea.rawContent
  const href =
    idea.status === 'planned' || idea.status === 'executing' || idea.status === 'done'
      ? `/plan/${idea.id}`
      : `/refine/${idea.id}`
  const hoverLabel = href.startsWith('/plan/') ? '查看方案 →' : '进入对话 →'

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirming) {
      setConfirming(true)
      return
    }
    deleteIdea.mutate(idea.id)
  }

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setConfirming(false)
  }

  return (
    <div className="border-ink-light/30 bg-paper-aged/40 hover:border-ink-heavy/60 hover:bg-paper-aged/70 group relative rounded-sm border p-5 transition">
      <Link href={href} className="block">
        <header className="flex items-start justify-between gap-3">
          <h3 className="font-serif-cn text-ink-heavy line-clamp-1 text-base font-medium">
            {idea.title || idea.rawContent.split('\n')[0]?.slice(0, 40) || '无题'}
          </h3>
          <span className="text-ink-light shrink-0 text-xs">
            {statusLabel[idea.status] ?? idea.status}
          </span>
        </header>
        <p className="text-ink-medium mt-3 text-sm leading-relaxed whitespace-pre-wrap">
          {preview}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {idea.tags.length > 0 &&
              idea.tags.map((tag) => (
                <span
                  key={tag}
                  className="border-ink-light/40 text-ink-light rounded-sm border px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
            <span className="text-ink-light/60 text-[11px]">{dayjs(idea.createdAt).fromNow()}</span>
          </div>
          <span className="text-indigo-stone text-xs opacity-0 transition group-hover:opacity-100">
            {hoverLabel}
          </span>
        </div>
      </Link>

      {/* 删除按钮 */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        {confirming ? (
          <>
            <button
              onClick={handleDelete}
              disabled={deleteIdea.isPending}
              className="text-cinnabar hover:bg-cinnabar/10 rounded px-2 py-1 text-xs transition"
            >
              {deleteIdea.isPending ? '删除中…' : '确认删除'}
            </button>
            <button
              onClick={handleCancelDelete}
              className="text-ink-light hover:text-ink-medium rounded px-2 py-1 text-xs transition"
            >
              取消
            </button>
          </>
        ) : (
          <button
            onClick={handleDelete}
            className="text-ink-light hover:text-cinnabar rounded px-1.5 py-1 text-xs transition"
            title="删除"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
