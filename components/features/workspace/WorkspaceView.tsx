'use client'

import { useState, useCallback, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { IdeaCard } from '@/components/features/inbox/IdeaCard'
import { PriorityBadge } from '@/components/features/plan/PriorityBadge'
import { Seal } from '@/components/ink/Seal'
import { Pomodoro } from '@/components/features/focus/Pomodoro'
import { useIdeas } from '@/lib/hooks/useIdeas'
import { usePaletteStore } from '@/lib/stores/palette'
import { usePomodoroStore } from '@/lib/stores/pomodoro'
import type { FocusTaskItem } from '@/components/features/focus/FocusView'

interface WeeklyStats {
  ideasCreated: number
  tasksDone: number
}

interface WorkspaceViewProps {
  focusTasks: FocusTaskItem[]
  dateLabel: string
  weeklyStats: WeeklyStats
}

export function WorkspaceView({ focusTasks, dateLabel, weeklyStats }: WorkspaceViewProps) {
  const t = useTranslations('inbox')
  const tCommon = useTranslations('common')
  const { data: ideas, isLoading, error } = useIdeas()
  const openPalette = usePaletteStore((s) => s.openPalette)
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)
  const kbd = isMac ? '⌘K' : 'Ctrl+K'

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* 头部 */}
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-ink-light text-xs tracking-widest uppercase">{dateLabel}</p>
          <h1 className="font-serif-cn text-ink-heavy mt-1 text-3xl">工作台</h1>
        </div>
        <button
          onClick={openPalette}
          className="border-ink-light/40 bg-paper-aged/40 text-ink-medium hover:border-ink-heavy hover:text-ink-heavy flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition"
        >
          <span>+</span>
          <span>落一笔</span>
          <kbd className="border-ink-light/40 rounded border px-1.5 py-0.5 font-mono text-[10px]">
            {kbd}
          </kbd>
        </button>
      </header>

      {/* 本周进度 */}
      {(weeklyStats.ideasCreated > 0 || weeklyStats.tasksDone > 0) && (
        <div className="border-ink-light/15 bg-paper-aged/20 mb-8 flex items-center gap-6 rounded-lg border px-6 py-4">
          <span className="text-ink-light text-xs">本周</span>
          <div className="flex items-center gap-1.5">
            <span className="text-ink-heavy font-mono text-lg font-semibold">{weeklyStats.ideasCreated}</span>
            <span className="text-ink-light text-xs">个想法</span>
          </div>
          <span className="bg-ink-light/20 h-4 w-px" />
          <div className="flex items-center gap-1.5">
            <span className="text-celadon font-mono text-lg font-semibold">{weeklyStats.tasksDone}</span>
            <span className="text-ink-light text-xs">个任务完成</span>
          </div>
          <Link
            href="/journal"
            className="text-ink-light hover:text-ink-heavy ml-auto text-xs transition"
          >
            查看复盘 →
          </Link>
        </div>
      )}

      {/* 双栏布局 */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* 左栏：收件箱 */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif-cn text-ink-heavy text-xl font-medium">
              {t('title')}
            </h2>
            <Link
              href="/inbox"
              className="text-ink-light hover:text-ink-heavy text-xs transition"
            >
              查看全部 →
            </Link>
          </div>

          {isLoading ? (
            <p className="text-ink-light py-12 text-center text-sm">{tCommon('loading')}</p>
          ) : error ? (
            <p className="text-cinnabar py-12 text-center text-sm">
              {tCommon('error')}: {(error as Error).message}
            </p>
          ) : !ideas || ideas.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Seal variant="pending" size="lg">
                待
              </Seal>
              <p className="text-ink-medium mt-6 text-[15px]">{t('empty')}</p>
              <button
                onClick={openPalette}
                className="text-indigo-stone hover:text-ink-heavy mt-4 text-sm underline-offset-4 transition hover:underline"
              >
                按 {kbd} 开始
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {ideas.slice(0, 6).map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
              {ideas.length > 6 && (
                <Link
                  href="/inbox"
                  className="text-ink-light hover:text-ink-heavy py-3 text-center text-sm transition"
                >
                  还有 {ideas.length - 6} 个想法 →
                </Link>
              )}
            </div>
          )}
        </section>

        {/* 右栏：今日聚焦 */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <FocusPanel tasks={focusTasks} dateLabel={dateLabel} />
        </aside>
      </div>
    </main>
  )
}

