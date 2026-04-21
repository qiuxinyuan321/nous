import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateFolderSchema } from '@/lib/types/note'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateFolderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const existing = await prisma.noteFolder.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const folder = await prisma.noteFolder.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json(folder)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  // 移动文件夹下的笔记到根级
  await prisma.note.updateMany({
    where: { folderId: id, userId: session.user.id },
    data: { folderId: null },
  })
  // 子文件夹提升到父级
  const folder = await prisma.noteFolder.findFirst({ where: { id, userId: session.user.id } })
  if (!folder) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  await prisma.noteFolder.updateMany({
    where: { parentId: id },
    data: { parentId: folder.parentId },
  })

  await prisma.noteFolder.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
