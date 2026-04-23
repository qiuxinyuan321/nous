'use client'

/**
 * Workspace 顶部开场白卡
 * -----------------------------------
 * 按 persona × 时段 × 今日/本周活动 生成一句招呼。
 *
 * 时段需要用户本地 hour · SSR 拿不到 · 因此：
 * - useSyncExternalStore 的 serverSnapshot 返回 null · 渲染占位 · 避免 hydration mismatch
 * - 客户端 getSnapshot 返回当前 hour · hour 粒度日内不变 · 无需订阅刷新
 * - React 19 set-state-in-effect lint 下 · useSyncExternalStore 比 useState+useEffect 干净
 */
import { useSyncExternalStore } from 'react'
import { useLocale } from 'next-intl'
import { greetForPersona } from '@/lib/proactive/greeting'
import { getPersona } from '@/lib/proactive/personas'
import { usePersonaId } from '@/lib/proactive/use-persona-id'
import { PersonaAvatar } from '@/components/proactive/PersonaAvatar'

interface Props {
  todayDone: number
  todayTotal: number
  weekIdeas: number
  streak: number
}

// 空订阅 · hour 在本组件生命周期内不需要实时推送
const subscribeNoop = () => () => {}
const getClientHour = () => new Date().getHours()
const getServerHour = () => null

export function GreetingCard({ todayDone, todayTotal, weekIdeas, streak }: Props) {
  const { personaId, hydrated } = usePersonaId()
  const hour = useSyncExternalStore<number | null>(subscribeNoop, getClientHour, getServerHour)
  const rawLocale = useLocale()
  const locale: 'zh-CN' | 'en-US' = rawLocale === 'en-US' ? 'en-US' : 'zh-CN'

  // hour 或 persona 未 ready 时占位 · 保持高度稳定 · 避免 hydration mismatch
  if (hour === null || !hydrated) {
    return (
      <section
        aria-hidden
        className="border-ink-light/15 bg-paper-aged/20 mb-6 h-[54px] rounded-sm border"
      />
    )
  }

  const persona = getPersona(personaId)
  const text = greetForPersona({
    personaId,
    hour,
    todayDone,
    todayTotal,
    weekIdeas,
    streak,
    locale,
  })

  return (
    <section
      aria-label="Nous 开场"
      className="border-ink-light/20 bg-paper-aged/25 mb-6 flex items-center gap-3 rounded-sm border px-4 py-3"
    >
      <PersonaAvatar persona={persona} size={32} className="shrink-0" />

      <p className="font-serif-cn text-ink-heavy flex-1 text-[13px] leading-relaxed">{text}</p>
      <span className="text-ink-light hidden text-[10px] tracking-widest uppercase md:block">
        {persona.name}
      </span>
    </section>
  )
}
