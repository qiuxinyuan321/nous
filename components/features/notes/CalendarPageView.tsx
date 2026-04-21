'use client'

import { useRouter } from 'next/navigation'
import { CalendarView } from './CalendarView'
import { InkStroke } from '@/components/ink/InkStroke'

export function CalendarPageView() {
  const router = useRouter()

  return (
    <div className="px-6 py-6">
      <h1 className="font-serif-cn text-ink-heavy text-3xl">日历</h1>
      <div className="mt-3 w-16 opacity-70">
        <InkStroke variant="thin" />
      </div>
      <CalendarView onSelectNote={(id) => router.push(`/notes?id=${id}`)} />
    </div>
  )
}
