import { decrypt } from '@/lib/crypto'
import { prisma } from '@/lib/db'
import type { ResolvedProvider } from './types'

/**
 * 优先级：BYOK（用户 default key）> Demo（共享 env 配置）。
 * 如果都未配置，抛错给上层兜底。
 */
export async function resolveProvider(userId: string): Promise<ResolvedProvider> {
  const key = await prisma.apiKey.findFirst({
    where: { userId, isDefault: true },
  })

  if (key) {
    const apiKey = decrypt({ cipher: key.keyCipher, iv: key.keyIv, tag: key.keyTag })
    return {
      source: 'byok',
      kind: key.provider === 'anthropic' ? 'anthropic' : 'openai-compatible',
      baseURL: key.baseUrl || undefined,
      apiKey,
      model: key.model,
      maxOutputTokens: 4096,
    }
  }

  if (!process.env.DEMO_API_KEY) {
    throw new Error('Demo Key 未配置。请在 .env 中设置 DEMO_API_KEY 或让用户配置 BYOK。')
  }

  return {
    source: 'demo',
    kind: 'openai-compatible',
    baseURL: process.env.DEMO_BASE_URL || undefined,
    apiKey: process.env.DEMO_API_KEY,
    model: process.env.DEMO_MODEL || 'gpt-4o-mini',
    maxOutputTokens: Number(process.env.DEMO_MAX_TOKENS || 2000),
  }
}
