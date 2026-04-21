import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { NoteGraphView } from '@/components/features/notes/NoteGraphView'

export default async function NoteGraphPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/notes/graph`)
  }

  return <NoteGraphView />
}
