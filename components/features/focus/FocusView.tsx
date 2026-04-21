'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pomodoro } from './Pomodoro'
import { PriorityBadge } from '@/components/features/plan/PriorityBadge'
import { InkStroke } from '@/components/ink/InkStroke'
import { Link } from '@/lib/i18n/navigation'
import { usePomodoroStore } from '@/lib/stores/pomodoro'

const MOTIVATIONS = [
  '落一笔，少一件。',
  '做完比做好更重要。',
  '又近了一步。',
  '稳步推进，不急不躁。',
  '这件事，搞定了。',
  '一件一件来，你在前进。',
  '今天的你比昨天更强。',
  '专注的力量，正在生效。',
  '完成即是胜利。',
  '好的节奏，继续。',
]

export interface FocusTaskItem {
  id: string
  title: string
  description: string | null
  priority: string
  estimatedMin: number | null
  status: string
  ideaId: string
  ideaTitle: string | null
  milestoneTitle: string
}

interface FocusViewProps {
  tasks: FocusTaskItem[]
  dateLabel: string
}

export function FocusView({ tasks, dateLabel }: FocusViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const activeTaskId = usePomodoroStore((s) => s.activeTaskId)
  const setTask = usePomodoroStore((s) => s.setTask)

  // 本地乐观更新:status 变化
  const [localStatus, setLocalStatus] = useState<Record<string, string>>(() =>
    Object.fromEntries(tasks.map((t) => [t.id, t.status])),
  )

  const enriched = useMemo(
    () =>
      tasks.map((t) => ({
        ...t,
        status: localStatus[t.id] ?? t.status,
      })),
    [tasks, localStatus],
  )

  const pending = enriched.filter((t) => t.status !== 'done' && t.status !== 'skipped')
  const finished = enriched.filter((t) => t.status === 'done')
  const activeTask = enriched.find((t) => t.id === activeTaskId) ?? null

  const [toast, setToast] = useState<string | null>(null)
  const [allDoneDismissed, setAllDoneDismissed] = useState(false)
  const allDoneCelebration =
    !allDoneDismissed &&
    tasks.length > 0 &&
    pending.length === 0 &&
    finished.length === tasks.length

  const showMotivation = useCallback(() => {
    const msg = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)]
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const setStatus = (taskId: string, status: string) => {
    const prev = localStatus[taskId]
    setLocalStatus((s) => ({ ...s, [taskId]: status }))
    if (status === 'done') showMotivation()
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        router.refresh()
      } catch {
        setLocalStatus((s) => ({ ...s, [taskId]: prev ?? 'todo' }))
      }
    })
  }

  const removeFromToday = (taskId: string) => {
    startTransition(async () => {
      try {
        await fetch(`/api/tasks/${taskId}/focus`, { method: 'DELETE' })
        if (activeTaskId === taskId) setTask(null)
        router.refresh()
      } catch {
        /* ignore */
      }
    })
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-10">
        <p className="text-ink-light text-xs tracking-widest uppercase">Today · {dateLabel}</p>
        <h1 className="font-serif-cn text-ink-heavy mt-2 text-3xl">今日聚焦</h1>
        <div className="mt-4 w-16">
          <InkStroke variant="medium" />
        </div>
      </header>

      {/* 激励 Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 animate-bounce">
          <div className="bg-celadon/15 border-celadon/40 text-celadon font-serif-cn rounded-sm border px-6 py-3 text-sm shadow-lg">
            ✓ {toast}
          </div>
        </div>
      )}

      {/* 全部完成庆祝 */}
      {allDoneCelebration && pending.length === 0 && finished.length > 0 && (
        <div className="border-celadon/30 bg-celadon/5 mb-8 rounded-sm border px-8 py-10 text-center">
          <p className="text-4xl">🎋</p>
          <h2 className="font-serif-cn text-ink-heavy mt-4 text-2xl">今日事，今日毕</h2>
          <p className="text-ink-medium mt-3 text-sm leading-relaxed">
            你完成了今天全部{' '}
            <span className="text-celadon font-mono font-bold">{finished.length}</span> 项任务。
            <br />
            去喝杯茶，或者看看本周复盘。
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/journal"
              className="bg-ink-heavy hover:bg-ink-medium rounded-sm px-5 py-2 text-sm text-[color:var(--paper-rice)] transition"
            >
              查看复盘
            </Link>
            <button
              onClick={() => setAllDoneDismissed(true)}
              className="text-ink-light hover:text-ink-heavy text-sm transition"
            >
              继续留在这里
            </button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* 左：任务列表 */}
          <section>
            {/* 进度条 */}
            {tasks.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-light">今日进度</span>
                  <span className="text-ink-medium font-mono">
                    {finished.length}/{tasks.length}
                  </span>
                </div>
                <div className="bg-ink-light/10 mt-2 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-celadon h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${tasks.length > 0 ? (finished.length / tasks.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {pending.length > 0 ? (
              <ul className="space-y-3">
                {pending.map((t) => (
                  <FocusTaskRow
                    key={t.id}
                    task={t}
                    active={activeTaskId === t.id}
                    onPickForFocus={() => setTask(t.id)}
                    onComplete={() => setStatus(t.id, 'done')}
                    onSkip={() => setStatus(t.id, 'skipped')}
                    onRemove={() => removeFromToday(t.id)}
                    disabled={isPending}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-ink-light text-sm">今日任务全部完成。</p>
            )}

            {finished.length > 0 && (
              <section className="mt-10">
                <h3 className="text-ink-light mb-3 text-xs tracking-widest uppercase">
                  已完成 · {finished.length}
                </h3>
                <ul className="space-y-2">
                  {finished.map((t) => (
                    <li
                      key={t.id}
                      className="font-serif-cn text-ink-light flex items-center justify-between gap-3 text-sm line-through"
                    >
                      <span>{t.title}</span>
                      <button
                        onClick={() => setStatus(t.id, 'todo')}
                        className="hover:text-ink-medium text-[11px] transition"
                      >
                        撤销
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </section>

          {/* 右：番茄钟 */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <Pomodoro activeTaskTitle={activeTask?.title ?? null} />
            {!activeTask && pending.length > 0 && (
              <p className="text-ink-light mt-3 text-center text-xs">← 从左侧选一个任务开始</p>
            )}
          </aside>
        </div>
      )}
    </main>
  )
}

function FocusTaskRow({
  task,
  active,
  onPickForFocus,
  onComplete,
  onSkip,
  onRemove,
  disabled,
}: {
  task: FocusTaskItem
  active: boolean
  onPickForFocus: () => void
  onComplete: () => void
  onSkip: () => void
  onRemove: () => void
  disabled: boolean
}) {
  return (
    <li
      className={`rounded-sm border p-4 transition ${
        active
          ? 'border-cinnabar/60 bg-cinnabar/5'
          : 'border-ink-light/30 bg-paper-rice/60 hover:border-ink-heavy/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-serif-cn text-ink-heavy text-base leading-snug font-medium">
              {task.title}
            </h4>
            <PriorityBadge priority={task.priority} />
            {active && (
              <span className="text-cinnabar font-mono text-[10px] tracking-widest uppercase">
                · 正在专注
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-ink-medium mt-1.5 text-xs leading-relaxed">{task.description}</p>
          )}
          <div className="text-ink-light mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            {task.estimatedMin != null && (
              <span>
                预计 <span className="text-ink-medium font-mono">{task.estimatedMin}</span> 分钟
              </span>
            )}
            <span>·</span>
            <Link href={`/plan/${task.ideaId}`} className="hover:text-ink-heavy transition">
              {task.ideaTitle || '无题'} › {task.milestoneTitle}
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!active ? (
          <button
            onClick={onPickForFocus}
            disabled={disabled}
            className="border-cinnabar/60 text-cinnabar hover:bg-cinnabar/10 rounded-sm border px-3 py-1 text-[11px] transition disabled:opacity-50"
          >
            选入番茄钟
          </button>
        ) : (
          <span className="text-cinnabar text-[11px]">专注中</span>
        )}
        <button
          onClick={onComplete}
          disabled={disabled}
          className="border-celadon/60 text-celadon hover:bg-celadon/10 rounded-sm border px-3 py-1 text-[11px] transition disabled:opacity-50"
        >
          ✓ 完成
        </button>
        <button
          onClick={onSkip}
          disabled={disabled}
          className="text-ink-light hover:text-ink-medium rounded-sm px-3 py-1 text-[11px] transition disabled:opacity-50"
        >
          跳过
        </button>
        <button
          onClick={onRemove}
          disabled={disabled}
          className="text-ink-light hover:text-cinnabar ml-auto rounded-sm px-2 py-1 text-[11px] transition disabled:opacity-50"
          title="从今日移出"
        >
          ×
        </button>
      </div>
    </li>
  )
}

function EmptyState() {
  return (
    <div className="border-ink-light/30 bg-paper-aged/30 rounded-sm border border-dashed px-8 py-16 text-center">
      <p className="font-serif-cn text-ink-medium text-lg">今日尚未选定任何事</p>
      <p className="text-ink-light mt-3 text-sm leading-relaxed">
        去你的方案页，点任务卡的<span className="text-cinnabar">「加入今日」</span>
        按钮，
        <br />
        今天只做几件重要的事。
      </p>
      <Link
        href="/inbox"
        className="text-ink-medium hover:text-ink-heavy border-ink-heavy/40 hover:bg-ink-heavy/5 mt-6 inline-block rounded-sm border px-5 py-2 text-sm transition"
      >
        去收件箱 →
      </Link>
    </div>
  )
}
