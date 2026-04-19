import { FocusToggle } from '@/components/features/focus/FocusToggle'
import { PriorityBadge } from './PriorityBadge'

interface TaskCardProps {
  id: string
  title: string
  description: string | null
  priority: string
  estimatedMin: number | null
  focused?: boolean
  status?: string
}

export function TaskCard({
  id,
  title,
  description,
  priority,
  estimatedMin,
  focused = false,
  status = 'todo',
}: TaskCardProps) {
  const isDone = status === 'done'
  return (
    <div
      className={`border-ink-light/30 bg-paper-rice/60 hover:border-ink-heavy/50 rounded-sm border p-4 transition ${isDone ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h4
          className={`font-serif-cn text-ink-heavy text-sm leading-snug font-medium ${isDone ? 'line-through' : ''}`}
        >
          {title}
        </h4>
        <PriorityBadge priority={priority} />
      </div>
      {description && <p className="text-ink-medium mt-2 text-xs leading-relaxed">{description}</p>}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px]">
          {estimatedMin != null && (
            <span className="text-ink-light">
              预计 <span className="text-ink-medium font-mono">{estimatedMin}</span> 分钟
            </span>
          )}
        </div>
        {!isDone && <FocusToggle taskId={id} focused={focused} />}
      </div>
    </div>
  )
}
