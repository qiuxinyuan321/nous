'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, Phase } from '@/lib/ai/types'
import { useNousChat } from '@/lib/hooks/useNousChat'
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
}

const ERROR_LABEL: Record<string, string> = {
  QUOTA_EXCEEDED: '今日体验额度已用完。可配置自己的 API Key 继续。',
  RATE_LIMITED: '请求过于频繁，稍后再试。',
  PROVIDER_UNAVAILABLE: 'AI 服务当前不可用。请配置 BYOK 或联系管理员。',
  UNAUTHORIZED: '登录态已失效，请重新登录。',
  NOT_FOUND: '想法不存在或已被删除。',
  AI_EMPTY_RESPONSE:
    '模型没返回内容。常见原因：Key 对该模型无权限 / 模型名拼写错误 / 网关超时。查 pnpm dev 终端看具体原因。',
}

export function RefineView({
  ideaId,
  ideaTitle,
  ideaContent,
  initialMessages,
  initialPhase,
  locale,
}: RefineViewProps) {
  const t = useTranslations('refine')
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, streaming, status, error, phase, send } = useNousChat({
    ideaId,
    initialMessages,
    initialPhase,
    locale,
  })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, streaming])

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

  const hasConversation = messages.length > 0 || streaming

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col px-6 py-10">
      <header className="mb-8">
        <h1 className="font-serif-cn text-ink-heavy text-2xl">{ideaTitle || '无题'}</h1>
        <p className="text-ink-light mt-2 line-clamp-2 text-xs">{ideaContent}</p>
        <div className="mt-6">
          <PhaseIndicator phase={phase} />
        </div>
      </header>

      <QuotaBanner />

      <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto pb-6">
        {!hasConversation && (
          <div className="text-ink-light py-16 text-center text-sm">
            AI 会从你的想法开始问。先说一句你现在脑子里最清楚的部分。
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {streaming && <MessageBubble role="assistant" content={streaming} streaming />}
      </div>

      {error && (
        <p className="text-cinnabar mb-3 text-sm">{ERROR_LABEL[error] ?? `错误：${error}`}</p>
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
          disabled={status === 'streaming' || status === 'sending'}
          placeholder={
            status === 'streaming' ? t('thinking') : '回应一句…（Enter 送出，Shift+Enter 换行）'
          }
          className="font-serif-cn text-ink-heavy w-full resize-none bg-transparent px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-[color:var(--ink-light)] disabled:opacity-60"
        />
        <div className="flex items-center justify-between px-2 pt-1 pb-1">
          <span className="text-ink-light text-xs">
            {status === 'streaming' && t('thinking')}
            {phase === 'ready' && status === 'idle' && '准备好了，可以生成方案。'}
          </span>
          <div className="flex items-center gap-2">
            {phase === 'ready' && (
              <button
                type="button"
                disabled
                title="规划生成器尚未接入（阶段 6）"
                className="bg-gold-leaf/80 cursor-not-allowed rounded-sm px-3 py-1 text-xs text-[color:var(--paper-rice)] opacity-60"
              >
                {t('readyToPlan')}
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || status === 'streaming' || status === 'sending'}
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
