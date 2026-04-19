import createMiddleware from 'next-intl/middleware'
import { routing } from '@/lib/i18n/routing'

export default createMiddleware(routing)

export const config = {
  // 匹配除 api、_next、_vercel、静态资源以外的所有路径
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
