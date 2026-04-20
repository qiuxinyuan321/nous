import NextAuth from 'next-auth'
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { authConfig } from '@/lib/auth.config'
import { routing } from '@/lib/i18n/routing'

const { auth } = NextAuth(authConfig)
const intlMiddleware = createIntlMiddleware(routing)

const PROTECTED = ['/inbox', '/refine', '/plan', '/focus', '/journal', '/settings']

/** 剥离 locale 前缀，便于和 PROTECTED 白名单匹配。 */
function stripLocale(pathname: string): { locale: string; path: string } {
  for (const l of routing.locales) {
    if (pathname === `/${l}`) return { locale: l, path: '/' }
    if (pathname.startsWith(`/${l}/`)) {
      return { locale: l, path: pathname.slice(`/${l}`.length) }
    }
  }
  return { locale: routing.defaultLocale, path: pathname }
}

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user
  const { locale, path } = stripLocale(req.nextUrl.pathname)
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))

  if (isProtected && !isLoggedIn) {
    const url = new URL(`/${locale}/login`, req.nextUrl)
    url.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return intlMiddleware(req as unknown as NextRequest)
})

export const config = {
  // 匹配除 api、_next、_vercel、静态资源以外的所有路径
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
