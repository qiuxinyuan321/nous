'use server'

import { redirect } from 'next/navigation'
import { generatePlan } from '@/lib/ai/planner'
import { resolveProvider } from '@/lib/ai/providers'
import { consumeDemoQuota } from '@/lib/ai/quota'
import { consumeToken } from '@/lib/ai/ratelimit'
import { QuotaExceededError, RateLimitError } from '@/lib/ai/types'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DEFAULT_PERSONA_ID, isValidPersonaId } from '@/lib/proactive/personas'

export type GeneratePlanResult = { ok: true; redirectTo: string } | { ok: false; error: string }

/**
 * Server Action: 基于 idea + 对话历史生成结构化 Plan，持久化并跳转 /plan/[ideaId]。
 * persona 由前端从 localStorage 读取后传入 · 用于 plan 语气层。
 */
export async function generatePlanAction(
  ideaId: string,
  locale: 'zh-CN' | 'en-US',
  personaHint?: string | null,
): Promise<GeneratePlanResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'UNAUTHORIZED' }
  const userId = session.user.id

  try {
    await consumeToken(`plan:${userId}`, 5, 60)
  } catch (e) {
    if (e instanceof RateLimitError) return { ok: false, error: 'RATE_LIMITED' }
    throw e
  }

  const idea = await prisma.idea.findFirst({
    where: { id: ideaId, userId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      plan: { select: { id: true } },
    },
  })
  if (!idea) return { ok: false, error: 'NOT_FOUND' }

  if (idea.plan) {
    // 已有方案，直接跳转
    redirect(`/${locale}/plan/${ideaId}`)
  }

  let provider
  try {
    provider = await resolveProvider(userId)
  } catch (e) {
    return {
      ok: false,
      error: 'PROVIDER_UNAVAILABLE: ' + (e as Error).message,
    }
  }

  if (provider.source === 'demo') {
    try {
      await consumeDemoQuota(userId)
    } catch (e) {
      if (e instanceof QuotaExceededError) return { ok: false, error: 'QUOTA_EXCEEDED' }
      throw e
    }
  }

  const personaId = isValidPersonaId(personaHint) ? personaHint : DEFAULT_PERSONA_ID

  let draft
  try {
    draft = await generatePlan({
      provider,
      ideaTitle: idea.title ?? '',
      ideaContent: idea.rawContent,
      recentMessages: idea.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      locale,
      personaId,
    })
  } catch (e) {
    console.error('[generatePlan] AI failed:', e)
    return { ok: false, error: 'AI_GENERATION_FAILED: ' + (e as Error).message }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const plan = await tx.plan.create({
        data: {
          ideaId: idea.id,
          goal: draft.goal,
          successCriteria: draft.successCriteria,
          firstAction: draft.firstAction,
          risks: draft.risks,
        },
      })
      for (const [mIdx, m] of draft.milestones.entries()) {
        const milestone = await tx.milestone.create({
          data: {
            planId: plan.id,
            title: m.title,
            deadline: m.deadline ? new Date(m.deadline) : null,
            orderIdx: mIdx,
          },
        })
        for (const [tIdx, t] of m.tasks.entries()) {
          await tx.task.create({
            data: {
              milestoneId: milestone.id,
              title: t.title,
              description: t.description ?? null,
              priority: t.priority,
              estimatedMin: t.estimatedMin,
              orderIdx: tIdx,
            },
          })
        }
      }
      await tx.idea.update({
        where: { id: idea.id },
        data: { status: 'planned' },
      })
    })
  } catch (e) {
    console.error('[generatePlan] persist failed:', e)
    return { ok: false, error: 'PERSIST_FAILED' }
  }

  redirect(`/${locale}/plan/${ideaId}`)
}
