'use client'

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
          {error.message || '未知错误'}
        </p>
        {error.digest && (
          <p style={{ color: '#8B8880', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            digest: {error.digest}
          </p>
        )}
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
      </body>
    </html>
  )
}
