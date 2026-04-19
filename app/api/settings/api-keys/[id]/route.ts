import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const patchSchema = z.object({
  isDefault: z.boolean().optional(),
  label: z.string().max(60).nullable().optional(),
})

/** PATCH: 切换默认 / 改 label */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const userId = session.user.id
  const { id } = await params

  const target = await prisma.apiKey.findFirst({
    where: { id, userId },
    select: { id: true },
  })
  if (!target) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const json = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault === true) {
      await tx.apiKey.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      })
    }
    await tx.apiKey.update({
      where: { id },
      data: {
        ...(parsed.data.isDefault !== undefined ? { isDefault: parsed.data.isDefault } : {}),
        ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
      },
    })
  })

  return NextResponse.json({ ok: true })
}

/** DELETE */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const { id } = await params

  const target = await prisma.apiKey.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!target) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  await prisma.apiKey.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
