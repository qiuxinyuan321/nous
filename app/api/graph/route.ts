import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { GraphData, GraphEdge, GraphNode, IdeaStatus } from '@/lib/graph/types'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const ideas = await prisma.idea.findMany({
    where: { userId: session.user.id, status: { not: 'archived' } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      rawContent: true,
      refinedSummary: true,
      status: true,
      tags: true,
      createdAt: true,
      _count: { select: { messages: true } },
      plan: { select: { id: true } },
    },
  })

  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const tagFreq = new Map<string, number>()
  let untaggedIdeaCount = 0

  for (const idea of ideas) {
    const excerpt = (idea.refinedSummary ?? idea.rawContent).slice(0, 140)
    nodes.push({
      kind: 'idea',
      id: `idea:${idea.id}`,
      title: idea.title ?? excerpt.split('\n')[0]?.slice(0, 40) ?? '(无标题)',
      excerpt,
      status: idea.status as IdeaStatus,
      tagCount: idea.tags.length,
      messageCount: idea._count.messages,
      hasPlan: !!idea.plan,
      createdAt: idea.createdAt.toISOString(),
    })

    if (idea.tags.length === 0) {
      untaggedIdeaCount++
      continue
    }

    for (const tag of idea.tags) {
      const key = tag.trim().toLowerCase()
      if (!key) continue
      tagFreq.set(key, (tagFreq.get(key) ?? 0) + 1)
      edges.push({ source: `idea:${idea.id}`, target: `tag:${key}` })
    }
  }

  for (const [tag, count] of tagFreq.entries()) {
    nodes.push({
      kind: 'tag',
      id: `tag:${tag}`,
      name: tag,
      count,
    })
  }

  const data: GraphData = {
    nodes,
    edges,
    meta: {
      ideaCount: ideas.length,
      tagCount: tagFreq.size,
      untaggedIdeaCount,
    },
  }

  return NextResponse.json(data)
}
