import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const bodySchema = z.object({
  noteId: z.string().min(1),
  action: z.enum(['link', 'unlink']),
})

/** 列出任务关联的笔记 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const { id } = await params
  const userId = session.user.id

  const task = await prisma.task.findFirst({
    where: { id, milestone: { plan: { idea: { userId } } } },
    select: {
      notes: {
        where: { userId },
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })
  if (!task) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ notes: task.notes })
}

/** 关联/取消关联笔记（action: link | unlink） */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const { id } = await params
  const userId = session.user.id

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }
  const { noteId, action } = parsed.data

  // 鉴权：任务必须属于用户，笔记也必须属于用户
  const [task, note] = await Promise.all([
    prisma.task.findFirst({
      where: { id, milestone: { plan: { idea: { userId } } } },
      select: { id: true },
    }),
    prisma.note.findFirst({ where: { id: noteId, userId }, select: { id: true } }),
  ])
  if (!task) return NextResponse.json({ error: 'TASK_NOT_FOUND' }, { status: 404 })
  if (!note) return NextResponse.json({ error: 'NOTE_NOT_FOUND' }, { status: 404 })

  await prisma.task.update({
    where: { id },
    data: {
      notes: action === 'link' ? { connect: { id: noteId } } : { disconnect: { id: noteId } },
    },
  })

  return NextResponse.json({ ok: true })
}
