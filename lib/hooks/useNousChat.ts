'use client'

import { useCallback, useState } from 'react'
import type { ChatMessage, Phase } from '@/lib/ai/types'

export type ChatStatus = 'idle' | 'sending' | 'streaming' | 'error'

interface UseNousChatOptions {
  ideaId: string
  initialMessages?: ChatMessage[]
  initialPhase?: Phase
  locale?: 'zh-CN' | 'en-US'
  onError?: (code: string) => void
}

export function useNousChat({
  ideaId,
  initialMessages = [],
  initialPhase = 'intent',
  locale = 'zh-CN',
  onError,
}: UseNousChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [streaming, setStreaming] = useState<string>('')
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>(initialPhase)

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || status === 'sending' || status === 'streaming') return

      const userMsg: ChatMessage = { role: 'user', content: trimmed }
      const next = [...messages, userMsg]
      setMessages(next)
      setStreaming('')
      setStatus('sending')
      setError(null)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ideaId, messages: next, locale }),
        })

        if (!res.ok || !res.body) {
          let code = `HTTP_${res.status}`
          try {
            const j = (await res.json()) as { error?: string }
            if (j.error) code = j.error
          } catch {
            /* ignore */
          }
          setStatus('error')
          setError(code)
          onError?.(code)
          return
        }

        const headerPhase = res.headers.get('x-phase') as Phase | null
        if (headerPhase) setPhase(headerPhase)
        setStatus('streaming')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let full = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          full += decoder.decode(value, { stream: true })
          setStreaming(full)
        }
        if (!full.trim()) {
          setStreaming('')
          setStatus('error')
          setError('AI_EMPTY_RESPONSE')
          onError?.('AI_EMPTY_RESPONSE')
          return
        }
        setMessages((m) => [...m, { role: 'assistant', content: full }])
        setStreaming('')
        setStatus('idle')
      } catch (e) {
        setStatus('error')
        setError((e as Error).message)
        onError?.((e as Error).message)
      }
    },
    [ideaId, messages, locale, onError, status],
  )

  return { messages, streaming, status, error, phase, send, setPhase }
}
