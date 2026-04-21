'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'

export function LoginForm({
  callbackUrl,
  hasGitHub,
}: {
  callbackUrl?: string
  hasGitHub: boolean
}) {
  const t = useTranslations()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginPending, setLoginPending] = useState(false)
  const [regError, setRegError] = useState<string | null>(null)
  const [regPending, setRegPending] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoginError(null)
    setLoginPending(true)

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setLoginError('邮箱或密码错误')
        setLoginPending(false)
        return
      }

      window.location.href = callbackUrl || '/inbox'
    } catch {
      setLoginError('登录失败，请重试')
      setLoginPending(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setRegError(null)
    setRegPending(true)

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string
    const name = form.get('name') as string

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRegError(data.error || '注册失败')
        setRegPending(false)
        return
      }
      // 注册成功，自动切换到登录
      setMode('login')
      setRegError(null)
    } catch {
      setRegError('网络错误，请重试')
    }
    setRegPending(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-serif-cn text-ink-heavy text-center text-3xl">
        {mode === 'login' ? '登录' : '注册'}
      </h2>
      <p className="text-ink-light text-center text-sm">
        {mode === 'login' ? '输入邮箱和密码登录' : '创建一个新账号'}
      </p>

      {mode === 'login' ? (
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <label className="text-ink-medium text-sm" htmlFor="pw-email">
            邮箱
          </label>
          <input
            id="pw-email"
            type="email"
            name="email"
            required
            placeholder="you@domain.com"
            autoComplete="email"
            className="border-ink-light/50 bg-paper-rice/60 text-ink-heavy focus:border-ink-heavy rounded-sm border px-4 py-3 transition outline-none placeholder:text-[color:var(--ink-light)]"
          />
          <label className="text-ink-medium text-sm" htmlFor="pw-password">
            密码
          </label>
          <input
            id="pw-password"
            type="password"
            name="password"
            required
            placeholder="输入密码"
            autoComplete="current-password"
            className="border-ink-light/50 bg-paper-rice/60 text-ink-heavy focus:border-ink-heavy rounded-sm border px-4 py-3 transition outline-none placeholder:text-[color:var(--ink-light)]"
          />
          <button
            type="submit"
            disabled={loginPending}
            className="bg-ink-heavy hover:bg-ink-medium mt-2 rounded-sm px-4 py-3 text-[color:var(--paper-rice)] transition disabled:opacity-50"
          >
            {loginPending ? '落笔中…' : '登录'}
          </button>
          {loginError && <p className="text-cinnabar text-center text-sm">{loginError}</p>}
        </form>
      ) : (
        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          <label className="text-ink-medium text-sm" htmlFor="reg-name">
            昵称
          </label>
          <input
            id="reg-name"
            type="text"
            name="name"
            placeholder="你的名字（可选）"
            autoComplete="name"
            className="border-ink-light/50 bg-paper-rice/60 text-ink-heavy focus:border-ink-heavy rounded-sm border px-4 py-3 transition outline-none placeholder:text-[color:var(--ink-light)]"
          />
          <label className="text-ink-medium text-sm" htmlFor="reg-email">
            邮箱
          </label>
          <input
            id="reg-email"
            type="email"
            name="email"
            required
            placeholder="you@domain.com"
            autoComplete="email"
            className="border-ink-light/50 bg-paper-rice/60 text-ink-heavy focus:border-ink-heavy rounded-sm border px-4 py-3 transition outline-none placeholder:text-[color:var(--ink-light)]"
          />
          <label className="text-ink-medium text-sm" htmlFor="reg-password">
            密码
          </label>
          <input
            id="reg-password"
            type="password"
            name="password"
            required
            minLength={6}
            placeholder="至少 6 位"
            autoComplete="new-password"
            className="border-ink-light/50 bg-paper-rice/60 text-ink-heavy focus:border-ink-heavy rounded-sm border px-4 py-3 transition outline-none placeholder:text-[color:var(--ink-light)]"
          />
          <button
            type="submit"
            disabled={regPending}
            className="bg-ink-heavy hover:bg-ink-medium mt-2 rounded-sm px-4 py-3 text-[color:var(--paper-rice)] transition disabled:opacity-50"
          >
            {regPending ? '注册中…' : '注册'}
          </button>
          {regError && <p className="text-cinnabar text-center text-sm">{regError}</p>}
        </form>
      )}

      {/* 切换登录/注册 */}
      <p className="text-ink-light text-center text-sm">
        {mode === 'login' ? (
          <>
            还没有账号？{' '}
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setRegError(null)
              }}
              className="text-ink-heavy hover:text-ink-medium underline underline-offset-2 transition"
            >
              注册
            </button>
          </>
        ) : (
          <>
            已有账号？{' '}
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-ink-heavy hover:text-ink-medium underline underline-offset-2 transition"
            >
              登录
            </button>
          </>
        )}
      </p>

      {hasGitHub && (
        <>
          <div className="flex items-center gap-3">
            <div className="bg-ink-light/30 h-px flex-1" />
            <span className="text-ink-light text-xs tracking-widest uppercase">or</span>
            <div className="bg-ink-light/30 h-px flex-1" />
          </div>
          <form action={`/api/auth/signin/github`} method="POST">
            <input type="hidden" name="callbackUrl" value={callbackUrl || '/inbox'} />
            <button
              type="submit"
              className="border-ink-light/50 text-ink-medium hover:border-ink-heavy hover:text-ink-heavy w-full rounded-sm border px-4 py-3 text-sm transition"
            >
              {t('auth.continueWithGithub')}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
