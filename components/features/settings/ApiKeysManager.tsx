'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PROVIDER_PRESETS, findPreset } from '@/lib/ai/presets'

export interface ApiKeyRow {
  id: string
  provider: string
  label: string | null
  baseUrl: string | null
  model: string
  isDefault: boolean
  createdAt: string
}

interface Props {
  initial: ApiKeyRow[]
}

export function ApiKeysManager({ initial }: Props) {
  const [list, setList] = useState<ApiKeyRow[]>(initial)
  const [showForm, setShowForm] = useState(initial.length === 0)

  const refresh = async () => {
    const res = await fetch('/api/settings/api-keys')
    if (!res.ok) return
    const data = (await res.json()) as { list: ApiKeyRow[] }
    setList(data.list)
  }

  return (
    <div className="space-y-8">
      {list.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif-cn text-ink-heavy text-lg">已配置</h2>
            <button
              onClick={() => setShowForm((s) => !s)}
              className="text-ink-medium hover:text-ink-heavy text-xs transition"
            >
              {showForm ? '收起' : '+ 添加'}
            </button>
          </div>
          <ul className="space-y-3">
            {list.map((item) => (
              <KeyRow key={item.id} item={item} onChanged={refresh} />
            ))}
          </ul>
        </section>
      )}

      {(showForm || list.length === 0) && (
        <KeyForm
          onDone={() => {
            setShowForm(false)
            refresh()
          }}
        />
      )}

      {list.length === 0 && <HintEmpty />}
    </div>
  )
}

