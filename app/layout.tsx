import type { Metadata, Viewport } from 'next'
import { getLocale } from 'next-intl/server'
import { Fraunces, JetBrains_Mono, Noto_Serif_SC } from 'next/font/google'
import type { ReactNode } from 'react'
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister'
import { CursorGlow } from '@/components/ui/CursorGlow'
import { applyThemeScript } from '@/lib/themes/catalog'
import './globals.css'

/**
 * 字体策略（性能优先）：
 * - Fraunces（LCP 字体 · H1 "Nous"）· 只留 500/700 · preload: true
 * - Noto Serif SC（中文标题）· 只留 500 · preload: false（延后加载）
 * - JetBrains Mono（代码块）· preload: false
 * - 删除 Inter（sans-en → system-ui stack）
 * - 删除 Noto Sans SC（subsets=latin 对中文字体无意义，浪费；sans-cn → PingFang/YaHei fallback）
 *
 * 结果：字体文件数 10+ → 3，首屏字节数减少 ~70%。
 */
const serifEn = Fraunces({
  variable: '--font-serif-en',
  subsets: ['latin'],
  weight: ['500', '700'],
  display: 'swap',
  preload: true,
})

const serifCn = Noto_Serif_SC({
  variable: '--font-serif-cn',
  subsets: ['latin'],
  weight: ['500'],
  display: 'swap',
  preload: false,
})

const mono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Nous · 让想法，落地',
    template: '%s · Nous',
  },
  description: '专为 INTP 深度思考者设计的 AI 执行力工具。捕获想法，苏格拉底追问，一键规划。',
  keywords: ['INTP', 'productivity', 'AI', 'Socratic', 'planning', '执行力', '想法管理'],
  authors: [{ name: 'Nous contributors' }],
  manifest: '/manifest.webmanifest',
  applicationName: 'Nous',
  appleWebApp: {
    capable: true,
    title: 'Nous',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Nous',
    description: '让想法，落地',
    type: 'website',
    images: ['/hero.jpg'],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7EF' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1814' },
  ],
}

/**
 * 根 layout。
 * next-intl 推荐模式：这里承担 <html>/<body>，locale 通过 getLocale() 服务端获取；
 * [locale]/layout.tsx 只负责注入 NextIntlClientProvider。
 * 这样任何路由（含 not-found）都有合法的 HTML 结构（Next.js 16 强校验）。
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${serifCn.variable} ${serifEn.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        {/* 主题 CSS 变量 inline 注入,避免切换主题时首帧闪白 */}
        <script dangerouslySetInnerHTML={{ __html: applyThemeScript() }} />
      </head>
      <body className="bg-paper-rice text-ink-heavy font-sans-cn flex min-h-full flex-col text-base leading-relaxed">
        {children}
        <CursorGlow />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
