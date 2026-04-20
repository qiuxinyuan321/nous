'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { InkStroke } from '@/components/ink/InkStroke'
import { useIdeas } from '@/lib/hooks/useIdeas'
import { cn } from '@/lib/utils'

interface NotionStatus {
  connected: boolean
  databaseId?: string
  lastSyncedAt?: string | null
}

async function fetchNotionStatus(): Promise<NotionStatus> {
  const res = await fetch('/api/sync/notion/connection')
  if (!res.ok) return { connected: false }
  return (await res.json()) as NotionStatus
}

export function SyncView() {
  const t = useTranslations('sync')
  const tCommon = useTranslations('common')
  const qc = useQueryClient()
  const { data: status } = useQuery({ queryKey: ['notion-status'], queryFn: fetchNotionStatus })

  const [token, setToken] = useState('')
  const [databaseId, setDatabaseId] = useState('')
  const [notionBusy, setNotionBusy] = useState(false)
  const [notionMessage, setNotionMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null,
  )

  async function connect(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim() || !databaseId.trim() || notionBusy) return
    setNotionBusy(true)
    setNotionMessage(null)
    try {
      const res = await fetch('/api/sync/notion/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), databaseId: databaseId.trim() }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        testOk?: boolean
        testError?: string
        error?: string
      }
      if (!res.ok || !data.ok) {
        setNotionMessage({ kind: 'err', text: data.error ?? `HTTP ${res.status}` })
      } else if (data.testOk === false) {
        setNotionMessage({
          kind: 'err',
          text: t('notion.savedButUnreachable', { error: data.testError ?? '' }),
        })
      } else {
        setNotionMessage({ kind: 'ok', text: t('notion.connected') })
        setToken('')
      }
      qc.invalidateQueries({ queryKey: ['notion-status'] })
    } catch (err) {
      setNotionMessage({ kind: 'err', text: (err as Error).message })
    } finally {
      setNotionBusy(false)
    }
  }

  async function disconnect() {
    if (!confirm(t('notion.disconnectConfirm'))) return
    await fetch('/api/sync/notion/connection', { method: 'DELETE' })
    qc.invalidateQueries({ queryKey: ['notion-status'] })
    setNotionMessage(null)
  }

  return (
    <div className="space-y-14">
      {/* 标题 */}
      <div>
        <h1 className="font-serif-cn text-ink-heavy text-3xl">{t('title')}</h1>
        <div className="mt-3 w-16 opacity-70">
          <InkStroke variant="thin" />
        </div>
        <p className="text-ink-medium mt-4 max-w-2xl text-sm leading-relaxed">{t('intro')}</p>
      </div>

      {/* Obsidian */}
      <section className="space-y-5">
        <div>
          <h2 className="font-serif-cn text-ink-heavy text-xl">{t('obsidian.title')}</h2>
          <p className="text-ink-medium mt-2 max-w-2xl text-sm leading-relaxed">
            {t('obsidian.desc')}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ObsidianExportCard label={t('obsidian.exportBtn')} hint={t('obsidian.exportHint')} />
          <ObsidianImportCard
            label={t('obsidian.importBtn')}
            hint={t('obsidian.importHint')}
            successTpl={t('obsidian.importDone')}
            errorLabel={tCommon('error')}
          />
        </div>
      </section>

      {/* Notion */}
      <section className="space-y-5">
        <div>
          <h2 className="font-serif-cn text-ink-heavy text-xl">{t('notion.title')}</h2>
          <p className="text-ink-medium mt-2 max-w-2xl text-sm leading-relaxed">
            {t('notion.desc')}
          </p>
        </div>

        <div className="border-ink-light/25 bg-paper-aged/30 rounded-md border p-5">
          {status?.connected ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-ink-heavy font-serif-cn text-sm">
                    <span className="bg-celadon mr-2 inline-block h-2 w-2 rounded-full align-middle" />
                    {t('notion.connectedTo')}{' '}
                    <code className="bg-ink-heavy/5 rounded px-1.5 py-0.5 text-xs">
                      {status.databaseId}
                    </code>
                  </p>
                  {status.lastSyncedAt && (
                    <p className="text-ink-light mt-1 text-xs">
                      {t('notion.lastPushed', {
                        at: new Date(status.lastSyncedAt).toLocaleString(),
                      })}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={disconnect}
                  className="text-ink-light hover:text-cinnabar text-xs transition"
                >
                  {t('notion.disconnect')}
                </button>
              </div>

              <NotionPushForm label={t('notion.pushSelected')} />
            </div>
          ) : (
            <form onSubmit={connect} className="space-y-3">
              <div>
                <label className="text-ink-medium mb-1 block text-xs">
                  {t('notion.tokenLabel')}
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="secret_xxxxxxxxxxxxxxxxxxxx"
                  className="border-ink-light/40 bg-paper-rice/60 text-ink-heavy focus:border-ink-heavy/60 w-full rounded border px-3 py-2 font-mono text-xs outline-none"
                />
                <p className="text-ink-light mt-1 text-[11px]">{t('notion.tokenHint')}</p>
              </div>
              <div>
                <label className="text-ink-medium mb-1 block text-xs">
                  {t('notion.databaseLabel')}
                </label>
                <input
                  value={databaseId}
                  onChange={(e) => setDatabaseId(e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="border-ink-light/40 bg-paper-rice/60 text-ink-heavy focus:border-ink-heavy/60 w-full rounded border px-3 py-2 font-mono text-xs outline-none"
                />
                <p className="text-ink-light mt-1 text-[11px] whitespace-pre-line">
                  {t('notion.databaseHint')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!token.trim() || !databaseId.trim() || notionBusy}
                  className="bg-ink-heavy hover:bg-ink-medium rounded px-4 py-1.5 text-xs text-[color:var(--paper-rice)] transition disabled:opacity-40"
                >
                  {notionBusy ? '…' : t('notion.connect')}
                </button>
                {notionMessage && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      'text-xs',
                      notionMessage.kind === 'ok' ? 'text-celadon' : 'text-cinnabar',
                    )}
                  >
                    {notionMessage.text}
                  </motion.span>
                )}
              </div>
            </form>
          )}
        </div>

        <details className="border-ink-light/25 rounded-md border p-4 text-xs">
          <summary className="font-serif-cn text-ink-medium cursor-pointer">
            {t('notion.schemaTitle')}
          </summary>
          <pre className="text-ink-medium mt-3 leading-relaxed whitespace-pre-wrap">
            {`Name (title)
Status (select)
Tags (multi_select)
Goal (rich_text)
First Action (rich_text)
Created (date)
Source (url)`}
          </pre>
          <p className="text-ink-light mt-2 leading-relaxed">{t('notion.schemaHint')}</p>
        </details>
      </section>
    </div>
  )
}

