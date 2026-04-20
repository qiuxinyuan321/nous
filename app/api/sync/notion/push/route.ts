import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { pushIdeaToNotion } from '@/lib/sync/notion'

const bodySchema = z.object({
  ideaIds: z.array(z.string().min(1)).min(1).max(50),
})

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const ideas = await prisma.idea.findMany({
    where: { userId: session.user.id, id: { in: parsed.data.ideaIds } },
    include: { plan: true },
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const results: Array<{ ideaId: string; ok: boolean; error?: string; pageUrl?: string }> = []

  for (const idea of ideas) {
    const result = await pushIdeaToNotion(
      session.user.id,
      {
        idea: {
          id: idea.id,
          title: idea.title,
          rawContent: idea.rawContent,
          refinedSummary: idea.refinedSummary,
          status: idea.status,
          tags: idea.tags,
          createdAt: idea.createdAt,
        },
        plan: idea.plan
          ? {
              goal: idea.plan.goal,
              firstAction: idea.plan.firstAction,
              successCriteria: Array.isArray(idea.plan.successCriteria)
                ? (idea.plan.successCriteria as string[])
                : [],
              risks: Array.isArray(idea.plan.risks) ? (idea.plan.risks as string[]) : [],
            }
          : null,
      },
      siteUrl,
    )
    results.push({
      ideaId: idea.id,
      ok: result.ok,
      ...(result.ok ? { pageUrl: result.pageUrl } : { error: result.error }),
    })
  }

  const okCount = results.filter((r) => r.ok).length
  return NextResponse.json({
    total: results.length,
    ok: okCount,
    failed: results.length - okCount,
    results,
  })
}
