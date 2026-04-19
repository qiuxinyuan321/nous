import { streamText } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { buildModel } from '@/lib/ai/model'
import { resolveProvider } from '@/lib/ai/providers'
import { consumeDemoQuota } from '@/lib/ai/quota'
import { consumeToken } from '@/lib/ai/ratelimit'
import { phaseForMessageCount, socraticSystemPrompt } from '@/lib/ai/socratic'
import { QuotaExceededError, RateLimitError, type ResolvedProvider } from '@/lib/ai/types'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const bodySchema = z.object({
  ideaId: z.string().min(1),
  locale: z.enum(['zh-CN', 'en-US']).default('zh-CN'),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1).max(10_000),
      }),
    )
    .min(1)
    .max(40),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const userId = session.user.id

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const { ideaId, messages, locale } = parsed.data

  try {
    await consumeToken(`chat:${userId}`, 20, 60)
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', retryAfter: e.retryAfterSec },
        { status: 429, headers: { 'Retry-After': String(e.retryAfterSec) } },
      )
    }
    throw e
  }

  let provider: ResolvedProvider
  try {
    provider = await resolveProvider(userId)
  } catch (e) {
    return NextResponse.json(
      { error: 'PROVIDER_UNAVAILABLE', message: (e as Error).message },
      { status: 503 },
    )
  }

  if (provider.source === 'demo') {
    try {
      await consumeDemoQuota(userId)
    } catch (e) {
      if (e instanceof QuotaExceededError) {
        return NextResponse.json({ error: 'QUOTA_EXCEEDED' }, { status: 402 })
      }
      throw e
    }
  }

  const idea = await prisma.idea.findFirst({
    where: { id: ideaId, userId },
  })
  if (!idea) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const lastMessage = messages[messages.length - 1]!
  if (lastMessage.role !== 'user') {
    return NextResponse.json({ error: 'LAST_MUST_BE_USER' }, { status: 400 })
  }

  const userTurnCount = messages.filter((m) => m.role === 'user').length
  const phase = phaseForMessageCount(userTurnCount)

  await prisma.message.create({
    data: {
      ideaId,
      role: 'user',
      content: lastMessage.content,
      phase,
    },
  })

  const systemPrompt = socraticSystemPrompt({
    phase,
    locale,
    ideaTitle: idea.title ?? '',
    ideaContent: idea.rawContent,
  })

  const result = streamText({
    model: buildModel(provider),
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    maxOutputTokens: provider.maxOutputTokens,
    onFinish: async ({ text, usage }) => {
      try {
        await prisma.message.create({
          data: {
            ideaId,
            role: 'assistant',
            content: text,
            phase,
            metadata: {
              model: provider.model,
              source: provider.source,
              inputTokens: usage?.inputTokens ?? 0,
              outputTokens: usage?.outputTokens ?? 0,
            },
          },
        })
        if (idea.status === 'raw') {
          await prisma.idea.update({
            where: { id: ideaId },
            data: { status: 'refining' },
          })
        }
      } catch (err) {
        console.error('[chat onFinish] persist failed:', err)
      }
    },
  })

  return result.toTextStreamResponse({
    headers: {
      'X-Phase': phase,
      'X-Source': provider.source,
    },
  })
}
