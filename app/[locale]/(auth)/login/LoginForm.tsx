'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { sendMagicLink, signInWithPassword } from './actions'
import type { LoginActionState } from './actions'

const initial: LoginActionState = { ok: false, error: null }

export function LoginForm({
  callbackUrl,
  hasGitHub,
  hasPassword,
}: {
  callbackUrl?: string
  hasGitHub: boolean
  hasPassword: boolean
}) {
  const t = useTranslations()
  const [magicState, magicAction] = useActionState(sendMagicLink, initial)
  const [pwState, pwAction] = useActionState(signInWithPassword, initial)

  return (
    <div className="flex flex-col gap-6">
      {/* 密码登录（优先） */}
      {hasPassword && (
        <form action={pwAction} className="flex flex-col gap-3">
          <label className="text-ink-medium text-sm" htmlFor="pw-email">
            {t('auth.email')}
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
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? ''} />
          <SubmitButton label="登录" />
          {pwState.error && <p className="text-cinnabar text-center text-sm">{pwState.error}</p>}
        </form>
      )}

      {/* Magic Link */}
      {!hasPassword && (
        <form action={magicAction} className="flex flex-col gap-3">
          <label className="text-ink-medium text-sm" htmlFor="email">
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            placeholder="you@domain.com"
            autoComplete="email"
            className="border-ink-light/50 bg-paper-rice/60 text-ink-heavy focus:border-ink-heavy rounded-sm border px-4 py-3 transition outline-none placeholder:text-[color:var(--ink-light)]"
          />
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? ''} />
          <SubmitButton label={t('auth.magicLink')} />
          {magicState.error && <p className="text-cinnabar text-center text-sm">{magicState.error}</p>}
        </form>
      )}

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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-ink-heavy hover:bg-ink-medium mt-2 rounded-sm px-4 py-3 text-[color:var(--paper-rice)] transition disabled:opacity-50"
    >
      {pending ? '落笔中…' : label}
    </button>
  )
}
