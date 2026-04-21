'use client'

import { useState } from 'react'
import { Link } from '@/lib/i18n/navigation'

export interface ReflectionItem {
  id: string
  kind: string // daily | weekly | on-complete
  content: string
  createdAt: string
}

export interface MemoryItem {
  id: string
  kind: string // preference | habit | goal | blindspot | fact
  content: string
  importance: number
  createdAt: string
}

interface SedimentPanelProps {
  reflections: ReflectionItem[]
  memories: MemoryItem[]
}

const KIND_LABEL: Record<string, string> = {
  daily: '日',
  weekly: '周',
  'on-complete': '成',
  preference: '偏好',
  habit: '习惯',
  goal: '目标',
  blindspot: '盲点',
  fact: '事实',
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDay === 0) return '今天'
  if (diffDay === 1) return '昨天'
  if (diffDay < 7) return `${diffDay}天前`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}周前`
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(d)
}

/**
 * 工作台沉淀面板：
 * - 折叠式，默认收起（让主视图干净）
 * - 展开后两栏：最近复盘 · 记忆片段
 * - 用来把已降级的 /journal 和 /memory 页面的最新内容带到工作台视野里
 */
export function SedimentPanel({ reflections, memories }: SedimentPanelProps) {
  const [open, setOpen] = useState(false)
  const hasContent = reflections.length > 0 || memories.length > 0

  if (!hasContent) return null

  return (
    <section className="border-ink-light/15 mt-10 border-t pt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-ink-medium hover:text-ink-heavy flex items-center gap-2 text-sm transition"
      >
        <span
          className={`inline-block transition-transform ${open ? 'rotate-90' : ''}`}
          aria-hidden="true"
        >
          ›
        </span>
        <span className="font-serif-cn">沉淀</span>
        <span className="text-ink-light text-xs">
          {reflections.length} 条复盘 · {memories.length} 条记忆
        </span>
      </button>

      {open && (
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {/* 复盘 */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-ink-heavy font-serif-cn text-sm font-medium">最近复盘</h3>
              <Link
                href="/journal"
                className="text-ink-light hover:text-ink-heavy text-xs transition"
              >
                全部 →
              </Link>
            </div>
            {reflections.length === 0 ? (
              <p className="text-ink-light text-xs">暂无复盘</p>
            ) : (
              <ul className="space-y-3">
                {reflections.map((r) => (
                  <li
                    key={r.id}
                    className="border-ink-light/15 bg-paper-aged/20 rounded-sm border p-3"
                  >
                    <div className="mb-1.5 flex items-center gap-2 text-[11px]">
                      <span className="bg-ink-heavy text-paper-rice flex h-4 w-4 items-center justify-center rounded-full font-mono text-[9px]">
                        {KIND_LABEL[r.kind] ?? r.kind.slice(0, 1)}
                      </span>
                      <span className="text-ink-light">{formatRelativeDate(r.createdAt)}</span>
                    </div>
                    <p className="text-ink-medium line-clamp-2 text-xs leading-relaxed">
                      {r.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 记忆 */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-ink-heavy font-serif-cn text-sm font-medium">记忆片段</h3>
              <Link
                href="/memory"
                className="text-ink-light hover:text-ink-heavy text-xs transition"
              >
                全部 →
              </Link>
            </div>
            {memories.length === 0 ? (
              <p className="text-ink-light text-xs">暂无记忆</p>
            ) : (
              <ul className="space-y-2">
                {memories.map((m) => (
                  <li key={m.id} className="flex items-start gap-2">
                    <span className="bg-celadon/15 text-celadon mt-0.5 inline-flex shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] tracking-wider">
                      {KIND_LABEL[m.kind] ?? m.kind}
                    </span>
                    <p className="text-ink-medium text-xs leading-relaxed">{m.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
