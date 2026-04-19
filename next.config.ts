import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 允许来自 Tailscale / 内网的 dev HMR 连接（避免 "Blocked cross-origin" 警告）
  allowedDevOrigins: ['100.66.126.16', '*.local'],
  experimental: {
    // Turbopack 默认已启用 via CLI flag
  },
}

export default withNextIntl(nextConfig)
