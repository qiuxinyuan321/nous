import { resolveProvider } from './providers'
import type { ResolvedProvider } from './types'

/**
 * 文本嵌入。
 * -----------
 * - 复用 BYOK / Demo 的 openai-compatible 凭证,走 /v1/embeddings
 * - Anthropic 无原生 embeddings,直接返回 null (调用方降级)
 * - 任何 HTTP 错误也返回 null (fail-soft,不阻塞主流程)
 *
 * 模型默认 text-embedding-3-small (1536 维)。
 * 若中转站用别的模型名,可通过 EMBEDDING_MODEL 覆盖。
 */
export async function embedText(userId: string, text: string): Promise<number[] | null> {
  let provider: ResolvedProvider
  try {
    provider = await resolveProvider(userId)
  } catch {
    return null
  }
  return embedWithProvider(provider, text)
}

export async function embedWithProvider(
  provider: ResolvedProvider,
  text: string,
): Promise<number[] | null> {
  if (provider.kind === 'anthropic') return null
  const trimmed = text.trim().slice(0, 8000)
  if (!trimmed) return null

  const base = (provider.baseURL ?? 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small'

  try {
    const res = await fetch(`${base}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, input: trimmed }),
    })
    if (!res.ok) {
      console.warn('[embedText] non-200:', res.status, (await res.text()).slice(0, 120))
      return null
    }
    const data = (await res.json()) as { data?: Array<{ embedding: number[] }> }
    return data.data?.[0]?.embedding ?? null
  } catch (err) {
    console.warn('[embedText] failed:', err)
    return null
  }
}

/** 余弦相似度。两向量维度需一致,否则返回 -1。 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return -1
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? -1 : dot / denom
}
