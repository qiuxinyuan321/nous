import { Link } from '@/lib/i18n/navigation'
import { pathForEntity, TYPE_ICONS, TYPE_LABELS_ZH } from '@/lib/relations/routes'
import type { ChronicleEvent } from '@/lib/chronicle/types'

const ACTION_LABEL_ZH: Record<ChronicleEvent['action'], string> = {
  created: '落笔',
  updated: '修订',
  completed: '完成',
}

const ACTION_ACCENT: Record<ChronicleEvent['action'], string> = {
  created: 'text-ink-medium',
  updated: 'text-ink-light',
  completed: 'text-celadon',
}

/**
 * 时间轴里单个事件行 · Server Component
 */
export function EventRow({ event }: { event: ChronicleEvent }) {
  const { entity, action, timestamp } = event
  const href = pathForEntity(entity)
  const icon = TYPE_ICONS[entity.type]
  const typeLabel = TYPE_LABELS_ZH[entity.type]
  const actionLabel = ACTION_LABEL_ZH[action]
  const hh = String(timestamp.getHours()).padStart(2, '0')
  const mm = String(timestamp.getMinutes()).padStart(2, '0')

  return (
    <Link
      href={href}
      className="group border-ink-light/10 hover:border-ink-light/30 hover:bg-paper-aged/30 flex items-start gap-4 rounded-sm border px-4 py-3 transition-colors"
    >
      <span className="text-ink-light shrink-0 font-mono text-xs leading-relaxed tabular-nums">
        {hh}:{mm}
      </span>
      <span aria-hidden className="mt-0.5 shrink-0 text-base leading-none opacity-70">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-light text-[10px] tracking-[0.15em] uppercase">
            {typeLabel}
          </span>
          <span className="text-ink-light/40 text-[10px]">·</span>
          <span className={`text-[10px] tracking-[0.15em] uppercase ${ACTION_ACCENT[action]}`}>
            {actionLabel}
          </span>
        </div>
        <p className="text-ink-heavy mt-0.5 line-clamp-1 text-[14px] leading-snug">
          {entity.title}
        </p>
        {entity.snippet && (
          <p className="text-ink-light mt-0.5 line-clamp-1 text-[11px] leading-relaxed">
            {entity.snippet}
          </p>
        )}
      </div>
    </Link>
  )
}
