import { TaskCard } from './TaskCard'

interface MilestoneSectionProps {
  index: number
  title: string
  deadline: Date | null
  tasks: {
    id: string
    title: string
    description: string | null
    priority: string
    estimatedMin: number | null
  }[]
}

function formatDate(d: Date | null): string | null {
  if (!d) return null
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function MilestoneSection({ index, title, deadline, tasks }: MilestoneSectionProps) {
  const formattedDeadline = formatDate(deadline)
  return (
    <section className="border-ink-light/30 border-l pl-6">
      <header className="relative mb-4 -ml-[7px] flex items-center gap-3">
        <span
          className="bg-ink-heavy text-paper-rice font-serif-en flex h-3.5 w-3.5 items-center justify-center rounded-full text-[10px]"
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <h3 className="font-serif-cn text-ink-heavy text-lg font-medium">{title}</h3>
        {formattedDeadline && (
          <span className="text-ink-light font-mono text-xs">· {formattedDeadline}</span>
        )}
      </header>
      <div className="grid gap-3 pl-0 md:grid-cols-2">
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            title={t.title}
            description={t.description}
            priority={t.priority}
            estimatedMin={t.estimatedMin}
          />
        ))}
      </div>
    </section>
  )
}
