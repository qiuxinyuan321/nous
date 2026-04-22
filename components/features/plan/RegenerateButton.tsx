'use client'

/**
 * Plan 页面的"重新生成方案"按钮。
 *
 * 设计要点：
 * - 读取当前 localStorage 的 persona · 显示在按钮 label 上 · 让用户清楚会用哪种风格
 * - 点击先弹确认（破坏性操作 · 会丢失旧 milestones / tasks 的 focusedOn 和 status）
 * - server action 成功后 revalidatePath 自动刷新 · 不用 router.refresh
 * - 失败时把错误码反馈到 inline 错误条 · 不弹 alert
 */
import { useState, useSyncExternalStore, useTransition } from 'react'
import { regeneratePlanAction } from '@/app/[locale]/(app)/refine/[id]/actions'
import { readPersonaIdFromStorage, subscribePersonaChange } from '@/lib/proactive/persona-client'
import { getPersona } from '@/lib/proactive/personas'

interface Props {
  ideaId: string
  locale: 'zh-CN' | 'en-US'
}

export function RegenerateButton({ ideaId, locale }: Props) {
  const personaId = useSyncExternalStore(
    subscribePersonaChange,
    readPersonaIdFromStorage,
    readPersonaIdFromStorage,
  )
  const persona = getPersona(personaId)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onConfirm() {
    setError(null)
    startTransition(async () => {
      const res = await regeneratePlanAction(ideaId, locale, personaId)
      if (res.ok) {
        setConfirming(false)
      } else {
        setError(res.error)
      }
    })
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="border-ink-light/40 bg-paper-aged/40 text-ink-medium hover:border-ink-heavy hover:text-ink-heavy inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs transition"
        title={`用当前 persona (${persona.name}) 的风格重新生成方案`}
      >
        <span aria-hidden>↻</span>
        <span>换种风格重生</span>
        <span className="text-ink-light font-serif-cn border-l pl-2 text-[10px]">
          {persona.avatar} {persona.name}
        </span>
      </button>
    )
  }

  return (
    <div className="border-cinnabar/30 bg-paper-aged/60 flex items-center gap-3 rounded-sm border px-3 py-2 text-xs">
      <span className="text-ink-heavy">
        将删除当前 milestones 与 tasks · 用 <span className="font-medium">{persona.name}</span>{' '}
        的风格重写。
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setConfirming(false)
            setError(null)
          }}
          disabled={isPending}
          className="text-ink-light hover:text-ink-heavy disabled:opacity-40"
        >
          取消
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="bg-cinnabar/90 hover:bg-cinnabar rounded-sm px-3 py-1 font-medium text-[color:var(--paper-rice)] disabled:opacity-40"
        >
          {isPending ? '重写中…' : '确定重写'}
        </button>
      </div>
      {error && (
        <p className="text-cinnabar basis-full text-[11px]">
          {error === 'RATE_LIMITED'
            ? '重写过于频繁 · 每小时最多 3 次'
            : error === 'QUOTA_EXCEEDED'
              ? '今日配额已用尽'
              : error}
        </p>
      )}
    </div>
  )
}
