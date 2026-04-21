import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const [notes, links] = await Promise.all([
    prisma.note.findMany({
      where: { userId: session.user.id, archived: false },
      select: { id: true, title: true, tags: true, updatedAt: true, folderId: true },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    }),
    prisma.noteLink.findMany({
      where: {
        source: { userId: session.user.id },
      },
      select: { sourceId: true, targetId: true },
    }),
  ])

  const noteIds = new Set(notes.map((n) => n.id))

  return NextResponse.json({
    nodes: notes.map((n) => ({
      id: n.id,
      label: n.title || '无题',
      tags: n.tags,
      folderId: n.folderId,
    })),
    edges: links
      .filter((l) => noteIds.has(l.sourceId) && noteIds.has(l.targetId))
      .map((l) => ({
        source: l.sourceId,
        target: l.targetId,
      })),
  })
}
