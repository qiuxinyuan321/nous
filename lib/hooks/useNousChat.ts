'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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

  const messagesRef = useRef(messages)
  const statusRef = useRef(status)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || statusRef.current === 'sending' || statusRef.current === 'streaming') return

      const userMsg: ChatMessage = { role: 'user', content: trimmed }
      const next = [...messagesRef.current, userMsg]
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

        // 检测 AI 回复中是否包含方案就绪信号，自动提升到 ready
        const readySignals = [
          '生成详细方案',
          '生成方案',
          '可以开始了',
          '准备好了',
          'generate a plan',
          'generate a detailed plan',
          'Ready to go',
        ]
        if (readySignals.some((s) => full.includes(s))) {
          setPhase('ready')
        }
      } catch (e) {
        setStatus('error')
        setError((e as Error).message)
        onError?.((e as Error).message)
      }
    },
    [ideaId, locale, onError],
  )

  return { messages, streaming, status, error, phase, send, setPhase }
}
