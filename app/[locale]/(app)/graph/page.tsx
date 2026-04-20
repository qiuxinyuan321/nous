import { setRequestLocale } from 'next-intl/server'
import { GraphView } from '@/components/features/graph/GraphView'

export default async function GraphPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <GraphView />
    </main>
  )
}
