import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Seal } from '@/components/ink/Seal'
import { auth } from '@/lib/auth'
import { LoginForm } from './LoginForm'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ verify?: string; callbackUrl?: string; provider?: string; type?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const { verify, callbackUrl, provider, type } = await searchParams
  const t = await getTranslations()

  // 运行时读取环境变量（不能放模块顶层，否则构建时为空）
  const hasGitHub = !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET)
  const hasPassword = !!(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim())

  const session = await auth()
  if (session?.user) {
    redirect(`/${locale}/inbox`)
  }

  const isVerifying = !hasPassword && (verify === '1' || (provider === 'nodemailer' && type === 'email'))

  if (isVerifying) {
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
      <p className="text-ink-light mt-3 text-center text-sm">
        {hasPassword ? '输入邮箱和密码登录' : '输入邮箱，我们会发一条登录链接给你'}
      </p>
      <div className="mt-8">
        <LoginForm callbackUrl={callbackUrl} hasGitHub={hasGitHub} hasPassword={hasPassword} />
      </div>
    </div>
  )
}
