import type { ReactNode } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { SettingsNav } from '@/components/features/settings/SettingsNav'
import { InkStroke } from '@/components/ink/InkStroke'

export default async function SettingsLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-10">
        <p className="text-ink-light text-xs tracking-widest uppercase">Settings</p>
        <h1 className="font-serif-cn text-ink-heavy mt-2 text-3xl">设置</h1>
        <div className="mt-4 w-16">
          <InkStroke variant="medium" />
        </div>
      </header>

      <div className="grid gap-10 md:grid-cols-[200px_1fr]">
        <SettingsNav />
        <div>{children}</div>
      </div>
    </main>
  )
}
