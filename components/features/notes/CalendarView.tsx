'use client'

import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useNotes } from '@/lib/hooks/useNotes'
import { cn } from '@/lib/utils'

interface CalendarViewProps {
  onSelectNote: (id: string) => void
}

export function CalendarView({ onSelectNote }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const { data } = useNotes()
  const notes = data?.notes

  const notesByDate = useMemo(() => {
    const items = notes ?? []
    const map = new Map<string, typeof items>()
    for (const note of items) {
      const key = dayjs(note.updatedAt).format('YYYY-MM-DD')
      const list = map.get(key) ?? []
      list.push(note)
      map.set(key, list)
    }
    return map
  }, [notes])

  const startOfMonth = currentMonth.startOf('month')
  const daysInMonth = currentMonth.daysInMonth()
  const startDay = startOfMonth.day()

  const prevMonth = () => setCurrentMonth((m) => m.subtract(1, 'month'))
  const nextMonth = () => setCurrentMonth((m) => m.add(1, 'month'))
  const goToday = () => setCurrentMonth(dayjs())

  const today = dayjs().format('YYYY-MM-DD')

  const cells: Array<{ day: number | null; dateStr: string }> = []
  for (let i = 0; i < startDay; i++) cells.push({ day: null, dateStr: '' })
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: startOfMonth.date(d).format('YYYY-MM-DD') })
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif-cn text-ink-heavy text-2xl">
          {currentMonth.format('YYYY \u5E74 M \u6708')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="text-ink-light hover:text-ink-heavy hover:bg-ink-heavy/5 rounded px-2 py-1 text-sm transition"
          >
            ←
          </button>
          <button
            onClick={goToday}
            className="text-ink-medium hover:text-ink-heavy border-ink-light/30 hover:border-ink-heavy/30 rounded border px-3 py-0.5 text-xs transition"
          >
            今天
          </button>
          <button
            onClick={nextMonth}
            className="text-ink-light hover:text-ink-heavy hover:bg-ink-heavy/5 rounded px-2 py-1 text-sm transition"
          >
            →
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {['\u65E5', '\u4E00', '\u4E8C', '\u4E09', '\u56DB', '\u4E94', '\u516D'].map((d) => (
          <div key={d} className="text-ink-light py-1 text-center text-xs">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (cell.day === null) return <div key={`e-${i}`} />
          const dayNotes = notesByDate.get(cell.dateStr) ?? []
          const isToday = cell.dateStr === today
          return (
            <div
              key={cell.dateStr}
              className={cn(
                'border-ink-light/10 min-h-[90px] rounded-md border p-2',
                isToday && 'border-indigo-stone/40 bg-indigo-stone/5',
              )}
            >
              <span
                className={cn(
                  'text-xs',
                  isToday ? 'text-indigo-stone font-medium' : 'text-ink-light',
                )}
              >
                {cell.day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayNotes.slice(0, 3).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onSelectNote(n.id)}
                    className="text-ink-medium hover:text-ink-heavy block w-full truncate text-left text-[10px] leading-tight transition"
                  >
                    {n.title || '\u65E0\u9898'}
                  </button>
                ))}
                {dayNotes.length > 3 && (
                  <span className="text-ink-light/50 text-[10px]">+{dayNotes.length - 3}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
