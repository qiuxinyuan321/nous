import { cn } from '@/lib/utils'

const LABEL: Record<string, { zh: string; dot: string }> = {
  must: { zh: '必做', dot: 'bg-cinnabar' },
  should: { zh: '应做', dot: 'bg-gold-leaf' },
  could: { zh: '可做', dot: 'bg-indigo-stone' },
  wont: { zh: '不做', dot: 'bg-ink-light' },
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const meta = LABEL[priority] ?? LABEL.should!
  return (
    <span
      className={cn(
        'border-ink-light/30 text-ink-medium inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[10px] tracking-wide uppercase',
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden="true" />
      {meta.zh}
    </span>
  )
}
