import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { OnboardingGuide } from '@/components/layout/OnboardingGuide'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { auth } from '@/lib/auth'

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) {
    redirect(`/${locale}/login`)
  }

  return (
    <QueryProvider>
      <AppHeader user={session.user} />
      <div className="flex-1 pb-20 md:pb-0">{children}</div>
      <CommandPalette />
      <OnboardingGuide />
    </QueryProvider>
  )
}
