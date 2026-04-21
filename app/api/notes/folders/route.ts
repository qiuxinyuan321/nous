import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createFolderSchema } from '@/lib/types/note'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const folders = await prisma.noteFolder.findMany({
    where: { userId: session.user.id },
    orderBy: [{ orderIdx: 'asc' }, { name: 'asc' }],
    include: {
      _count: { select: { notes: true } },
    },
  })

  const result = folders.map((f) => ({
    id: f.id,
    name: f.name,
    parentId: f.parentId,
    orderIdx: f.orderIdx,
    icon: f.icon,
    noteCount: f._count.notes,
  }))

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json()
  const parsed = createFolderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const folder = await prisma.noteFolder.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      parentId: parsed.data.parentId ?? null,
      icon: parsed.data.icon ?? null,
    },
  })

  return NextResponse.json(folder, { status: 201 })
}
