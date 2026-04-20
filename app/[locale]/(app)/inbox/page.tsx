import { setRequestLocale } from 'next-intl/server'
import { InboxView } from '@/components/features/inbox/InboxView'

export default async function InboxPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <InboxView />
    </main>
  )
}
