'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { ChatMessage, Phase } from '@/lib/ai/types'
import { useNousChat } from '@/lib/hooks/useNousChat'
import { generatePlanAction } from '@/app/[locale]/(app)/refine/[id]/actions'
import { useRouter } from 'next/navigation'
import { isValidPersonaId, PERSONAS, type PersonaId } from '@/lib/proactive/personas'
import { writePersonaIdToStorage } from '@/lib/proactive/persona-client'
import { PersonaAvatar } from '@/components/proactive/PersonaAvatar'
import { MessageBubble } from './MessageBubble'
import { PhaseIndicator } from './PhaseIndicator'
import { QuotaBanner } from './QuotaBanner'

interface RefineViewProps {
  ideaId: string
  ideaTitle: string
  ideaContent: string
  initialMessages: ChatMessage[]
  initialPhase: Phase
  locale: 'zh-CN' | 'en-US'
  hasPlan: boolean
}

/**
 * 按阶段生成输入框 placeholder · 对新用户提供方向感
 * 而不是笼统的"回应一句…"
 */
function placeholderFor(phase: Phase, streaming: boolean, locale: 'zh-CN' | 'en-US'): string {
  if (streaming) return locale === 'en-US' ? 'Thinking…' : '思索中…'
  if (locale === 'en-US') {
    switch (phase) {
      case 'intent':
        return 'What do you most want to nail down first? (Enter to send, Shift+Enter for newline)'
      case 'detail':
        return 'A concrete scenario, or the thing you worry about most…'
      case 'boundary':
        return 'What should we explicitly NOT cover right now?'
      case 'ready':
        return 'Ready for a plan — or add one more detail…'
    }
  }
  switch (phase) {
    case 'intent':
      return '先说说你最想先确定的那一步…（Enter 送出，Shift+Enter 换行）'
    case 'detail':
      return '补充一个具体场景 · 或你最担心的一点…'
    case 'boundary':
      return '哪些情况先不考虑 · 哪些是底线…'
    case 'ready':
      return '准备生成方案了 · 也可以再补一句再生成…'
  }
}

/**
 * 空对话时的"起手句"建议 · 按阶段（刚进时始终是 intent 阶段）
 * 点击即填入输入框 · 降低新用户首次对话的心理门槛
 */
const STARTER_PROMPTS_ZH = [
  '我想从最小可行的一步开始，先确定：',
  '我现在最不确定的是',
  '成功的标志对我来说是',
] as const

const STARTER_PROMPTS_EN = [
  'Start with the smallest viable step — first confirm:',
  'The thing I am least sure about is',
  'Success for me would look like',
] as const

const ERROR_LABEL: Record<string, string> = {
  QUOTA_EXCEEDED: '今日体验额度已用完。可配置自己的 API Key 继续。',
  RATE_LIMITED: '请求过于频繁，稍后再试。',
  PROVIDER_UNAVAILABLE: 'AI 服务当前不可用。请配置 BYOK 或联系管理员。',
  UNAUTHORIZED: '登录态已失效，请重新登录。',
  NOT_FOUND: '想法不存在或已被删除。',
  AI_EMPTY_RESPONSE:
    '模型没返回内容。常见原因：Key 对该模型无权限 / 模型名拼写错误 / 网关超时。查 pnpm dev 终端看具体原因。',
  AI_GENERATION_FAILED: 'AI 生成方案失败。稍后再试或查看终端日志。',
  PERSIST_FAILED: '保存方案到数据库失败。',
}

