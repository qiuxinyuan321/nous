import { describe, expect, it } from 'vitest'
import {
  enumerateDays,
  formatAnchor,
  nextAnchor,
  parseAnchor,
  prevAnchor,
  rangeFor,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from '@/lib/chronicle/range'

describe('parseAnchor', () => {
  it('parses YYYY-MM-DD', () => {
    const d = parseAnchor('2026-04-22')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(3) // 0-indexed
    expect(d.getDate()).toBe(22)
    expect(d.getHours()).toBe(0)
  })

  it('falls back to today on invalid input', () => {
    const d = parseAnchor('garbage')
    const today = startOfDay(new Date())
    expect(d.getTime()).toBe(today.getTime())
  })

  it('returns today for null/undefined', () => {
    expect(parseAnchor(null).getTime()).toBe(startOfDay(new Date()).getTime())
    expect(parseAnchor(undefined).getTime()).toBe(startOfDay(new Date()).getTime())
  })
})

describe('formatAnchor', () => {
  it('pads single-digit month and day', () => {
    expect(formatAnchor(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('rangeFor · day', () => {
  it('covers 00:00 to 23:59.999 on anchor day', () => {
    const anchor = new Date(2026, 3, 22, 10)
    const { from, to } = rangeFor('day', anchor)
    expect(from.getDate()).toBe(22)
    expect(from.getHours()).toBe(0)
    expect(to.getDate()).toBe(22)
    expect(to.getHours()).toBe(23)
  })
})

describe('rangeFor · week', () => {
  it('starts on Monday', () => {
    const wed = new Date(2026, 3, 22)
    const { from } = rangeFor('week', wed)
    expect(from.getDay()).toBe(1) // Monday
  })

  it('for Sunday returns the Monday of the same week (6 days back)', () => {
    // 2026-04-26 is Sunday
    const sun = new Date(2026, 3, 26)
    const start = startOfWeek(sun)
    expect(start.getDay()).toBe(1)
    expect(start.getDate()).toBe(20) // Monday 20th
  })
})

describe('rangeFor · month', () => {
  it('covers first to last day of anchor month', () => {
    const mid = new Date(2026, 3, 15)
    const { from, to } = rangeFor('month', mid)
    expect(from.getDate()).toBe(1)
    expect(to.getDate()).toBe(30) // April has 30 days
    expect(from.getMonth()).toBe(3)
    expect(to.getMonth()).toBe(3)
  })

  it('handles month boundary edge cases (leap years)', () => {
    const feb = new Date(2024, 1, 15) // 2024 is leap
    const { to } = rangeFor('month', feb)
    expect(to.getDate()).toBe(29)
  })
})

describe('prev / next anchor', () => {
  it('day ± 1', () => {
    const d = new Date(2026, 3, 22)
    expect(prevAnchor('day', d).getDate()).toBe(21)
    expect(nextAnchor('day', d).getDate()).toBe(23)
  })

  it('week ± 7', () => {
    const d = new Date(2026, 3, 22)
    expect(prevAnchor('week', d).getDate()).toBe(15)
    expect(nextAnchor('week', d).getDate()).toBe(29)
  })

  it('month ± 1', () => {
    const d = new Date(2026, 3, 22)
    expect(prevAnchor('month', d).getMonth()).toBe(2)
    expect(nextAnchor('month', d).getMonth()).toBe(4)
  })
})

describe('startOfMonth', () => {
  it('returns first of month at 00:00', () => {
    const r = startOfMonth(new Date(2026, 3, 22, 14))
    expect(r.getDate()).toBe(1)
    expect(r.getHours()).toBe(0)
  })
})

describe('enumerateDays', () => {
  it('returns every day in a week range', () => {
    const from = new Date(2026, 3, 20) // Mon
    const to = new Date(2026, 3, 26, 23, 59) // Sun
    const days = enumerateDays({ from, to })
    expect(days.length).toBe(7)
    expect(days[0]).toBe('2026-04-20')
    expect(days[6]).toBe('2026-04-26')
  })

  it('returns single day for a 1-day range', () => {
    const d = new Date(2026, 3, 22)
    expect(enumerateDays({ from: d, to: d })).toEqual(['2026-04-22'])
  })
})
