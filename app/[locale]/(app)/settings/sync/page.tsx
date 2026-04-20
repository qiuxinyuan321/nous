import { setRequestLocale } from 'next-intl/server'
import { SyncView } from '@/components/features/sync/SyncView'

export default async function SyncPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return <SyncView />
}
