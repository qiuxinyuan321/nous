import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-safe 配置（middleware 引用这份，不得 import 任何 Node-only 模块）。
 * Providers 列表故意留空：middleware 不需要发起 OAuth，只读 JWT cookie。
 * 真正的 providers 在 lib/auth.ts 里合并，走 Node runtime。
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    verifyRequest: '/login',
  },
  providers: [],
  session: { strategy: 'jwt' },
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
