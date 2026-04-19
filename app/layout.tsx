import type { ReactNode } from 'react'

/**
 * 根 layout 只透传 children。
 * 真正的 html/body 在 app/[locale]/layout.tsx，由 next-intl 包裹。
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
