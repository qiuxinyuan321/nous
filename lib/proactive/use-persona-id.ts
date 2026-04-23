'use client'

/**
 * Hydration-safe persona id hook.
 * ----------------------------------------
 * SSR 阶段无法知道用户浏览器 localStorage · 必须保证 server 与 client 首次 render 的
 * DOM 完全一致 · 否则 React 19 会报 hydration mismatch。
 *
 * 实现：
 *   - getServerSnapshot 恒为 null · client 首次 render 也读到 null
 *   - 首次 render 完成后 subscribe 推送 真实 localStorage 值 · useSyncExternalStore
 *     触发重 render · 此时 `hydrated=true` · UI 才 enrich persona-specific 文案
 *
 * 使用方：所有 persona-specific 文案（name / avatar / personalized title）必须
 * 条件渲染在 `hydrated === true` 分支下 · 否则首帧 DOM 就会和 SSR 不匹配。
 */
import { useSyncExternalStore } from 'react'
import { DEFAULT_PERSONA_ID, type PersonaId } from './personas'
import { readPersonaIdFromStorage, subscribePersonaChange } from './persona-client'

function getServerSnapshot(): PersonaId | null {
  return null
}

export interface UsePersonaResult {
  /** 始终非空 · 未 hydrate 时降级为 DEFAULT_PERSONA_ID */
  personaId: PersonaId
  /** true 表示已从 localStorage 读到真实值 · false 表示 SSR / 首帧占位 */
  hydrated: boolean
}

export function usePersonaId(): UsePersonaResult {
  const stored = useSyncExternalStore<PersonaId | null>(
    subscribePersonaChange,
    readPersonaIdFromStorage,
    getServerSnapshot,
  )
  return {
    personaId: stored ?? DEFAULT_PERSONA_ID,
    hydrated: stored !== null,
  }
}
