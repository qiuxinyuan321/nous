import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params

  // 确认笔记属于当前用户
  const note = await prisma.note.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!note) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const backlinks = await prisma.noteLink.findMany({
    where: { targetId: id },
    select: {
      id: true,
      context: true,
      source: {
        select: { id: true, title: true, updatedAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    backlinks.map((bl) => ({
      noteId: bl.source.id,
      noteTitle: bl.source.title,
      context: bl.context,
      updatedAt: bl.source.updatedAt,
    })),
  )
}
