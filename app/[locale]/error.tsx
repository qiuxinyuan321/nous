'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Seal } from '@/components/ink/Seal'
import { InkStroke } from '@/components/ink/InkStroke'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    console.error('[locale error]', error)
  }, [error])

  async function copyDiagnostic() {
    const diagnostic = [error.message, error.digest ? `digest: ${error.digest}` : null]
      .filter(Boolean)
      .join('\n')
    if (!diagnostic || !navigator.clipboard) return
    await navigator.clipboard.writeText(diagnostic)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

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
        刚才的页面没有顺利完成。通常是网络、登录状态、数据库连接或 AI Key
        配置导致；先重试一次，连续失败再检查设置。
      </p>
      {error.digest && (
        <p className="text-ink-light mt-3 font-mono text-xs">诊断编号：{error.digest}</p>
      )}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="bg-ink-heavy hover:bg-ink-medium rounded-sm px-6 py-2 text-sm text-[color:var(--paper-rice)] transition"
        >
          再试一次
        </button>
        <Link
          href="/settings/api-keys"
          className="border-ink-light/40 text-ink-medium hover:border-ink-heavy hover:text-ink-heavy rounded-sm border px-6 py-2 text-sm transition"
        >
          检查 API Key
        </Link>
        <button
          onClick={copyDiagnostic}
          className="text-ink-light hover:text-ink-heavy text-sm transition"
        >
          {copied ? '已复制' : '复制诊断'}
        </button>
      </div>
    </main>
  )
}
