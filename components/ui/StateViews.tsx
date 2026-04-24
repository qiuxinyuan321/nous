'use client'

import { useState } from 'react'
import { Link } from '@/lib/i18n/navigation'

interface LoadingCardsProps {
  title?: string
  count?: number
}

export function LoadingCards({ title = '正在铺纸研墨…', count = 4 }: LoadingCardsProps) {
  return (
    <div className="py-8" aria-busy="true" aria-live="polite">
      <p className="text-ink-light mb-4 text-center text-sm">{title}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="border-ink-light/20 bg-paper-aged/30 animate-pulse rounded-sm border p-5"
          >
            <div className="bg-ink-light/15 h-4 w-2/3 rounded" />
            <div className="bg-ink-light/10 mt-4 h-3 w-full rounded" />
            <div className="bg-ink-light/10 mt-2 h-3 w-5/6 rounded" />
            <div className="mt-5 flex gap-2">
              <div className="bg-ink-light/10 h-6 w-16 rounded-full" />
              <div className="bg-ink-light/10 h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ActionErrorProps {
  title?: string
  message?: string
  detail?: string
  onRetry?: () => void
  retryLabel?: string
  settingsHref?: '/settings' | '/settings/api-keys'
}

export function ActionError({
  title = '这一步暂时没接上',
  message = '可能是网络、登录状态或 AI Key 配置出了问题。可以先重试；如果连续失败，去设置里检查 API Key。',
  detail,
  onRetry,
  retryLabel = '再试一次',
  settingsHref = '/settings/api-keys',
}: ActionErrorProps) {
  const [copied, setCopied] = useState(false)
  const diagnostic = [message, detail].filter(Boolean).join('\n')

  async function copyDiagnostic() {
    if (!diagnostic || !navigator.clipboard) return
    await navigator.clipboard.writeText(diagnostic)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="border-cinnabar/25 bg-cinnabar/5 mx-auto max-w-xl rounded-sm border p-6 text-center">
      <h2 className="font-serif-cn text-ink-heavy text-lg">{title}</h2>
      <p className="text-ink-medium mt-3 text-sm leading-relaxed">{message}</p>
      {detail && (
        <details className="text-ink-light mt-4 text-left text-xs">
          <summary className="cursor-pointer text-center">查看诊断信息</summary>
          <pre className="bg-paper-aged/60 mt-2 max-h-32 overflow-auto rounded p-3 whitespace-pre-wrap">
            {detail}
          </pre>
        </details>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="bg-ink-heavy hover:bg-ink-medium rounded-sm px-4 py-2 text-sm text-[color:var(--paper-rice)] transition"
          >
            {retryLabel}
          </button>
        )}
        <Link
          href={settingsHref}
          className="border-ink-light/40 text-ink-medium hover:border-ink-heavy hover:text-ink-heavy rounded-sm border px-4 py-2 text-sm transition"
        >
          检查 API Key
        </Link>
        {detail && (
          <button
            type="button"
            onClick={copyDiagnostic}
            className="text-ink-light hover:text-ink-heavy text-sm transition"
          >
            {copied ? '已复制' : '复制诊断'}
          </button>
        )}
      </div>
    </div>
  )
}
