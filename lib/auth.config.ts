import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-safe 配置（middleware 引用这份，不得 import 任何 Node-only 模块）。
 * Providers 列表故意留空：middleware 不需要发起 OAuth，只读 JWT cookie。
 * 真正的 providers 在 lib/auth.ts 里合并，走 Node runtime。
 */
// CF Flexible SSL: 公网 HTTPS，回源 HTTP → cookie 不能设 Secure
const useSecureCookies =
  process.env.AUTH_COOKIE_SECURE === 'false'
    ? false
    : !!process.env.NEXTAUTH_URL?.startsWith('https://')
const cookiePrefix = useSecureCookies ? '__Secure-' : ''

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    verifyRequest: '/login',
  },
  providers: [],
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}authjs.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `${cookiePrefix}authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id
      return token
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      return session
    },
  },
  trustHost: true,
}
