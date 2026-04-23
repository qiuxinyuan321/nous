'use client'

/**
 * 批量把本方案所有 MUST + todo + 未聚焦 的任务加入今日 · 降低 plan→focus 路径阻力。
 *
 * 不建新后端 · 复用 /api/tasks/[id]/focus 的 POST · 前端并发 N 次。
 * 对 3-5 个 MUST 任务来说 < 1s 可接受 · 失败任务不阻塞其他。
 *
 * 三种态：
 *  - idle：显示"聚焦 N 个必做任务"
 *  - pending：loading
 *  - done：显示"已加入 M 个 → 去今日聚焦"
 *  - none：全部已聚焦/已完成 · 直接显示跳转按钮
 */
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'

export interface FocusPlanTask {
  id: string
  priority: string
  status: string
  focusedOn: Date | null
}

export function FocusPlanButton({ tasks }: { tasks: FocusPlanTask[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [justAdded, setJustAdded] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const candidates = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.priority === 'must' && t.status !== 'done' && t.status !== 'skipped' && !t.focusedOn,
      ),
    [tasks],
  )

  // 已在今日聚焦的 MUST 任务数 · 用于 banner 文案
  const alreadyFocused = useMemo(
    () => tasks.filter((t) => t.priority === 'must' && t.focusedOn).length,
    [tasks],
  )

  function onFocusAll() {
    if (candidates.length === 0) return
    setError(null)
    startTransition(async () => {
      const results = await Promise.allSettled(
        candidates.map((t) =>
          fetch(`/api/tasks/${t.id}/focus`, { method: 'POST' }).then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`)
            return r.json()
          }),
        ),
      )
      const okCount = results.filter((r) => r.status === 'fulfilled').length
      const failCount = results.length - okCount
      setJustAdded(okCount)
      if (failCount > 0) {
        setError(`${failCount} 个任务加入失败 · 已加入 ${okCount} 个`)
      }
      router.refresh()
    })
  }

  // 没有 MUST 任务 —— 不渲染（避免噪音）
  const mustTotal = tasks.filter((t) => t.priority === 'must').length
  if (mustTotal === 0) return null

  // 全都已聚焦或已完成 —— 只显示去今日聚焦
  if (candidates.length === 0 && justAdded === null) {
    return (
      <div className="border-ink-light/25 bg-paper-aged/25 mt-4 flex items-center justify-between gap-4 rounded-sm border px-4 py-3 text-sm">
        <span className="text-ink-medium">
          {alreadyFocused > 0 ? (
            <>本方案的 {alreadyFocused} 个必做已在今日聚焦</>
          ) : (
            <>本方案的必做任务都已完成</>
          )}
        </span>
        <Link href="/focus" className="text-cinnabar hover:text-ink-heavy text-xs transition">
          去聚焦 →
        </Link>
      </div>
    )
  }

  return (
    <div className="border-cinnabar/30 bg-cinnabar/5 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border px-4 py-3 text-sm">
      {justAdded !== null ? (
        <>
          <span className="text-ink-heavy font-serif-cn">
            已把 <span className="font-medium">{justAdded}</span> 个任务加入今日
          </span>
          <Link
            href="/focus"
            className="bg-cinnabar hover:bg-ink-heavy rounded-sm px-3 py-1.5 text-xs text-[color:var(--paper-rice)] transition"
          >
            去今日聚焦 →
          </Link>
        </>
      ) : (
        <>
          <span className="text-ink-medium">
            <span className="text-ink-heavy font-medium">一键聚焦</span> · 把本方案{' '}
            {candidates.length} 个必做任务加入今日
            {alreadyFocused > 0 && (
              <span className="text-ink-light ml-2">（已聚焦 {alreadyFocused}）</span>
            )}
          </span>
          <button
            type="button"
            onClick={onFocusAll}
            disabled={isPending}
            className="bg-ink-heavy hover:bg-ink-medium rounded-sm px-3 py-1.5 text-xs text-[color:var(--paper-rice)] transition disabled:opacity-50"
          >
            {isPending ? '加入中…' : `聚焦 ${candidates.length} 件 →`}
          </button>
        </>
      )}
      {error && <p className="text-cinnabar basis-full text-[11px]">{error}</p>}
    </div>
  )
}
