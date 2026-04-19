import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createIdeaSchema } from '@/lib/validations/idea'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const ideas = await prisma.idea.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      rawContent: true,
      refinedSummary: true,
      status: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ ideas })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const json = await req.json().catch(() => null)
  const parsed = createIdeaSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { rawContent, title, tags } = parsed.data
  const autoTitle = title ?? rawContent.split('\n')[0]?.slice(0, 40) ?? null

  const idea = await prisma.idea.create({
    data: {
      userId: session.user.id,
      rawContent,
      title: autoTitle,
      tags: tags ?? [],
      status: 'raw',
    },
  })

  return NextResponse.json({ idea }, { status: 201 })
}
