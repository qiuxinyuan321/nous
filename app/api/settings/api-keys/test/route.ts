import { NextResponse } from 'next/server'
import { z } from 'zod'
import { findPreset } from '@/lib/ai/presets'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

const PROVIDERS = [
  'openai',
  'anthropic',
  'deepseek',
  'kimi',
  'doubao',
  'openai-compatible',
] as const

const testSchema = z.object({
  provider: z.enum(PROVIDERS),
  baseUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  apiKey: z.string().min(8).max(200),
  model: z.string().min(1).max(100),
})

/**
 * 测试 BYOK 连通性。
 * 非 streaming 简短 ping(1 token) —— 通用兼容接口 /chat/completions。
 * 对 Anthropic 不走 /chat/completions,单独调 /v1/messages。
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const json = await req.json().catch(() => null)
  const parsed = testSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }
  const { provider, apiKey, model } = parsed.data
  const preset = findPreset(provider)
  const base = (parsed.data.baseUrl ?? preset?.defaultBaseUrl ?? '').replace(/\/+$/, '')

  if (!base) {
    return NextResponse.json({ error: 'INVALID_INPUT', message: '缺少 Base URL' }, { status: 400 })
  }

  try {
    if (preset?.kind === 'anthropic') {
      const res = await fetch(`${base}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        return NextResponse.json(
          { ok: false, status: res.status, message: body.slice(0, 300) },
          { status: 200 },
        )
      }
      return NextResponse.json({ ok: true, provider, model })
    }

    // OpenAI 兼容: /chat/completions
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
        stream: false,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return NextResponse.json(
        { ok: false, status: res.status, message: body.slice(0, 300) },
        { status: 200 },
      )
    }

    return NextResponse.json({ ok: true, provider, model })
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: (e as Error).message.slice(0, 300) },
      { status: 200 },
    )
  }
}
