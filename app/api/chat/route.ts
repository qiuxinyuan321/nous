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
import { memoriesToPromptBlock, searchMemories } from '@/lib/memory/store'
import { extractMemories } from '@/lib/memory/extract'
import { DEFAULT_PERSONA_ID, isValidPersonaId } from '@/lib/proactive/personas'

export const runtime = 'nodejs'

const bodySchema = z.object({
  ideaId: z.string().min(1),
  locale: z.enum(['zh-CN', 'en-US']).default('zh-CN'),
  persona: z.string().max(32).optional(),
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
  const { ideaId, messages, locale, persona } = parsed.data
  const personaId = isValidPersonaId(persona) ? persona : DEFAULT_PERSONA_ID

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

  // 检索长期记忆 (top-K),查询文本 = idea + 用户最新发言
  const queryText = `${idea.title ?? ''} ${idea.rawContent}\n${lastMessage.content}`.slice(0, 2000)
  let memoryBlock = ''
  try {
    const memories = await searchMemories(userId, queryText, 5)
    memoryBlock = memoriesToPromptBlock(memories, locale)
  } catch (err) {
    console.warn('[chat] memory search failed:', err)
  }

  const systemPrompt = socraticSystemPrompt({
    phase,
    locale,
    ideaTitle: idea.title ?? '',
    ideaContent: idea.rawContent,
    memoryBlock: memoryBlock || undefined,
    personaId,
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
            // 非 auto 时才写 · auto 写 null 让气泡保持默认样式 · 不显眼
            personaId: personaId === 'auto' ? null : personaId,
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

        // fire-and-forget: 从本轮对话抽取长期记忆
        // 只在 detail / boundary 阶段抽 (intent 轮信号稀薄, ready 已总结完)
        if (phase === 'detail' || phase === 'boundary') {
          // 过滤掉 system · 保持 recentContext 是纯净的 user/assistant 对话流
          // 之前把 system 粗暴压成 assistant · 会让 extractor 把系统指令当成 AI 回复
          // 干扰"关于用户的稳定事实"判断
          const cleanContext = messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .slice(-4)
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
          void extractMemories(userId, ideaId, {
            provider,
            locale,
            userMessage: lastMessage.content,
            assistantMessage: text,
            recentContext: cleanContext,
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
      'X-Persona': personaId,
      ...(memoryBlock ? { 'X-Memory-Injected': '1' } : {}),
    },
  })
}
