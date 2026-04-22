import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getChronicleEvents, groupByDay } from '@/lib/chronicle/events'
import { formatAnchor, parseAnchor, rangeFor } from '@/lib/chronicle/range'
import type { ChronicleView as ChronicleViewType } from '@/lib/chronicle/types'
import { ChronicleView } from '@/components/features/chronicle/ChronicleView'

function parseView(raw: string | undefined): ChronicleViewType {
  if (raw === 'week' || raw === 'month') return raw
  return 'day'
}

export default async function ChroniclePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ view?: string; date?: string }>
}) {
  const { locale } = await params
  const { view: viewParam, date: dateParam } = await searchParams
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/chronicle`)
  }

  const view = parseView(viewParam)
  const anchor = parseAnchor(dateParam)
  const range = rangeFor(view, anchor)

  const events = await getChronicleEvents({
    userId: session.user.id,
    from: range.from,
    to: range.to,
  })
  const groups = groupByDay(events)

  return (
    <ChronicleView
      view={view}
      anchor={formatAnchor(anchor)}
      groups={groups}
      totalCount={events.length}
      rangeLabel={describeRange(view, range.from, range.to)}
    />
  )
}

function describeRange(view: ChronicleViewType, from: Date, to: Date): string {
  const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`
  if (view === 'day') {
    return `${from.getFullYear()} 年 ${fmt(from)}`
  }
  if (view === 'week') {
    return `${fmt(from)} – ${fmt(to)}`
  }
  // month
  return `${from.getFullYear()} 年 ${from.getMonth() + 1} 月`
}
