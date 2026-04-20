import { setRequestLocale } from 'next-intl/server'
import { auth } from '@/lib/auth'
import ClientPage from './ClientPage'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  
  // We can still pre-fetch translations here if we want to pass them, 
  // but next-intl `useTranslations` inside ClientPage will work 
  // because of LocaleLayout's NextIntlClientProvider.
  
  const session = await auth()
  const ctaHref = session?.user ? '/inbox' : '/login'

  return <ClientPage ctaHref={ctaHref} />
}
