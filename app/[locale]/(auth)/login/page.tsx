import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { LoginForm } from './LoginForm'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const { callbackUrl } = await searchParams

  const hasGitHub = !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET)

  const session = await auth()
  if (session?.user) {
    redirect(`/${locale}/inbox`)
  }

  return (
    <div>
      <div className="mt-8">
        <LoginForm callbackUrl={callbackUrl} hasGitHub={hasGitHub} />
      </div>
    </div>
  )
}
