import { setRequestLocale } from 'next-intl/server'
import { ThemeMarket } from '@/components/features/themes/ThemeMarket'

export default async function ThemesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <ThemeMarket />
    </main>
  )
}
