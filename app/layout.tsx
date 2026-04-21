import type { Metadata, Viewport } from 'next'
import { getLocale } from 'next-intl/server'
import { Fraunces, JetBrains_Mono, Noto_Serif_SC } from 'next/font/google'
import type { ReactNode } from 'react'
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister'
import { CursorGlow } from '@/components/ui/CursorGlow'
import { applyThemeScript } from '@/lib/themes/catalog'
import './globals.css'

const serifCn = Noto_Serif_SC({
  variable: '--font-serif-cn',
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
})

const serifEn = Fraunces({
  variable: '--font-serif-en',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

const mono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
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
      className={`${serifCn.variable} ${serifEn.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        {/* 主题 CSS 变量 inline 注入,避免切换主题时首帧闪白 */}
        <script dangerouslySetInnerHTML={{ __html: applyThemeScript() }} />
      </head>
      <body className="bg-paper-rice text-ink-heavy font-serif-cn flex min-h-full flex-col">
        {children}
        <CursorGlow />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
