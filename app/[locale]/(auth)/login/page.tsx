import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Seal } from '@/components/ink/Seal'
import { auth } from '@/lib/auth'
import { LoginForm } from './LoginForm'

const hasGitHub = !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET)

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ verify?: string; callbackUrl?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const { verify, callbackUrl } = await searchParams
  const t = await getTranslations()

  // 已登录用户直接跳 inbox
  const session = await auth()
  if (session?.user) {
    redirect(`/${locale}/inbox`)
  }

  if (verify === '1') {
    return (
      <div className="flex flex-col items-center text-center">
        <Seal variant="done" size="lg">
          送
        </Seal>
        <h2 className="font-serif-cn text-ink-heavy mt-8 text-2xl">链接已送达</h2>
        <p className="text-ink-medium mt-4 max-w-xs text-sm leading-relaxed">
          请查看邮箱（或在开发模式下查看终端控制台）。
          <br />
          链接 10 分钟内有效。
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-serif-cn text-ink-heavy text-center text-3xl">{t('auth.login')}</h2>
      <p className="text-ink-light mt-3 text-center text-sm">输入邮箱，我们会发一条登录链接给你</p>
      <div className="mt-8">
        <LoginForm callbackUrl={callbackUrl} hasGitHub={hasGitHub} />
      </div>
    </div>
  )
}
