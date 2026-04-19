import { PriorityBadge } from './PriorityBadge'

interface TaskCardProps {
  title: string
  description: string | null
  priority: string
  estimatedMin: number | null
}

export function TaskCard({ title, description, priority, estimatedMin }: TaskCardProps) {
  return (
    <div className="border-ink-light/30 bg-paper-rice/60 hover:border-ink-heavy/50 rounded-sm border p-4 transition">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-serif-cn text-ink-heavy text-sm leading-snug font-medium">{title}</h4>
        <PriorityBadge priority={priority} />
      </div>
      {description && <p className="text-ink-medium mt-2 text-xs leading-relaxed">{description}</p>}
      {estimatedMin != null && (
        <p className="text-ink-light mt-3 text-[11px]">
          预计 <span className="text-ink-medium font-mono">{estimatedMin}</span> 分钟
        </p>
      )}
    </div>
  )
}
