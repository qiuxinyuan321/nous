/**
 * Chronicle · 跨实体事件聚合
 * -----------------------------------------------------------
 * 给定 userId + 时间范围，并发查 6 类事件源：
 *   idea.createdAt / note.updatedAt / message.createdAt /
 *   reflection.createdAt / memory.createdAt / task.completedAt
 * 统一为 ChronicleEvent[] · 按 timestamp DESC 排序
 * 按「YYYY-MM-DD」分组，空日跳过（UI 只显示有事件的日子）
 */

import { prisma } from '@/lib/db'
import {
  toIdeaRef,
  toMemoryRef,
  toMessageRef,
  toNoteRef,
  toReflectionRef,
  toTaskRef,
} from '@/lib/relations/serialize'
import type { ChronicleDayGroup, ChronicleEvent } from './types'
import { formatAnchor } from './range'

export interface GetEventsOptions {
  userId: string
  from: Date
  to: Date
  /** 每类实体最多取多少条（避免月视图全量爆炸）· 默认 500 */
  capPerType?: number
}

export async function getChronicleEvents(opts: GetEventsOptions): Promise<ChronicleEvent[]> {
  const { userId, from, to } = opts
  const cap = opts.capPerType ?? 500

  const [ideas, notes, msgs, reflections, memories, tasks] = await Promise.all([
    prisma.idea.findMany({
      where: { userId, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: 'desc' },
      take: cap,
    }),
    prisma.note.findMany({
      where: { userId, updatedAt: { gte: from, lte: to }, archived: false },
      orderBy: { updatedAt: 'desc' },
      take: cap,
    }),
    prisma.message.findMany({
      where: { idea: { userId }, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: 'desc' },
      take: cap,
    }),
    prisma.reflection.findMany({
      where: { userId, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: 'desc' },
      take: cap,
    }),
    prisma.memory.findMany({
      where: { userId, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: 'desc' },
      take: cap,
    }),
    // Task 仅取在窗口内 "completed" 的作为事件
    prisma.task.findMany({
      where: {
        milestone: { plan: { idea: { userId } } },
        completedAt: { gte: from, lte: to },
        status: 'done',
      },
      orderBy: { completedAt: 'desc' },
      take: cap,
    }),
  ])

  const events: ChronicleEvent[] = []

  for (const r of ideas) {
    events.push({ entity: toIdeaRef(r), action: 'created', timestamp: r.createdAt })
  }
  for (const r of notes) {
    // 创建 & 更新时间相同视为 created，否则 updated
    const isCreated = r.createdAt.getTime() === r.updatedAt.getTime()
    events.push({
      entity: toNoteRef(r),
      action: isCreated ? 'created' : 'updated',
      timestamp: r.updatedAt,
    })
  }
  for (const r of msgs) {
    events.push({ entity: toMessageRef(r), action: 'created', timestamp: r.createdAt })
  }
  for (const r of reflections) {
    events.push({ entity: toReflectionRef(r), action: 'created', timestamp: r.createdAt })
  }
  for (const r of memories) {
    events.push({ entity: toMemoryRef(r), action: 'created', timestamp: r.createdAt })
  }
  for (const r of tasks) {
    if (!r.completedAt) continue
    events.push({
      entity: toTaskRef(r),
      action: 'completed',
      timestamp: r.completedAt,
    })
  }

  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  return events
}

/**
 * 把事件流按日期分组 · 仅保留有事件的日子
 */
export function groupByDay(events: ChronicleEvent[]): ChronicleDayGroup[] {
  const map = new Map<string, ChronicleEvent[]>()
  for (const e of events) {
    const key = formatAnchor(e.timestamp)
    const arr = map.get(key)
    if (arr) arr.push(e)
    else map.set(key, [e])
  }
  return Array.from(map.entries())
    .map(([date, events]) => ({ date, events }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}
