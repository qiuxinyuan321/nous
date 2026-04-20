import { Link } from '@/lib/i18n/navigation'
import type { Idea } from '@/lib/types/idea'

const statusLabel: Record<string, string> = {
  raw: '未整理',
  refining: '对话中',
  planned: '已规划',
  executing: '执行中',
  done: '已完成',
  archived: '已归档',
}

export function IdeaCard({ idea }: { idea: Idea }) {
  const preview =
    idea.rawContent.length > 160 ? `${idea.rawContent.slice(0, 160)}…` : idea.rawContent
  const href =
    idea.status === 'planned' || idea.status === 'executing' || idea.status === 'done'
      ? `/plan/${idea.id}`
      : `/refine/${idea.id}`
  const hoverLabel = href.startsWith('/plan/') ? '查看方案 →' : '进入对话 →'
  return (
    <Link
      href={href}
      className="border-ink-light/30 bg-paper-aged/40 hover:border-ink-heavy/60 hover:bg-paper-aged/70 group block rounded-sm border p-5 transition"
    >
      <header className="flex items-start justify-between gap-3">
        <h3 className="font-serif-cn text-ink-heavy line-clamp-1 text-base font-medium">
          {idea.title || idea.rawContent.split('\n')[0]?.slice(0, 40) || '无题'}
        </h3>
        <span className="text-ink-light shrink-0 text-xs">
          {statusLabel[idea.status] ?? idea.status}
        </span>
      </header>
      <p className="text-ink-medium mt-3 text-sm leading-relaxed whitespace-pre-wrap">{preview}</p>
      <div className="mt-4 flex items-center justify-between">
        {idea.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {idea.tags.map((tag) => (
              <span
                key={tag}
                className="border-ink-light/40 text-ink-light rounded-sm border px-2 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <span />
        )}
        <span className="text-indigo-stone text-xs opacity-0 transition group-hover:opacity-100">
          {hoverLabel}
        </span>
      </div>
    </Link>
  )
}
