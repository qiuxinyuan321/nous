import type { Phase } from '@/lib/ai/types'
import { cn } from '@/lib/utils'

const PHASES: { key: Phase; label: string }[] = [
  { key: 'intent', label: '意图' },
  { key: 'detail', label: '细节' },
  { key: 'boundary', label: '边界' },
  { key: 'ready', label: '成形' },
]

export function PhaseIndicator({ phase }: { phase: Phase }) {
  const currentIdx = PHASES.findIndex((p) => p.key === phase)

  return (
    <div className="flex items-center gap-3">
      {PHASES.map((p, i) => {
        const isDone = i < currentIdx
        const isActive = i === currentIdx
        return (
          <div key={p.key} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  isDone && 'bg-ink-medium',
                  isActive && 'bg-cinnabar scale-125',
                  !isDone && !isActive && 'bg-ink-light/40',
                )}
              />
              <span
                className={cn(
                  'font-serif-cn text-[11px] transition',
                  isActive ? 'text-cinnabar' : isDone ? 'text-ink-medium' : 'text-ink-light',
                )}
              >
                {p.label}
              </span>
            </div>
            {i < PHASES.length - 1 && (
              <span
                className={cn(
                  'h-px w-8 transition',
                  i < currentIdx ? 'bg-ink-medium' : 'bg-ink-light/30',
                )}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
