import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { CalendarPageView } from '@/components/features/notes/CalendarPageView'

export default async function NoteCalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/notes/calendar`)
  }

  return <CalendarPageView />
}
