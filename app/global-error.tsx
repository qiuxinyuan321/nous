'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * Root-level error boundary (Next.js 16 要求).
 * 只在 app/layout.tsx 本身抛错或嵌套 error.tsx 未捕获时兜底。
 * 必须自己写 <html>/<body>（替代根 layout）。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [copied, setCopied] = useState(false)

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
    <html lang="zh-CN">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#FAF7EF',
          color: '#1C1B19',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 500 }}>出了点意外</h1>
        <p
          style={{ color: '#4A4842', fontSize: '0.875rem', maxWidth: '32rem', textAlign: 'center' }}
        >
          页面启动时没有顺利接上。先重试一次；如果仍失败，请检查环境变量、数据库连接或 API Key
          配置。
        </p>
        {error.digest && (
          <p style={{ color: '#8B8880', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            诊断编号：{error.digest}
          </p>
        )}
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}
        >
          <button
            onClick={reset}
            style={{
              background: '#1C1B19',
              color: '#FAF7EF',
              padding: '0.5rem 1rem',
              borderRadius: '2px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            再试一次
          </button>
          <Link
            href="/zh-CN/settings/api-keys"
            style={{
              color: '#1C1B19',
              padding: '0.5rem 1rem',
              borderRadius: '2px',
              border: '1px solid #8B8880',
              textDecoration: 'none',
            }}
          >
            检查 API Key
          </Link>
          <button
            onClick={copyDiagnostic}
            style={{
              background: 'transparent',
              color: '#4A4842',
              padding: '0.5rem 0.25rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {copied ? '已复制' : '复制诊断'}
          </button>
        </div>
      </body>
    </html>
  )
}
