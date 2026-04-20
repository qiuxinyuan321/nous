import { setRequestLocale } from 'next-intl/server'
import { MemoryView } from '@/components/features/memory/MemoryView'

export default async function MemoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <MemoryView />
    </main>
  )
}
