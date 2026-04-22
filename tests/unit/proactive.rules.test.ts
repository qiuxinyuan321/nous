import { describe, expect, it } from 'vitest'
import { findSeasonalReview } from '@/lib/proactive/rules'

describe('findSeasonalReview', () => {
  it('returns weekly prompt on Sunday', async () => {
    const sunday = new Date(2026, 3, 26) // 2026-04-26 is Sunday
    const r = await findSeasonalReview({ userId: 'u1', now: sunday })
    expect(r.some((p) => p.key.startsWith('seasonal:weekly:'))).toBe(true)
  })

  it('skips weekly prompt on non-Sunday', async () => {
    const wednesday = new Date(2026, 3, 22)
    const r = await findSeasonalReview({ userId: 'u1', now: wednesday })
    expect(r.some((p) => p.key.startsWith('seasonal:weekly:'))).toBe(false)
  })

  it('returns monthly prompt on day 1', async () => {
    const may1 = new Date(2026, 4, 1)
    const r = await findSeasonalReview({ userId: 'u1', now: may1 })
    expect(r.some((p) => p.key.startsWith('seasonal:monthly:'))).toBe(true)
  })

  it('returns both when Sunday falls on day 1', async () => {
    // 2026-02-01 is a Sunday
    const feb1sun = new Date(2026, 1, 1)
    const r = await findSeasonalReview({ userId: 'u1', now: feb1sun })
    expect(r.length).toBe(2)
    expect(r.some((p) => p.key.startsWith('seasonal:weekly:'))).toBe(true)
    expect(r.some((p) => p.key.startsWith('seasonal:monthly:'))).toBe(true)
  })

  it('emits INTP-friendly question (short, no imperative)', async () => {
    const sunday = new Date(2026, 3, 26)
    const [p] = await findSeasonalReview({ userId: 'u1', now: sunday })
    expect(p.question.length).toBeLessThan(60)
    // 问句应该包含 "?" 或 "？"（不评判、不命令）
    expect(p.question).toMatch(/[?？]/)
  })

  it('keys are stable across same-day calls', async () => {
    const sunday = new Date(2026, 3, 26)
    const r1 = await findSeasonalReview({ userId: 'u1', now: sunday })
    const r2 = await findSeasonalReview({ userId: 'u1', now: sunday })
    expect(r1[0].key).toBe(r2[0].key)
  })
})
