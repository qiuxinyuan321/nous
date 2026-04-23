/**
 * Persona 客户端持久化 · localStorage + 跨组件同步
 * ---------------------------------------------------
 * 抽出公共 helper 供 ProactivePrompts、RefineView 等多处复用。
 * 任一组件写入都会通过自定义事件通知全页面其他订阅者 · 跨 tab 用 storage 事件。
 */
import { DEFAULT_PERSONA_ID, isValidPersonaId, type PersonaId } from './personas'

export const PERSONA_STORAGE_KEY = 'nous.proactive.persona.v1'
export const PERSONA_CHANGE_EVENT = 'nous-proactive-persona-change'

export function readPersonaIdFromStorage(): PersonaId {
  if (typeof window === 'undefined') return DEFAULT_PERSONA_ID
  try {
    const v = localStorage.getItem(PERSONA_STORAGE_KEY)
    return isValidPersonaId(v) ? v : DEFAULT_PERSONA_ID
  } catch {
    return DEFAULT_PERSONA_ID
  }
}

export function writePersonaIdToStorage(id: PersonaId): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PERSONA_STORAGE_KEY, id)
    window.dispatchEvent(new Event(PERSONA_CHANGE_EVENT))
  } catch {
    /* silent · 私隐模式下 localStorage 可能抛错 */
  }
}

export function subscribePersonaChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const h = () => cb()
  window.addEventListener('storage', h)
  window.addEventListener(PERSONA_CHANGE_EVENT, h)
  return () => {
    window.removeEventListener('storage', h)
    window.removeEventListener(PERSONA_CHANGE_EVENT, h)
  }
}
