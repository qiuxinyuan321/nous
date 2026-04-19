import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Docker 生产镜像使用 standalone 输出(仅必要 node_modules + server.js)
  output: 'standalone',
  // Prisma 运行时文件 Next.js 追踪不到(动态加载),手动 include 到 standalone 产物
  outputFileTracingIncludes: {
    '/**/*': [
      './node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/**/*',
      './node_modules/.pnpm/prisma@*/node_modules/prisma/**/*',
      './node_modules/.pnpm/@prisma+engines@*/node_modules/@prisma/engines/**/*',
      './prisma/**/*',
    ],
  },
  // 允许来自 Tailscale / 内网的 dev HMR 连接（避免 "Blocked cross-origin" 警告）
  allowedDevOrigins: ['100.66.126.16', '*.local'],
  experimental: {
    // Turbopack 默认已启用 via CLI flag
  },
}

export default withNextIntl(nextConfig)
