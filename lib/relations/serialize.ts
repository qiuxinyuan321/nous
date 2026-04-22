/**
 * DB row → EntityRef 转换器
 * -----------------------------------------------------------
 * 每个实体的字段命名不同（title/rawContent/content/...），这里
 * 统一归一化，保证上层渲染用同一套字段。
 */

import type { EntityRef } from './types'

const SNIPPET_LEN = 120

function snippet(text: string | null | undefined): string | undefined {
  if (!text) return undefined
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return undefined
  return cleaned.length > SNIPPET_LEN ? cleaned.slice(0, SNIPPET_LEN) + '…' : cleaned
}

export function toIdeaRef(idea: {
  id: string
  title: string | null
  rawContent: string
  refinedSummary: string | null
  status: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}): EntityRef {
  return {
    type: 'idea',
    id: idea.id,
    title:
      idea.title?.trim() || snippet(idea.refinedSummary) || snippet(idea.rawContent) || '无题想法',
    snippet: snippet(idea.refinedSummary ?? idea.rawContent),
    timestamp: idea.updatedAt,
    meta: { status: idea.status, tags: idea.tags },
  }
}

export function toNoteRef(note: {
  id: string
  title: string
  content: string
  tags: string[]
  ideaId: string | null
  updatedAt: Date
}): EntityRef {
  return {
    type: 'note',
    id: note.id,
    title: note.title?.trim() || '无题',
    snippet: snippet(note.content),
    timestamp: note.updatedAt,
    meta: { tags: note.tags, ideaId: note.ideaId ?? undefined },
  }
}

export function toTaskRef(task: {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  milestoneId: string
  completedAt: Date | null
  focusedOn: Date | null
}): EntityRef {
  return {
    type: 'task',
    id: task.id,
    title: task.title,
    snippet: snippet(task.description),
    timestamp: task.completedAt ?? task.focusedOn ?? new Date(),
    meta: {
      priority: task.priority,
      status: task.status,
      milestoneId: task.milestoneId,
    },
  }
}

export function toMessageRef(msg: {
  id: string
  role: string
  content: string
  phase: string
  ideaId: string
  createdAt: Date
}): EntityRef {
  return {
    type: 'message',
    id: msg.id,
    title: msg.role === 'user' ? '我说' : 'AI 回应',
    snippet: snippet(msg.content),
    timestamp: msg.createdAt,
    meta: { role: msg.role, phase: msg.phase, ideaId: msg.ideaId },
  }
}

export function toReflectionRef(r: {
  id: string
  kind: string
  content: string
  aiInsight: string | null
  ideaId: string | null
  createdAt: Date
}): EntityRef {
  const labelMap: Record<string, string> = {
    daily: '每日复盘',
    weekly: '每周复盘',
    'on-complete': '完成复盘',
  }
  return {
    type: 'reflection',
    id: r.id,
    title: labelMap[r.kind] ?? '复盘',
    snippet: snippet(r.aiInsight ?? r.content),
    timestamp: r.createdAt,
    meta: { kind: r.kind, ideaId: r.ideaId ?? undefined },
  }
}

export function toMemoryRef(m: {
  id: string
  kind: string
  content: string
  importance: number
  source: string
  sourceRef: string | null
  createdAt: Date
}): EntityRef {
  const labelMap: Record<string, string> = {
    preference: '偏好',
    habit: '习惯',
    goal: '目标',
    blindspot: '盲点',
    fact: '事实',
  }
  return {
    type: 'memory',
    id: m.id,
    title: labelMap[m.kind] ?? '记忆',
    snippet: snippet(m.content),
    timestamp: m.createdAt,
    meta: {
      kind: m.kind,
      importance: m.importance,
      source: m.source,
      sourceRef: m.sourceRef ?? undefined,
    },
  }
}
