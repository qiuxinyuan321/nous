import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createNoteSchema } from '@/lib/types/note'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get('folder')
  const tag = searchParams.get('tag')
  const q = searchParams.get('q')
  const archived = searchParams.get('archived') === 'true'
  const cursor = searchParams.get('cursor')
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100)

  const where: Record<string, unknown> = {
    userId: session.user.id,
    archived,
  }
  if (folderId) where.folderId = folderId
  if (folderId === 'null') where.folderId = null
  if (tag) where.tags = { has: tag }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
    ]
  }

  const notes = await prisma.note.findMany({
    where,
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      content: true,
      folderId: true,
      tags: true,
      pinned: true,
      archived: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const hasMore = notes.length > limit
  if (hasMore) notes.pop()

  return NextResponse.json({
    notes,
    nextCursor: hasMore ? notes[notes.length - 1]?.id : null,
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json()
  const parsed = createNoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const note = await prisma.note.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title ?? '无题',
      content: parsed.data.content ?? '',
      folderId: parsed.data.folderId ?? null,
      tags: parsed.data.tags ?? [],
    },
  })

  return NextResponse.json(note, { status: 201 })
}
