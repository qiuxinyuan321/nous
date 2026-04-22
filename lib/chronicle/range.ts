/**
 * Chronicle · 时间窗口计算
 * -----------------------------------------------------------
 * day / week / month 三种视图，给定锚点日期算出 [from, to] 区间。
 * 所有逻辑用本地时区（Date 的 getFullYear 等 API）· SSR 在 Node 上
 * 运行，实际项目里应该设置 TZ=Asia/Shanghai。
 */

import type { ChronicleView } from './types'

export interface DateRange {
  from: Date
  to: Date
}

/** YYYY-MM-DD 解析到本地 Date 00:00 · 容错非法串 fallback 今日 */
export function parseAnchor(raw: string | undefined | null): Date {
  if (!raw) return startOfDay(new Date())
  const m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return startOfDay(new Date())
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const candidate = new Date(y, mo, d)
  if (Number.isNaN(candidate.getTime())) return startOfDay(new Date())
  return startOfDay(candidate)
}

/** 格式化为 YYYY-MM-DD */
export function formatAnchor(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${dd}`
}

export function startOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

export function endOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(23, 59, 59, 999)
  return r
}

/** 周一开始的一周（ISO 周）· 中文用户通常周一起 */
export function startOfWeek(d: Date): Date {
  const r = startOfDay(d)
  const day = r.getDay() // 0=Sun 1=Mon ...
  const diff = day === 0 ? -6 : 1 - day
  r.setDate(r.getDate() + diff)
  return r
}

export function endOfWeek(d: Date): Date {
  const r = startOfWeek(d)
  r.setDate(r.getDate() + 6)
  return endOfDay(r)
}

export function startOfMonth(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1))
}

export function endOfMonth(d: Date): Date {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

/** 给定 view + 锚点 · 返回区间 [from, to] */
export function rangeFor(view: ChronicleView, anchor: Date): DateRange {
  switch (view) {
    case 'day':
      return { from: startOfDay(anchor), to: endOfDay(anchor) }
    case 'week':
      return { from: startOfWeek(anchor), to: endOfWeek(anchor) }
    case 'month':
      return { from: startOfMonth(anchor), to: endOfMonth(anchor) }
  }
}

/** 相对 anchor 前移一个单位 */
export function prevAnchor(view: ChronicleView, anchor: Date): Date {
  const r = new Date(anchor)
  if (view === 'day') r.setDate(r.getDate() - 1)
  else if (view === 'week') r.setDate(r.getDate() - 7)
  else r.setMonth(r.getMonth() - 1)
  return startOfDay(r)
}

/** 相对 anchor 后移一个单位 */
export function nextAnchor(view: ChronicleView, anchor: Date): Date {
  const r = new Date(anchor)
  if (view === 'day') r.setDate(r.getDate() + 1)
  else if (view === 'week') r.setDate(r.getDate() + 7)
  else r.setMonth(r.getMonth() + 1)
  return startOfDay(r)
}

/** 给 range 生成每日 key 列表（用于生成空日格） */
export function enumerateDays(range: DateRange): string[] {
  const out: string[] = []
  const cur = startOfDay(range.from)
  const end = startOfDay(range.to)
  while (cur.getTime() <= end.getTime()) {
    out.push(formatAnchor(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}
