import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { Fraunces, JetBrains_Mono, Noto_Serif_SC } from 'next/font/google'
import { routing } from '@/lib/i18n/routing'
import '../globals.css'

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
  openGraph: {
    title: 'Nous',
    description: '让想法，落地',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7EF' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1814' },
  ],
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${serifCn.variable} ${serifEn.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="bg-paper-rice text-ink-heavy font-serif-cn flex min-h-full flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
