import type { ReactNode } from 'react'
import { Link } from '@/lib/i18n/navigation'
import { InkStroke } from '@/components/ink/InkStroke'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <Link
        href="/"
        className="font-serif-en text-ink-heavy hover:text-ink-medium text-3xl transition"
      >
        Nous
      </Link>
      <div className="mt-4 w-12 opacity-60">
        <InkStroke variant="thin" />
      </div>
      <div className="mt-12 w-full max-w-sm">{children}</div>
    </div>
  )
}