/* ─── 聚焦面板 ─── */

function FocusPanel({ tasks }: { tasks: FocusTaskItem[]; dateLabel: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const activeTaskId = usePomodoroStore((s) => s.activeTaskId)
  const setTask = usePomodoroStore((s) => s.setTask)

  const [localStatus, setLocalStatus] = useState<Record<string, string>>(() =>
    Object.fromEntries(tasks.map((t) => [t.id, t.status])),
  )

  const enriched = useMemo(
    () => tasks.map((t) => ({ ...t, status: localStatus[t.id] ?? t.status })),
    [tasks, localStatus],
  )

  const pending = enriched.filter((t) => t.status !== 'done' && t.status !== 'skipped')
  const finished = enriched.filter((t) => t.status === 'done')
  const activeTask = enriched.find((t) => t.id === activeTaskId) ?? null

  const setStatus = useCallback(
    (taskId: string, status: string) => {
      setLocalStatus((s) => ({ ...s, [taskId]: status }))
      startTransition(async () => {
        try {
          const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
          if (!res.ok) throw new Error()
          router.refresh()
        } catch {
          setLocalStatus((s) => ({ ...s, [taskId]: 'todo' }))
        }
      })
    },
    [router, startTransition],
  )

  return (
    <div className="border-ink-light/20 bg-paper-aged/20 rounded-lg border p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif-cn text-ink-heavy text-lg font-medium">今日聚焦</h2>
        <Link
          href="/focus"
          className="text-ink-light hover:text-ink-heavy text-xs transition"
        >
          展开 →
        </Link>
      </div>

      {/* 进度条 */}
      {tasks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-light">进度</span>
            <span className="text-ink-medium font-mono">
              {finished.length}/{tasks.length}
            </span>
          </div>
          <div className="bg-ink-light/10 mt-1.5 h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-celadon h-full rounded-full transition-all duration-500"
              style={{
                width: `${tasks.length > 0 ? (finished.length / tasks.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-ink-light text-sm">今日尚无任务</p>
          <p className="text-ink-light/70 mt-2 text-xs">
            去方案页点「加入今日」选任务
          </p>
          <Link
            href="/inbox"
            className="text-indigo-stone hover:text-ink-heavy mt-3 inline-block text-xs underline-offset-4 transition hover:underline"
          >
            或录一个新想法 →
          </Link>
        </div>
      ) : pending.length === 0 && finished.length > 0 ? (
        <div className="py-6 text-center">
          <p className="text-celadon text-2xl">🎋</p>
          <p className="font-serif-cn text-ink-heavy mt-2 text-sm font-medium">
            今日 {finished.length} 项全部完成
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <Link
              href="/journal"
              className="text-ink-medium hover:text-ink-heavy text-xs transition"
            >
              查看复盘
            </Link>
            <span className="bg-ink-light/20 h-3 w-px" />
            <Link
              href="/inbox"
              className="text-indigo-stone hover:text-ink-heavy text-xs transition"
            >
              录新想法
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {pending.map((t) => (
            <li
              key={t.id}
              className={`rounded-md border p-3 transition ${
                activeTaskId === t.id
                  ? 'border-cinnabar/50 bg-cinnabar/5'
                  : 'border-ink-light/20 hover:border-ink-light/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStatus(t.id, 'done')}
                  disabled={isPending}
                  className="border-celadon/50 hover:bg-celadon/20 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition"
                  title="完成"
                >
                  <span className="text-celadon text-[10px]">✓</span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-ink-heavy truncate text-sm font-medium">{t.title}</p>
                  <p className="text-ink-light truncate text-[11px]">
                    {t.ideaTitle || '无题'} › {t.milestoneTitle}
                  </p>
                </div>
                <PriorityBadge priority={t.priority} />
              </div>
            </li>
          ))}
          {finished.length > 0 && (
            <li className="text-ink-light border-t border-dashed pt-2 text-xs">
              已完成 {finished.length} 项
            </li>
          )}
        </ul>
      )}

      {/* 番茄钟（精简版） */}
      {activeTask && (
        <div className="mt-4 border-t pt-4">
          <Pomodoro activeTaskTitle={activeTask.title} />
        </div>
      )}
    </div>
  )
}
