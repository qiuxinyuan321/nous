import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Turbopack 默认已启用 via CLI flag
  },
}

export default withNextIntl(nextConfig)
