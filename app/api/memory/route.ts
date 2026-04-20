import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
  createMemory,
  deleteMemory,
  listMemories,
  updateMemory,
  MEMORY_KINDS,
} from '@/lib/memory/store'

const createSchema = z.object({
  kind: z.enum(MEMORY_KINDS),
  content: z.string().min(2).max(500),
  importance: z.number().int().min(1).max(5).optional(),
})

const patchSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(MEMORY_KINDS).optional(),
  content: z.string().min(2).max(500).optional(),
  importance: z.number().int().min(1).max(5).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const memories = await listMemories(session.user.id)
  return NextResponse.json({ memories })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const json = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const memory = await createMemory(session.user.id, {
    kind: parsed.data.kind,
    content: parsed.data.content,
    importance: parsed.data.importance,
    source: 'manual',
  })
  return NextResponse.json({ memory }, { status: 201 })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const json = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const { id, ...patch } = parsed.data
  const count = await updateMemory(session.user.id, id, patch)
  if (count === 0) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'MISSING_ID' }, { status: 400 })
  }
  await deleteMemory(session.user.id, id)
  return NextResponse.json({ ok: true })
}
