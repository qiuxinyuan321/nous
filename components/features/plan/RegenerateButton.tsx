'use client'

/**
 * Plan 页面的"重新生成方案"按钮。
 *
 * 设计要点：
 * - 读取当前 localStorage 的 persona · 显示在按钮 label 上 · 让用户清楚会用哪种风格
 * - 点击先弹确认（破坏性操作 · 会丢失旧 milestones / tasks 的 focusedOn 和 status）
 * - server action 成功后 revalidatePath 自动刷新 · 不用 router.refresh
 * - 失败时把错误码反馈到 inline 错误条 · 不弹 alert
 *
 * Hydration-safety：
 * - SSR 无法知道 localStorage · useSyncExternalStore 的 getServerSnapshot 返回 null
 * - client 首次 render 与 server 一致 · 不 diff DOM · 不报 hydration mismatch
 * - subscribe 首次在 hydrate 后推真实值 · 触发 re-render · 此时才 enrich persona 文案
 */
import { useState, useTransition } from 'react'
import { regeneratePlanAction } from '@/app/[locale]/(app)/refine/[id]/actions'
import { getPersona } from '@/lib/proactive/personas'
import { usePersonaId } from '@/lib/proactive/use-persona-id'
import { PersonaAvatar } from '@/components/proactive/PersonaAvatar'

interface Props {
  ideaId: string
  locale: 'zh-CN' | 'en-US'
}

export function RegenerateButton({ ideaId, locale }: Props) {
  const { personaId, hydrated } = usePersonaId()
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
        title={hydrated ? `用当前 persona (${persona.name}) 的风格重新生成方案` : '换种风格重生'}
      >
        <span aria-hidden>↻</span>
        <span>换种风格重生</span>
        {hydrated && persona.id !== 'auto' && (
          <span className="text-ink-light font-serif-cn inline-flex items-center gap-1.5 border-l pl-2 text-[10px]">
            <PersonaAvatar persona={persona} size={14} />
            {persona.name}
          </span>
        )}
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
