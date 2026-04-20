'use client'

import { useCallback, useState } from 'react'
import { DEFAULT_THEME_ID, THEME_CATALOG, getTheme, type ThemeDef } from '@/lib/themes/catalog'

const STORAGE_KEY = 'nous-theme'

/**
 * 主题 hook。
 * ---------
 * 初始化: inline script (在 <head>) 已把 localStorage 中的 themeId 写入
 *   document.documentElement.dataset.theme, 所以此处同步读取即可,避免
 *   useEffect + setState 的级联渲染告警。
 */
export function useTheme() {
  const [themeId, setThemeId] = useState<string>(() => {
    if (typeof document === 'undefined') return DEFAULT_THEME_ID
    return document.documentElement.dataset.theme || DEFAULT_THEME_ID
  })

  const apply = useCallback((id: string) => {
    const theme = getTheme(id)
    const root = document.documentElement
    for (const [k, v] of Object.entries(theme.vars)) {
      root.style.setProperty(k, v)
    }
    root.dataset.theme = id
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // no-op
    }
    setThemeId(id)
    // 异步持久化到用户设置
    fetch('/api/settings/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeId: id }),
    }).catch(() => {})
  }, [])

  return {
    themeId,
    current: getTheme(themeId),
    themes: THEME_CATALOG as ThemeDef[],
    apply,
  }
}
