export type Phase = 'intent' | 'detail' | 'boundary' | 'ready'

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  role: ChatRole
  content: string
  /**
   * Assistant 消息：生成时的 persona · null 表示 auto / 历史数据
   * User / system 消息：始终 null
   */
  personaId?: string | null
}

export interface ResolvedProvider {
  source: 'byok' | 'demo'
  kind: 'openai-compatible' | 'anthropic'
  baseURL?: string
  apiKey: string
  model: string
  maxOutputTokens: number
}

export class QuotaExceededError extends Error {
  name = 'QuotaExceededError'
  constructor(public remaining = 0) {
    super('今日体验额度已用完')
  }
}

export class RateLimitError extends Error {
  name = 'RateLimitError'
  constructor(public retryAfterSec: number) {
    super('请稍后再试')
  }
}
