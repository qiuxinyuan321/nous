import type { ChronicleDayGroup, ChronicleView as ChronicleViewType } from '@/lib/chronicle/types'
import { DateNav } from './DateNav'
import { TimelineDay } from './TimelineDay'

interface Props {
  view: ChronicleViewType
  anchor: string
  groups: ChronicleDayGroup[]
  totalCount: number
  rangeLabel: string
}

/**
 * Chronicle 主视图 · Server Component
 * -----------------------------------------------------------
 * DateNav (client) + 时间轴 (server) + 空态。
 * 视觉：Ink 配色 · 每日一组卡片 · 时间戳 hh:mm 对齐左侧。
 */
export function ChronicleView({ view, anchor, groups, totalCount, rangeLabel }: Props) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <DateNav view={view} anchor={anchor} rangeLabel={rangeLabel} />

      {totalCount === 0 ? (
        <EmptyChronicle />
      ) : (
        <>
          <p className="text-ink-light mb-6 text-[11px] tabular-nums">{totalCount} 件足迹</p>
          <div className="flex flex-col gap-8">
            {groups.map((g) => (
              <TimelineDay key={g.date} group={g} />
            ))}
          </div>
        </>
      )}
    </main>
  )
}

function EmptyChronicle() {
  return (
    <div className="text-ink-light flex flex-col items-center gap-2 py-20 text-center">
      <p className="font-serif-cn text-base">这段时间还没有足迹</p>
      <p className="text-[11px]">
        换个维度，或去
        <span className="text-ink-medium mx-1">今日</span>
        看看
      </p>
    </div>
  )
}
