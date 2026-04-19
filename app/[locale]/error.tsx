'use client'

import { useEffect } from 'react'
import { Seal } from '@/components/ink/Seal'
import { InkStroke } from '@/components/ink/InkStroke'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[locale error]', error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
      <Seal variant="decision" size="lg">
        讹
      </Seal>
      <h1 className="font-serif-cn text-ink-heavy mt-8 text-2xl">出了点意外</h1>
      <div className="mt-4 w-16 opacity-60">
        <InkStroke variant="thin" />
      </div>
      <p className="text-ink-medium mt-6 max-w-md text-sm leading-relaxed">
        {error.message || '未知错误'}
      </p>
      {error.digest && (
        <p className="text-ink-light mt-3 font-mono text-xs">digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="bg-ink-heavy hover:bg-ink-medium mt-10 rounded-sm px-6 py-2 text-sm text-[color:var(--paper-rice)] transition"
      >
        再试一次
      </button>
    </main>
  )
}
