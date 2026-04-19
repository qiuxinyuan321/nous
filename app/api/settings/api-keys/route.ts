import { NextResponse } from 'next/server'
import { z } from 'zod'
import { findPreset } from '@/lib/ai/presets'
import { auth } from '@/lib/auth'
import { encrypt } from '@/lib/crypto'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const PROVIDERS = [
  'openai',
  'anthropic',
  'deepseek',
  'kimi',
  'doubao',
  'openai-compatible',
] as const

const createSchema = z.object({
  provider: z.enum(PROVIDERS),
  label: z.string().max(60).optional(),
  baseUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  apiKey: z.string().min(8).max(200),
  model: z.string().min(1).max(100),
  isDefault: z.boolean().optional(),
})

/** GET: 列出当前用户所有 API Keys(脱敏) */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const rows = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      provider: true,
      label: true,
      baseUrl: true,
      model: true,
      isDefault: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ list: rows })
}

/** POST: 新增 API Key */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const userId = session.user.id

  const json = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const input = parsed.data

  // 自定义 provider 必须填 baseUrl
  if (input.provider === 'openai-compatible' && !input.baseUrl) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', message: '自定义 Provider 必须填 Base URL' },
      { status: 400 },
    )
  }

  const preset = findPreset(input.provider)
  const finalBaseUrl = input.baseUrl ?? preset?.defaultBaseUrl ?? null

  const encrypted = encrypt(input.apiKey)

  // 如果设为默认,先取消其它 default
  await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.apiKey.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      })
    }
    await tx.apiKey.create({
      data: {
        userId,
        provider: input.provider,
        label: input.label ?? null,
        baseUrl: finalBaseUrl,
        keyCipher: encrypted.cipher,
        keyIv: encrypted.iv,
        keyTag: encrypted.tag,
        model: input.model,
        isDefault: input.isDefault ?? false,
      },
    })
  })

  return NextResponse.json({ ok: true })
}
