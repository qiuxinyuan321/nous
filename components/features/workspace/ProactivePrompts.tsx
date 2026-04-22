'use client'

import { Sparkle, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { DEFAULT_PERSONA_ID, PERSONAS, type PersonaId } from '@/lib/proactive/personas'
import {
  readPersonaIdFromStorage,
  subscribePersonaChange,
  writePersonaIdToStorage,
} from '@/lib/proactive/persona-client'
import type { ProactivePrompt, ProactiveResponse } from '@/lib/proactive/types'

const DISMISS_KEY = 'nous.proactive.dismissed.v1'
const DISMISS_TTL_MS = 7 * 24 * 3600 * 1000 // 1 周内不再显示同 key
const DISMISS_CHANGE_EVENT = 'nous-proactive-dismiss-change'

type DismissMap = Record<string, number>

function readRawDismiss(): string {
  if (typeof window === 'undefined') return '{}'
  try {
    return localStorage.getItem(DISMISS_KEY) ?? '{}'
  } catch {
    return '{}'
  }
}

function writeRawDismiss(next: DismissMap) {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event(DISMISS_CHANGE_EVENT))
  } catch {
    /* quota exceeded or similar · silent */
  }
}

function subscribeDismiss(cb: () => void) {
  if (typeof window === 'undefined') return () => {}
  const onChange = () => cb()
  window.addEventListener('storage', onChange)
  window.addEventListener(DISMISS_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(DISMISS_CHANGE_EVENT, onChange)
  }
}

