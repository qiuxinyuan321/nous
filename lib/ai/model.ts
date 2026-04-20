import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import type { ResolvedProvider } from './types'

/**
 * 根据 ResolvedProvider 构造 language model。
 * OpenAI 兼容端点一律走 /v1/chat/completions（.chat()）——避开 @ai-sdk/openai
 * 默认的 /v1/responses 在大多数兼容网关（浮生云算、DeepSeek、Kimi、豆包等）上不可用。
 */
export function buildModel(p: ResolvedProvider) {
  if (p.kind === 'anthropic') {
    const anthropic = createAnthropic({ apiKey: p.apiKey, baseURL: p.baseURL })
    return anthropic(p.model)
  }
  const openai = createOpenAI({
    apiKey: p.apiKey,
    baseURL: p.baseURL,
  })
  return openai.chat(p.model)
}
