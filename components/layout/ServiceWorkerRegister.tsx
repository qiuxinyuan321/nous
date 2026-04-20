'use client'

import { useEffect } from 'react'

/**
 * Service Worker 注册
 * ------------------
 * - 仅生产环境启用 (避免 dev HMR 被 cache)
 * - 刷新后有新 SW 则立即激活
 * - 通过 controllerchange 检测新版本,静默生效下次导航
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const controller = new AbortController()

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

        reg.addEventListener('updatefound', () => {
          const next = reg.installing
          if (!next) return
          next.addEventListener('statechange', () => {
            if (next.state === 'installed' && navigator.serviceWorker.controller) {
              next.postMessage('SKIP_WAITING')
            }
          })
        })
      } catch (err) {
        console.warn('[SW] register failed', err)
      }
    }

    // 页面 load 后再注册,不阻塞首屏
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true, signal: controller.signal })

    return () => controller.abort()
  }, [])

  return null
}