function ObsidianExportCard({ label, hint }: { label: string; hint: string }) {
  return (
    <a
      href="/api/sync/obsidian/export"
      download
      className="border-ink-light/30 hover:border-ink-heavy/60 group flex flex-col gap-2 rounded-md border p-5 transition"
    >
      <span className="font-serif-cn text-ink-heavy flex items-center gap-2 text-sm">
        <span className="bg-ink-heavy text-paper-rice inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px]">
          ↓
        </span>
        {label}
      </span>
      <span className="text-ink-light text-xs leading-relaxed">{hint}</span>
    </a>
  )
}

function ObsidianImportCard({
  label,
  hint,
  successTpl,
  errorLabel,
}: {
  label: string
  hint: string
  successTpl: string
  errorLabel: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setBusy(true)
    setMsg(null)
    try {
      const form = new FormData()
      for (let i = 0; i < files.length; i++) form.append('files', files[i])
      const res = await fetch('/api/sync/obsidian/import', { method: 'POST', body: form })
      const data = (await res.json()) as {
        created?: number
        skipped?: number
        errors?: string[]
        error?: string
      }
      if (!res.ok) {
        setMsg(`${errorLabel}: ${data.error ?? `HTTP ${res.status}`}`)
      } else {
        setMsg(
          successTpl
            .replace('{created}', String(data.created ?? 0))
            .replace('{skipped}', String(data.skipped ?? 0)) +
            (data.errors && data.errors.length > 0 ? ` (+${data.errors.length} err)` : ''),
        )
      }
    } catch (err) {
      setMsg(`${errorLabel}: ${(err as Error).message}`)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <label
      className={cn(
        'border-ink-light/30 hover:border-ink-heavy/60 group flex cursor-pointer flex-col gap-2 rounded-md border p-5 transition',
        busy && 'opacity-60',
      )}
    >
      <span className="font-serif-cn text-ink-heavy flex items-center gap-2 text-sm">
        <span className="border-ink-heavy inline-flex h-6 w-6 items-center justify-center rounded-full border text-[10px]">
          ↑
        </span>
        {busy ? '…' : label}
      </span>
      <span className="text-ink-light text-xs leading-relaxed">{hint}</span>
      <input
        ref={fileRef}
        type="file"
        accept=".md,text/markdown"
        multiple
        onChange={onPick}
        className="hidden"
        disabled={busy}
      />
      {msg && <span className="text-ink-medium mt-1 text-[11px]">{msg}</span>}
    </label>
  )
}

function NotionPushForm({ label }: { label: string }) {
  const t = useTranslations('sync')
  const { data: ideas, isLoading } = useIdeas()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function push() {
    if (selected.size === 0 || busy) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/sync/notion/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaIds: [...selected] }),
      })
      const data = (await res.json()) as {
        ok?: number
        failed?: number
        total?: number
        error?: string
      }
      if (!res.ok) {
        setMsg(data.error ?? `HTTP ${res.status}`)
      } else {
        setMsg(t('notion.pushResult', { ok: data.ok ?? 0, failed: data.failed ?? 0 }))
        if ((data.failed ?? 0) === 0) setSelected(new Set())
      }
    } catch (err) {
      setMsg((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (isLoading) return <p className="text-ink-light text-xs">…</p>
  if (!ideas || ideas.length === 0)
    return <p className="text-ink-light text-xs">{t('notion.noIdeas')}</p>

  return (
    <div className="border-ink-light/20 mt-3 rounded-sm border-t pt-4">
      <div className="max-h-60 overflow-y-auto pr-1">
        <ul className="space-y-1.5">
          {ideas.slice(0, 50).map((idea) => (
            <li key={idea.id}>
              <label className="hover:bg-ink-heavy/5 flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-xs transition">
                <input
                  type="checkbox"
                  checked={selected.has(idea.id)}
                  onChange={() => toggle(idea.id)}
                  className="accent-ink-heavy mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="text-ink-heavy block truncate">
                    {idea.title ?? idea.rawContent.slice(0, 40)}
                  </span>
                  <span className="text-ink-light">{idea.status}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={push}
          disabled={selected.size === 0 || busy}
          className="bg-ink-heavy hover:bg-ink-medium rounded px-3 py-1 text-xs text-[color:var(--paper-rice)] transition disabled:opacity-40"
        >
          {busy ? '…' : `${label} (${selected.size})`}
        </button>
        {msg && <span className="text-ink-medium text-xs">{msg}</span>}
      </div>
    </div>
  )
}