function KeyRow({ item, onChanged }: { item: ApiKeyRow; onChanged: () => Promise<void> }) {
  const [isPending, startTransition] = useTransition()

  const onToggleDefault = () => {
    if (item.isDefault) return
    startTransition(async () => {
      await fetch(`/api/settings/api-keys/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })
      await onChanged()
    })
  }

  const onDelete = () => {
    if (!confirm('删除这个 API Key?')) return
    startTransition(async () => {
      await fetch(`/api/settings/api-keys/${item.id}`, { method: 'DELETE' })
      await onChanged()
    })
  }

  const preset = findPreset(item.provider)

  return (
    <li
      className={`rounded-sm border p-4 transition ${
        item.isDefault
          ? 'border-cinnabar/40 bg-cinnabar/5'
          : 'border-ink-light/30 bg-paper-aged/30 hover:border-ink-heavy/40'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-serif-cn text-ink-heavy text-sm font-medium">
              {item.label || preset?.label || item.provider}
            </span>
            {item.isDefault && (
              <span className="text-cinnabar font-mono text-[10px] tracking-widest uppercase">
                · Default
              </span>
            )}
          </div>
          <p className="text-ink-medium mt-1 font-mono text-xs">{item.model}</p>
          {item.baseUrl && (
            <p className="text-ink-light mt-1 font-mono text-[11px] break-all">{item.baseUrl}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {!item.isDefault && (
            <button
              onClick={onToggleDefault}
              disabled={isPending}
              className="border-ink-light/40 text-ink-medium hover:border-ink-heavy/60 hover:text-ink-heavy rounded-sm border px-3 py-1 text-[11px] transition disabled:opacity-50"
            >
              设为默认
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={isPending}
            className="text-ink-light hover:text-cinnabar text-[11px] transition disabled:opacity-50"
          >
            删除
          </button>
        </div>
      </div>
    </li>
  )
}

function KeyForm({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const [providerId, setProviderId] = useState<string>('openai')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [label, setLabel] = useState('')
  const [makeDefault, setMakeDefault] = useState(true)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, startSaving] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const preset = findPreset(providerId)

  const onPresetChange = (id: string) => {
    setProviderId(id)
    const p = findPreset(id)
    setBaseUrl(p?.defaultBaseUrl ?? '')
    setModel(p?.defaultModel ?? '')
    setTestResult(null)
  }

  const onTest = async () => {
    setTestResult(null)
    setIsTesting(true)
    try {
      const res = await fetch('/api/settings/api-keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          baseUrl: baseUrl || undefined,
          apiKey,
          model,
        }),
      })
      const data = (await res.json()) as { ok: boolean; message?: string; status?: number }
      setTestResult({
        ok: data.ok,
        msg: data.ok ? '✓ 已连通' : (data.message ?? `HTTP ${data.status ?? ''}`).slice(0, 200),
      })
    } catch (e) {
      setTestResult({ ok: false, msg: (e as Error).message })
    } finally {
      setIsTesting(false)
    }
  }

  const onSave = () => {
    setError(null)
    startSaving(async () => {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          label: label || undefined,
          baseUrl: baseUrl || undefined,
          apiKey,
          model,
          isDefault: makeDefault,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        message?: string
      }
      if (!res.ok || !data.ok) {
        setError(data.message ?? data.error ?? `HTTP ${res.status}`)
        return
      }
      // 重置
      setApiKey('')
      setLabel('')
      setTestResult(null)
      router.refresh()
      onDone()
    })
  }

  return (
    <section className="border-ink-light/30 bg-paper-aged/30 rounded-sm border p-5">
      <h2 className="font-serif-cn text-ink-heavy mb-5 text-lg">添加 API Key</h2>

      <div className="space-y-4">
        <Field label="提供商">
          <div className="grid grid-cols-3 gap-2">
            {PROVIDER_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPresetChange(p.id)}
                className={`rounded-sm border px-3 py-2 text-xs transition ${
                  providerId === p.id
                    ? 'border-ink-heavy text-ink-heavy bg-ink-heavy/5'
                    : 'border-ink-light/30 text-ink-medium hover:border-ink-heavy/40'
                }`}
              >
                <div className="font-serif-cn font-medium">{p.label}</div>
                <div className="text-ink-light mt-0.5 text-[10px]">{p.description}</div>
              </button>
            ))}
          </div>
        </Field>

        {preset?.getKeyUrl && (
          <p className="text-ink-light text-xs">
            去{' '}
            <a
              href={preset.getKeyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-stone underline"
            >
              {preset.label} 控制台
            </a>{' '}
            获取 Key
          </p>
        )}

        <Field label="API Key">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value)
              setTestResult(null)
            }}
            placeholder={preset?.keyPrefix ? `${preset.keyPrefix}...` : 'sk-...'}
            className="border-ink-light/40 focus:border-ink-heavy bg-paper-rice/70 w-full rounded-sm border px-3 py-2 font-mono text-sm transition outline-none"
          />
        </Field>

        <Field label="Base URL">
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={preset?.defaultBaseUrl || 'https://api.example.com/v1'}
            className="border-ink-light/40 focus:border-ink-heavy bg-paper-rice/70 w-full rounded-sm border px-3 py-2 font-mono text-sm transition outline-none"
          />
          {preset?.defaultBaseUrl && (
            <p className="text-ink-light mt-1 text-[11px]">留空使用默认 {preset.defaultBaseUrl}</p>
          )}
        </Field>

        <Field label="模型">
          {preset && preset.modelOptions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {preset.modelOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModel(m)}
                  className={`rounded-sm border px-3 py-1 font-mono text-xs transition ${
                    model === m
                      ? 'border-ink-heavy text-ink-heavy bg-ink-heavy/5'
                      : 'border-ink-light/30 text-ink-medium hover:border-ink-heavy/40'
                  }`}
                >
                  {m}
                </button>
              ))}
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="自定义"
                className="border-ink-light/40 focus:border-ink-heavy bg-paper-rice/70 flex-1 rounded-sm border px-3 py-1 font-mono text-xs transition outline-none"
              />
            </div>
          ) : (
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-mini"
              className="border-ink-light/40 focus:border-ink-heavy bg-paper-rice/70 w-full rounded-sm border px-3 py-2 font-mono text-sm transition outline-none"
            />
          )}
        </Field>

        <Field label="备注（可选）">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="我的个人 OpenAI Key"
            className="border-ink-light/40 focus:border-ink-heavy bg-paper-rice/70 w-full rounded-sm border px-3 py-2 text-sm transition outline-none"
          />
        </Field>

        <label className="text-ink-medium flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={makeDefault}
            onChange={(e) => setMakeDefault(e.target.checked)}
            className="accent-cinnabar"
          />
          设为默认（Nous 所有 AI 调用将使用此 Key）
        </label>

        {testResult && (
          <p className={`text-xs ${testResult.ok ? 'text-celadon' : 'text-cinnabar'}`}>
            {testResult.msg}
          </p>
        )}

        {error && <p className="text-cinnabar text-xs">错误：{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onTest}
            disabled={isTesting || !apiKey || !model}
            className="border-ink-heavy/40 text-ink-heavy hover:bg-ink-heavy/5 rounded-sm border px-4 py-2 text-sm transition disabled:opacity-50"
          >
            {isTesting ? '测试中…' : '测试连通'}
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || !apiKey || !model}
            className="bg-ink-heavy hover:bg-ink-heavy/90 text-paper-rice rounded-sm px-5 py-2 text-sm transition disabled:opacity-60"
          >
            {isSaving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-ink-light mb-1.5 block text-xs tracking-wider uppercase">
        {label}
      </label>
      {children}
    </div>
  )
}

function HintEmpty() {
  return (
    <p className="text-ink-light border-ink-light/30 bg-paper-aged/30 rounded-sm border border-dashed p-4 text-xs leading-relaxed">
      配置自己的 API Key 后，所有 AI 调用将使用你的 Key 和账单， 不再受每日 Demo 额度限制。Key 使用
      AES-256-GCM 加密存储在服务器数据库中。
    </p>
  )
}
