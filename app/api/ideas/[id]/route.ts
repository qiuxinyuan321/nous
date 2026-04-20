import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateIdeaSchema } from '@/lib/validations/idea'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const idea = await prisma.idea.findFirst({
    where: { id, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!idea) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  return NextResponse.json({ idea })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const json = await req.json().catch(() => null)
  const parsed = updateIdeaSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const existing = await prisma.idea.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const idea = await prisma.idea.update({
    where: { id },
    data: parsed.data,
  })
  return NextResponse.json({ idea })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const result = await prisma.idea.deleteMany({
    where: { id, userId: session.user.id },
  })
  if (result.count === 0) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
