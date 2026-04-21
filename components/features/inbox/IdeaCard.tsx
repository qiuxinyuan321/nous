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

const statusConfig: Record<string, { label: string; color: string; action: string }> = {
  raw: { label: '未整理', color: 'bg-ink-light/20 text-ink-medium', action: '开始对话 →' },
  refining: { label: '对话中', color: 'bg-gold-leaf/15 text-gold-leaf', action: '继续对话 →' },
  planned: { label: '已规划', color: 'bg-indigo-stone/15 text-indigo-stone', action: '查看方案 →' },
  executing: { label: '执行中', color: 'bg-celadon/15 text-celadon', action: '查看进度 →' },
  done: { label: '已完成', color: 'bg-celadon/20 text-celadon', action: '已完成 ✓' },
  archived: { label: '已归档', color: 'bg-ink-light/10 text-ink-light', action: '已归档' },
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
  const cfg = statusConfig[idea.status] ?? statusConfig.raw!

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
    <div className="border-ink-light/20 bg-paper-aged/30 hover:border-ink-light/50 hover:bg-paper-aged/50 group relative rounded-md border p-6 shadow-sm transition hover:shadow-md">
      <Link href={href} className="block">
        <header className="flex items-start justify-between gap-3">
          <h3 className="font-serif-cn text-ink-heavy line-clamp-1 text-lg font-semibold">
            {idea.title || idea.rawContent.split('\n')[0]?.slice(0, 40) || '无题'}
          </h3>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cfg.color}`}>
            {cfg.label}
          </span>
        </header>
        <p className="text-ink-medium mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">
          {preview}
        </p>
        <div className="mt-5 flex items-center justify-between">
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
          <span className="bg-ink-heavy/5 text-ink-heavy hover:bg-ink-heavy hover:text-paper-rice inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition">
            {cfg.action}
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
