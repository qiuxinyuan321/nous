import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { LanguagePicker } from '@/components/features/settings/LanguagePicker'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { auth } from '@/lib/auth'

export default async function LanguagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/settings/language`)
  }

  const current: Locale = isLocale(locale) ? locale : 'zh-CN'

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif-cn text-ink-heavy text-xl">语言</h2>
        <p className="text-ink-light mt-1.5 text-sm">
          选择界面语言。AI 对话会同步用你选的语言回复。
        </p>
      </div>
      <LanguagePicker current={current} />
    </div>
  )
}
