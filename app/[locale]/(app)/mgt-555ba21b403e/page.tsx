import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { AdminDashboard } from './AdminDashboard'

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || ''
  const session = await auth()

  // 非管理员直接 404，不暴露后台存在
  if (!session?.user?.email || session.user.email !== superAdminEmail) {
    notFound()
  }

  return <AdminDashboard />
}
