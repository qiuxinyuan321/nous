'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { InkStroke } from '@/components/ink/InkStroke'
import { Seal } from '@/components/ink/Seal'

export interface ReflectionItem {
  id: string
  content: string
  aiInsight: string | null
  createdAt: string
  metadata: unknown
}

interface WeeklyViewProps {
  initial: ReflectionItem[]
}

interface WeeklyMeta {
  rangeStart?: string
  rangeEnd?: string
  ideasCreated?: number
  ideasPlanned?: number
  ideasDone?: number
  tasksCompleted?: number
  tasksSkipped?: number
  tasksTotal?: number
}

export function WeeklyView({ initial }: WeeklyViewProps) {
  const router = useRouter()
  const [list, setList] = useState<ReflectionItem[]>(initial)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const onGenerate = () => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/journal/weekly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale: 'zh-CN' }),
        })
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean
          reflection?: ReflectionItem
          error?: string
          message?: string
        }
        if (!res.ok || !data.ok || !data.reflection) {
          setError(data.message ?? data.error ?? `HTTP ${res.status}`)
          return
        }
        setList((prev) => [data.reflection!, ...prev])
        router.refresh()
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10 flex items-start justify-between gap-6">
        <div>
          <p className="text-ink-light text-xs tracking-widest uppercase">Journal · 复盘</p>
          <h1 className="font-serif-cn text-ink-heavy mt-2 text-3xl">本周复盘</h1>
          <div className="mt-4 w-16">
            <InkStroke variant="medium" />
          </div>
        </div>
        <button
          onClick={onGenerate}
          disabled={isPending}
          className="bg-ink-heavy hover:bg-ink-heavy/90 font-serif-cn text-paper-rice rounded-sm px-5 py-2 text-sm transition disabled:opacity-60"
        >
          {isPending ? '生成中…' : '生成本周复盘'}
        </button>
      </header>

      {error && (
        <div className="border-cinnabar/50 bg-cinnabar/5 text-cinnabar mb-6 rounded-sm border px-4 py-3 text-sm">
          错误：{error}
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="space-y-12">
          {list.map((r, idx) => (
            <ReflectionCard key={r.id} reflection={r} isLatest={idx === 0} />
          ))}
        </section>
      )}
    </main>
  )
}

function ReflectionCard({
  reflection,
  isLatest,
}: {
  reflection: ReflectionItem
  isLatest: boolean
}) {
  const date = new Date(reflection.createdAt)
  const label = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).format(date)

  const meta = (reflection.metadata ?? {}) as WeeklyMeta

  return (
    <article className="border-ink-light/20 bg-paper-aged/30 relative rounded-sm border p-6">
      {isLatest && (
        <div className="absolute -top-4 right-4">
          <Seal variant="done" size="sm">
            最新
          </Seal>
        </div>
      )}
      <header className="text-ink-light flex items-center justify-between text-xs tracking-wider uppercase">
        <span>{label}</span>
        {meta.rangeStart && meta.rangeEnd && (
          <span className="font-mono">
            {meta.rangeStart} ~ {meta.rangeEnd}
          </span>
        )}
      </header>

      {(meta.tasksCompleted != null || meta.ideasCreated != null) && (
        <div className="text-ink-medium mt-4 grid grid-cols-4 gap-3 text-center">
          <Stat label="新增想法" value={meta.ideasCreated ?? 0} />
          <Stat label="已规划" value={meta.ideasPlanned ?? 0} />
          <Stat label="已完成" value={meta.tasksCompleted ?? 0} />
          <Stat label="跳过" value={meta.tasksSkipped ?? 0} />
        </div>
      )}

      {reflection.aiInsight && (
        <blockquote className="border-gold-leaf/60 bg-paper-rice/40 text-ink-heavy font-serif-cn mt-6 border-l-2 px-4 py-3 text-base leading-relaxed">
          {reflection.aiInsight}
        </blockquote>
      )}

      <div className="font-serif-cn text-ink-heavy prose-ink mt-6 text-sm leading-relaxed whitespace-pre-wrap">
        {renderMarkdownLite(reflection.content)}
      </div>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-ink-light/20 border-r last:border-r-0">
      <div className="text-ink-heavy font-mono text-xl font-light tabular-nums">{value}</div>
      <div className="text-ink-light mt-1 text-[10px] tracking-widest uppercase">{label}</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="border-ink-light/30 bg-paper-aged/30 rounded-sm border border-dashed px-8 py-16 text-center">
      <p className="font-serif-cn text-ink-medium text-lg">尚未生成复盘</p>
      <p className="text-ink-light mt-3 text-sm leading-relaxed">
        点右上角的「生成本周复盘」，
        <br />让 AI 从过去 7 天的动作里提炼洞察。
      </p>
    </div>
  )
}

/** 极简 markdown 渲染:只识别 # 标题和 - 列表,不引入 remark */
function renderMarkdownLite(raw: string) {
  const lines = raw.split('\n')
  const out: React.ReactNode[] = []
  let listBuf: string[] = []

  const flushList = () => {
    if (listBuf.length === 0) return
    out.push(
      <ul key={`ul-${out.length}`} className="text-ink-medium my-2 space-y-1 pl-4">
        {listBuf.map((item, i) => (
          <li key={i} className="leading-relaxed">
            <span className="text-ink-light mr-2">·</span>
            {item}
          </li>
        ))}
      </ul>,
    )
    listBuf = []
  }

  lines.forEach((line, idx) => {
    const h2 = line.match(/^##\s+(.+)$/)
    const h1 = line.match(/^#\s+(.+)$/)
    const li = line.match(/^-\s+(.+)$/)
    if (li) {
      listBuf.push(li[1]!)
      return
    }
    flushList()
    if (h1) {
      out.push(
        <h3
          key={`h1-${idx}`}
          className="text-ink-light font-mono text-xs tracking-widest uppercase"
        >
          {h1[1]}
        </h3>,
      )
      return
    }
    if (h2) {
      out.push(
        <h4 key={`h2-${idx}`} className="text-ink-heavy mt-4 mb-1 font-medium">
          {h2[1]}
        </h4>,
      )
      return
    }
    if (line.trim()) {
      out.push(
        <p key={`p-${idx}`} className="text-ink-medium leading-relaxed">
          {line}
        </p>,
      )
    }
  })
  flushList()
  return out
}