function parseDismiss(raw: string): DismissMap {
  try {
    const parsed = JSON.parse(raw) as DismissMap
    const now = Date.now()
    const out: DismissMap = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'number' && now - v < DISMISS_TTL_MS) out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

/**
 * Proactive Questions 区块
 * -----------------------------------------------------------
 * - 客户端获取 /api/proactive · 按 localStorage dismiss 过滤
 * - dismiss 状态通过 useSyncExternalStore 接入 localStorage · 合规 React 19
 * - 最多展示 3 张卡（API 已截 · 这里再做冗余安全）
 * - 每卡：朱砂/墨色 severity 条 + 问句 + context + [CTA] + [跳过]
 */
export function ProactivePrompts() {
  const router = useRouter()
  const locale = useLocale()
  const [data, setData] = useState<ProactiveResponse | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const raw = useSyncExternalStore(subscribeDismiss, readRawDismiss, () => '{}')
  const dismissed = useMemo(() => parseDismiss(raw), [raw])

  const personaId = useSyncExternalStore(
    subscribePersonaChange,
    readPersonaIdFromStorage,
    () => DEFAULT_PERSONA_ID,
  )

  // persona 变化 · 重新 fetch
  useEffect(() => {
    let cancelled = false
    const url = `/api/proactive?persona=${encodeURIComponent(personaId)}`
    fetch(url, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ProactiveResponse | null) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [personaId])

  const setPersonaId = useCallback((id: PersonaId) => {
    writePersonaIdToStorage(id)
  }, [])

  const visiblePrompts = useMemo(() => {
    if (!data?.prompts) return []
    return data.prompts.filter((p) => !(p.key in dismissed)).slice(0, 3)
  }, [data, dismissed])

  const dismiss = useCallback(
    (key: string) => {
      const next = { ...dismissed, [key]: Date.now() }
      writeRawDismiss(next)
    },
    [dismissed],
  )

  const act = useCallback(
    async (prompt: ProactivePrompt) => {
      setPendingKey(prompt.key)
      try {
        // 1) 有 related idea · 直接去那个 idea 的 refine
        if (prompt.relatedRef?.type === 'idea') {
          router.push(`/${locale}/refine/${prompt.relatedRef.id}`)
          return
        }
        // 2) 其他：以问句为起点建一个新 idea · 进对话
        const res = await fetch('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawContent: prompt.question }),
        })
        if (res.ok) {
          const idea = await res.json()
          if (idea?.id) {
            // 用过即 dismiss · 避免再次提示
            dismiss(prompt.key)
            router.push(`/${locale}/refine/${idea.id}`)
            return
          }
        }
        // 失败也 dismiss · 不再重复打扰
        dismiss(prompt.key)
      } finally {
        setPendingKey(null)
      }
    },
    [router, locale, dismiss],
  )

  if (!data || visiblePrompts.length === 0) return null

  return (
    <section
      aria-label="AI 主动问"
      className="border-ink-light/20 bg-paper-aged/30 mb-8 rounded-sm border p-4"
    >
      <header className="mb-3 flex items-center gap-2">
        <Sparkle className="text-cinnabar h-3.5 w-3.5" aria-hidden />
        <span className="text-ink-medium font-serif-cn text-[11px] tracking-[0.2em] uppercase">
          Nous 想问问你
        </span>
        <span className="text-ink-light text-[10px]">{visiblePrompts.length} 条</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-ink-light font-serif-cn text-[10px] tracking-[0.15em] uppercase">
            由
          </span>
          <PersonaPicker current={personaId} onChange={setPersonaId} />
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {visiblePrompts.map((p) => (
          <PromptCard
            key={p.key}
            prompt={p}
            onAct={() => act(p)}
            onDismiss={() => dismiss(p.key)}
            pending={pendingKey === p.key}
          />
        ))}
      </div>
    </section>
  )
}

/**
 * PersonaPicker · 原生 select · 墨色主题样式
 * 选中后即刻触发上层重新 fetch
 */
function PersonaPicker({
  current,
  onChange,
}: {
  current: PersonaId
  onChange: (id: PersonaId) => void
}) {
  const currentPersona = PERSONAS.find((p) => p.id === current) ?? PERSONAS[0]
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">选择角色</span>
      <select
        aria-label="选择角色"
        value={current}
        onChange={(e) => onChange(e.target.value as PersonaId)}
        className="border-ink-light/30 bg-paper-rice/60 text-ink-heavy hover:border-ink-medium font-serif-cn focus:ring-cinnabar/40 cursor-pointer appearance-none rounded-sm border py-0.5 pr-6 pl-2 text-[11px] transition focus:ring-2 focus:outline-none"
      >
        {PERSONAS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.avatar} {p.name} · {p.tagline}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="text-ink-light pointer-events-none absolute right-1.5 text-[10px]"
      >
        ▾
      </span>
      {/* 当前角色小 chip · 提高辨识度 */}
      <span className="text-ink-light sr-only">{currentPersona.name}</span>
    </label>
  )
}

function PromptCard({
  prompt,
  onAct,
  onDismiss,
  pending,
}: {
  prompt: ProactivePrompt
  onAct: () => void
  onDismiss: () => void
  pending: boolean
}) {
  const accent = prompt.severity === 'alert' ? 'border-l-cinnabar' : 'border-l-ink-light/40'
  const cta = prompt.ctaLabel ?? '这问题我想想'
  return (
    <article
      className={cn(
        'bg-paper-rice/50 relative rounded-sm border-l-2 py-3 pr-3 pl-4 transition-colors',
        accent,
      )}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="跳过"
        className="text-ink-light hover:text-ink-heavy absolute top-2 right-2 rounded p-1 transition"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <p className="text-ink-heavy font-serif-cn pr-6 text-[14px] leading-relaxed">
        {prompt.question}
      </p>
      {prompt.context && (
        <p className="text-ink-light mt-1 text-[11px] leading-relaxed">{prompt.context}</p>
      )}
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={onAct}
          disabled={pending}
          className="bg-ink-heavy hover:bg-ink-medium rounded-sm px-3 py-1 text-[11px] text-[color:var(--paper-rice)] transition disabled:opacity-50"
        >
          {pending ? '…' : cta}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-ink-light hover:text-ink-heavy text-[11px] transition"
        >
          跳过
        </button>
      </div>
    </article>
  )
}
