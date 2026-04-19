import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const statusSchema = z.object({
  status: z.enum(['todo', 'doing', 'done', 'skipped']),
})

/** 更新任务状态 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user.id

  const task = await prisma.task.findFirst({
    where: {
      id,
      milestone: { plan: { idea: { userId } } },
    },
    select: { id: true },
  })
  if (!task) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const json = await req.json().catch(() => null)
  const parsed = statusSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const completedAt = parsed.data.status === 'done' ? new Date() : null
  const updated = await prisma.task.update({
    where: { id },
    data: { status: parsed.data.status, completedAt },
    select: { id: true, status: true, completedAt: true },
  })

  return NextResponse.json({ ok: true, task: updated })
}
