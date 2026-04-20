/* Nous · Service Worker
 * ----------------------
 * 策略:
 * - Precache: /offline + 静态 icon (首次访问即备份)
 * - Navigation (HTML): network-first → 失败则 /offline
 * - 静态资产 (_next/static, icon, manifest, svg): stale-while-revalidate
 * - API (/api/*): 不缓存,仅透传 (避免 auth/idea 错乱)
 *
 * 保守策略,零数据一致性风险。
 */

const VERSION = 'v1'
const PRECACHE = `nous-precache-${VERSION}`
const RUNTIME = `nous-runtime-${VERSION}`

const PRECACHE_URLS = [
  '/offline',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PRECACHE && key !== RUNTIME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request

  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // 从不缓存 API (状态/鉴权相关),让 fetch 走真实网络
  if (url.pathname.startsWith('/api/')) return

  // HTML 导航: network-first + offline 兜底
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(RUNTIME).then((cache) => cache.put(req, copy))
          return res
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/offline'))),
    )
    return
  }

  // 静态资产: stale-while-revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon-') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webmanifest') ||
    url.pathname === '/favicon.ico'
  ) {
    event.respondWith(
      caches.open(RUNTIME).then(async (cache) => {
        const cached = await cache.match(req)
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone())
            return res
          })
          .catch(() => cached)
        return cached || network
      }),
    )
  }
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})
