import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { ApiKeysManager, type ApiKeyRow } from '@/components/features/settings/ApiKeysManager'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function ApiKeysPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/settings/api-keys`)
  }

  const rows = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      provider: true,
      label: true,
      baseUrl: true,
      model: true,
      isDefault: true,
      createdAt: true,
    },
  })

  const initial: ApiKeyRow[] = rows.map((r) => ({
    id: r.id,
    provider: r.provider,
    label: r.label,
    baseUrl: r.baseUrl,
    model: r.model,
    isDefault: r.isDefault,
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif-cn text-ink-heavy text-xl">API Key 管理</h2>
        <p className="text-ink-light mt-1.5 text-sm">
          配置自己的 Key 后使用不限额度。所有 Key 以 AES-256-GCM 加密存储。
        </p>
      </div>
      <ApiKeysManager initial={initial} />
    </div>
  )
}
