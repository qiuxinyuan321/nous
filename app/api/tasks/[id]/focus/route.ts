import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

/** 返回当前用户时区下的「今日 0 点」UTC Date。 */
function startOfTodayUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

async function assertOwnership(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      milestone: { plan: { idea: { userId } } },
    },
    select: { id: true },
  })
  return task
}

/** 加入今日聚焦 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { id } = await params
  const task = await assertOwnership(id, session.user.id)
  if (!task) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const today = startOfTodayUTC()
  const updated = await prisma.task.update({
    where: { id },
    data: { focusedOn: today },
    select: { id: true, focusedOn: true },
  })
  return NextResponse.json({ ok: true, task: updated })
}

/** 移出今日聚焦 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { id } = await params
  const task = await assertOwnership(id, session.user.id)
  if (!task) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { focusedOn: null },
    select: { id: true, focusedOn: true },
  })
  return NextResponse.json({ ok: true, task: updated })
}
