import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '离线 · Offline · Nous',
  robots: { index: false },
}

/**
 * PWA 离线兜底。
 * 放在根路径(不进 [locale]/),避免被 next-intl 302 到 /{locale}/offline,
 * 让 Service Worker 能稳定 precache。
 * 纯静态,无 i18n / auth 依赖。
 */
export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        lineHeight: 1.55,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 84,
          height: 84,
          borderRadius: 4,
          background: '#B8372F',
          color: '#FAF7EF',
          fontSize: 34,
          fontWeight: 500,
          transform: 'rotate(-6deg)',
          boxShadow: '0 6px 20px -8px rgba(28,27,25,0.35)',
        }}
      >
        候
      </span>

      <h1 style={{ marginTop: '2.25rem', fontSize: '1.75rem', fontWeight: 500 }}>此刻无法抵达</h1>
      <p style={{ marginTop: '0.35rem', fontSize: '1rem', color: '#4A4842' }}>
        You&rsquo;re offline
      </p>

      <svg
        viewBox="0 0 400 10"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ width: 80, height: 10, marginTop: '1.25rem', opacity: 0.6 }}
      >
        <path
          d="M0 5 Q 100 2, 200 5 T 400 5"
          stroke="#1C1B19"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      <p style={{ marginTop: '1.5rem', maxWidth: 440, color: '#4A4842', fontSize: '0.95rem' }}>
        网络暂时离开了。已打开过的页面仍可读，写下的想法会在重新上线后同步。
        <br />
        <span style={{ color: '#8B8880' }}>
          The network has stepped away. Cached pages still load; any thought you capture will sync
          once you&rsquo;re back.
        </span>
      </p>

      {/* offline 场景下 Next Link 的 client 导航不可用,必须硬刷新重连网络 */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/"
        style={{
          marginTop: '2rem',
          padding: '0.7rem 1.4rem',
          border: '1px solid #8B8880',
          borderRadius: 6,
          color: '#1C1B19',
          textDecoration: 'none',
          fontSize: '0.875rem',
        }}
      >
        再试一次 · Retry
      </a>

      <p
        style={{
          marginTop: '2.75rem',
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#8B8880',
        }}
      >
        Nous · Offline
      </p>
    </main>
  )
}