export function RefineView({
  ideaId,
  ideaTitle,
  ideaContent,
  initialMessages,
  initialPhase,
  locale,
  hasPlan,
}: RefineViewProps) {
  const t = useTranslations('refine')
  const [input, setInput] = useState('')
  const [planError, setPlanError] = useState<string | null>(null)
  const [isPlanning, startPlanning] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  const router = useRouter()

  // per-idea persona：优先从历史 assistant 消息推断 · 否则默认 Nous（auto）
  // 不再从全局 localStorage 初始化 · 避免"别的 idea 选的 persona 污染当前新对话"
  const inferredInitialPersona = useMemo<PersonaId>(() => {
    for (let i = initialMessages.length - 1; i >= 0; i--) {
      const m = initialMessages[i]
      if (m.role === 'assistant' && isValidPersonaId(m.personaId)) {
        return m.personaId as PersonaId
      }
    }
    return 'auto'
  }, [initialMessages])

  const [personaId, setPersonaId] = useState<PersonaId>(inferredInitialPersona)
  const currentPersona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0]
  const [personaOpen, setPersonaOpen] = useState(false)

  // 切 persona 时 · 当前 session 立即生效 + 同步到 localStorage
  // （让 workspace greeting / proactive prompts 等全局 UI 跟随最新偏好）
  function handlePickPersona(id: PersonaId) {
    setPersonaId(id)
    writePersonaIdToStorage(id)
    setPersonaOpen(false)
  }

  const { messages, streaming, status, error, phase, send } = useNousChat({
    ideaId,
    initialMessages,
    initialPhase,
    locale,
    persona: personaId,
  })

  async function handleCreateNote() {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: ideaTitle || '无题', ideaId }),
      })
      if (!res.ok) return
      const note = await res.json()
      router.push(`/notes?id=${note.id}`)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, streaming, status])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = input.trim()
    if (!v) return
    setInput('')
    await send(v)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void onSubmit(e as unknown as React.FormEvent)
    }
  }

  function handleGeneratePlan() {
    setPlanError(null)
    startPlanning(async () => {
      const res = await generatePlanAction(ideaId, locale, personaId)
      if (res && !res.ok) {
        setPlanError(res.error)
      }
      // 成功时 action 已 redirect，不会走到这里
    })
  }

  const hasConversation = messages.length > 0 || streaming
  const userMsgCount = messages.filter((m) => m.role === 'user').length
  const canPlan = phase === 'ready' || hasPlan || userMsgCount >= 3
  const displayError = error ?? planError

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col px-6 py-10">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif-cn text-ink-heavy text-2xl">{ideaTitle || '无题'}</h1>
            <p className="text-ink-light mt-2 line-clamp-2 text-xs">{ideaContent}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setPersonaOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={personaOpen}
                title={`当前智者：${currentPersona.name}`}
                aria-label={`当前智者：${currentPersona.name} · 点击更换`}
                className="border-ink-light/40 text-ink-medium hover:border-ink-heavy hover:text-ink-heavy inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition"
              >
                <PersonaAvatar persona={currentPersona} size={18} />
                <span className="text-ink-heavy font-serif-cn">{currentPersona.name}</span>
              </button>
              {personaOpen && (
                <div
                  role="listbox"
                  className="border-ink-light/40 bg-paper-rice motion-safe:animate-dropIn absolute top-full right-0 z-20 mt-1 w-60 origin-top-right overflow-hidden rounded-md border shadow-lg"
                >
                  {PERSONAS.map((p) => {
                    const active = p.id === personaId
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => handlePickPersona(p.id as PersonaId)}
                        className={`flex w-full items-start gap-2 px-3 py-2 text-left text-xs transition ${
                          active
                            ? 'bg-paper-aged text-ink-heavy'
                            : 'text-ink-medium hover:bg-paper-aged/60'
                        }`}
                      >
                        <PersonaAvatar persona={p} size={20} className="mt-0.5 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="font-serif-cn text-ink-heavy block">{p.name}</span>
                          <span className="text-ink-light mt-0.5 block text-[10px] leading-snug">
                            {p.tagline}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <button
              onClick={handleCreateNote}
              className="border-ink-light/40 text-ink-medium hover:border-ink-heavy hover:text-ink-heavy rounded-md border px-3 py-1.5 text-xs transition"
            >
              📓 记笔记
            </button>
          </div>
        </div>
        <div className="mt-6">
          <PhaseIndicator phase={phase} />
        </div>
      </header>

      <QuotaBanner />

      <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto pb-6">
        {!hasConversation && (
          <div className="mx-auto max-w-md py-10 text-center">
            <p className="font-serif-cn text-ink-heavy text-[15px] leading-relaxed">
              {locale === 'en-US'
                ? 'I’ll ask in four phases: intent → detail → boundary → ready.'
                : '我会用四个阶段问：意图 → 细节 → 边界 → 就绪。'}
            </p>
            <p className="text-ink-light mt-2 text-[13px] leading-relaxed">
              {locale === 'en-US'
                ? 'Start with the part you feel most clear about — or pick one below.'
                : '先说你现在脑子里最清楚的部分 — 也可以挑一句开头。'}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {(locale === 'en-US' ? STARTER_PROMPTS_EN : STARTER_PROMPTS_ZH).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s + (s.endsWith('：') || s.endsWith(':') ? '' : ' '))}
                  className="border-ink-light/30 bg-paper-aged/40 text-ink-medium hover:border-ink-heavy hover:text-ink-heavy rounded-sm border px-4 py-2 text-left text-[13px] transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} personaId={m.personaId} />
        ))}
        {streaming && (
          <MessageBubble
            role="assistant"
            content={streaming}
            streaming
            personaId={personaId === 'auto' ? null : personaId}
          />
        )}
        {status === 'sending' && !streaming && (
          <div className="flex justify-start">
            <div className="border-ink-light/30 bg-paper-aged/60 flex items-center gap-1.5 rounded-sm border px-4 py-3">
              <span className="bg-ink-light/60 inline-block h-2 w-2 animate-bounce rounded-full [animation-delay:0ms]" />
              <span className="bg-ink-light/60 inline-block h-2 w-2 animate-bounce rounded-full [animation-delay:150ms]" />
              <span className="bg-ink-light/60 inline-block h-2 w-2 animate-bounce rounded-full [animation-delay:300ms]" />
              <span className="text-ink-light ml-2 text-xs">思索中…</span>
            </div>
          </div>
        )}
      </div>

      {displayError && (
        <p className="text-cinnabar mb-3 text-sm">
          {ERROR_LABEL[displayError] ?? `错误：${displayError}`}
        </p>
      )}

      <form
        onSubmit={onSubmit}
        className="border-ink-light/30 bg-paper-aged/40 rounded-sm border p-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          disabled={status === 'streaming' || status === 'sending' || isPlanning}
          placeholder={placeholderFor(phase, status === 'streaming', locale)}
          className="text-ink-heavy w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed outline-none placeholder:text-[color:var(--ink-light)] disabled:opacity-60"
        />
        <div className="flex items-center justify-between px-2 pt-1 pb-1">
          <span className="text-ink-light text-xs">
            {status === 'streaming' && t('thinking')}
            {isPlanning && '生成方案中…（约 10-20 秒）'}
            {!isPlanning && phase === 'ready' && status === 'idle' && '准备好了，可以生成方案。'}
          </span>
          <div className="flex items-center gap-2">
            {canPlan && (
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={isPlanning || status === 'streaming' || status === 'sending'}
                className="bg-gold-leaf hover:bg-ink-heavy rounded-sm px-3 py-1 text-xs text-[color:var(--paper-rice)] transition disabled:opacity-50"
              >
                {hasPlan ? '查看方案 →' : isPlanning ? '…' : t('readyToPlan')}
              </button>
            )}
            <button
              type="submit"
              disabled={
                !input.trim() || status === 'streaming' || status === 'sending' || isPlanning
              }
              className="bg-ink-heavy hover:bg-ink-medium rounded-sm px-4 py-1.5 text-sm text-[color:var(--paper-rice)] transition disabled:opacity-40"
            >
              落笔
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
