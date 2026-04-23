import type { ChronicleDayGroup } from '@/lib/chronicle/types'
import { EventRow } from './EventRow'

const WEEKDAY_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/**
 * 时间轴里单日一组 · Server Component
 */
export function TimelineDay({ group }: { group: ChronicleDayGroup }) {
  const d = new Date(group.date)
  const weekday = WEEKDAY_ZH[d.getDay()]
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')

  return (
    <section className="flex flex-col gap-3">
      <header className="border-ink-light/20 flex items-baseline gap-3 border-b pb-1.5">
        <span className="text-ink-heavy font-serif-cn text-sm tabular-nums">
          {mm}-{dd}
        </span>
        <span className="text-ink-light text-[11px]">{weekday}</span>
        <span className="text-ink-light/60 ml-auto text-[10px] tabular-nums">
          {group.events.length} 件
        </span>
      </header>
      <div className="flex flex-col gap-2">
        {group.events.map((e) => (
          <EventRow key={`${e.entity.type}:${e.entity.id}:${e.action}`} event={e} />
        ))}
      </div>
    </section>
  )
}
