import { timingSafeEqual } from 'node:crypto'
import { PrismaAdapter } from '@auth/prisma-adapter'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import GitHub from 'next-auth/providers/github'
import Nodemailer from 'next-auth/providers/nodemailer'
import { prisma } from '@/lib/db'
import { authConfig } from '@/lib/auth.config'

const hasEmailServer = !!(process.env.EMAIL_SERVER && process.env.EMAIL_SERVER.trim())
const hasGitHub = !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET)
const hasAdminPassword = !!(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim())

/**
 * NextAuth v5 完整配置（Node runtime）。
 * - Credentials：自托管密码登录（ADMIN_PASSWORD env）
 * - Magic Link：未配 EMAIL_SERVER 时开发友好——链接打印到控制台
 * - GitHub：env 填了才启用
 * - session 用 JWT 以兼容 edge middleware，但 Account/VerificationToken 仍走 Prisma
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    // ── 密码登录（自托管友好）──
    ...(hasAdminPassword
      ? [
          Credentials({
            name: 'password',
            credentials: {
              email: { label: '邮箱', type: 'email' },
              password: { label: '密码', type: 'password' },
            },
            async authorize(credentials) {
              const email = credentials?.email as string
              const password = credentials?.password as string
              if (!email || !password) return null
              const expected = Buffer.from(process.env.ADMIN_PASSWORD!)
              const actual = Buffer.from(password)
              if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
                return null

              // 找到或创建用户
              const user = await prisma.user.upsert({
                where: { email },
                create: { email },
                update: {},
              })
              return { id: user.id, email: user.email, name: user.name, image: user.image }
            },
          }),
        ]
      : []),

    // ── Magic Link ──
    Nodemailer({
      server: hasEmailServer ? process.env.EMAIL_SERVER! : 'smtp://dev:dev@localhost:2525',
      from: process.env.EMAIL_FROM || 'Nous <noreply@nous.local>',
      async sendVerificationRequest({ identifier, url }) {
        if (!hasEmailServer) {
          const banner = [
            '',
            '╭─ Magic Link · dev mode ─────────────────────────',
            `│  收件人 / To: ${identifier}`,
            `│  链接   / URL: ${url}`,
            '│  （复制到浏览器即可登录）',
            '╰─────────────────────────────────────────────────',
            '',
          ].join('\n')

          console.log(banner)
          return
        }
        const { createTransport } = await import('nodemailer')
        const transport = createTransport(process.env.EMAIL_SERVER)
        await transport.sendMail({
          to: identifier,
          from: process.env.EMAIL_FROM,
          subject: '登录 Nous · Sign in to Nous',
          text: `打开以下链接登录 Nous:\n${url}\n\nSign in:\n${url}`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 40px auto;">
              <h2 style="color:#1C1B19;">Nous · 让想法，落地</h2>
              <p style="color:#4A4842;">点击下方链接登录（10 分钟内有效）：</p>
              <p>
                <a href="${url}" style="display:inline-block; background:#1C1B19; color:#FAF7EF; padding:12px 24px; text-decoration:none; border-radius:4px;">
                  登录 Nous →
                </a>
              </p>
              <p style="color:#8B8880; font-size:12px;">若非本人操作，请忽略本邮件。</p>
            </div>
          `,
        })
      },
    }),

    // ── GitHub OAuth ──
    ...(hasGitHub
      ? [
          GitHub({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
})
