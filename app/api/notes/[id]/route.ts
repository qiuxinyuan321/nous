import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateNoteSchema } from '@/lib/types/note'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const note = await prisma.note.findFirst({
    where: { id, userId: session.user.id },
    include: {
      folder: { select: { id: true, name: true, icon: true } },
      outLinks: {
        select: {
          target: { select: { id: true, title: true } },
        },
      },
      inLinks: {
        select: {
          source: { select: { id: true, title: true } },
          context: true,
        },
      },
    },
  })

  if (!note) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json(note)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateNoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const existing = await prisma.note.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  // 如果内容变了，解析 [[wikilinks]] 并更新 NoteLink
  const contentChanged =
    parsed.data.content !== undefined && parsed.data.content !== existing.content

  const note = await prisma.note.update({
    where: { id },
    data: parsed.data,
  })

  if (contentChanged && parsed.data.content) {
    await syncWikiLinks(session.user.id, id, parsed.data.content)
  }

  return NextResponse.json(note)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const result = await prisma.note.deleteMany({
    where: { id, userId: session.user.id },
  })
  if (result.count === 0) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

/** 解析 [[标题]] 链接并同步 NoteLink 表 */
async function syncWikiLinks(userId: string, sourceId: string, content: string) {
  const regex = /\[\[(.+?)\]\]/g
  const titles = new Set<string>()
  let match
  while ((match = regex.exec(content)) !== null) {
    titles.add(match[1]!.trim())
  }

  if (titles.size === 0) {
    await prisma.noteLink.deleteMany({ where: { sourceId } })
    return
  }

  // 找到匹配标题的笔记
  const targets = await prisma.note.findMany({
    where: {
      userId,
      title: { in: [...titles], mode: 'insensitive' },
      id: { not: sourceId },
    },
    select: { id: true, title: true },
  })

  const targetIds = new Set(targets.map((t) => t.id))

  // 删除不再存在的链接
  await prisma.noteLink.deleteMany({
    where: {
      sourceId,
      targetId: { notIn: [...targetIds] },
    },
  })

  // 创建或更新链接
  for (const target of targets) {
    // 提取上下文：链接周围的文本
    const linkPattern = new RegExp(
      `(.{0,40})\\[\\[${target.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\](.{0,40})`,
    )
    const ctx = content.match(linkPattern)
    const context = ctx ? `…${ctx[1]}[[${target.title}]]${ctx[2]}…` : null

    await prisma.noteLink.upsert({
      where: { sourceId_targetId: { sourceId, targetId: target.id } },
      create: { sourceId, targetId: target.id, context },
      update: { context },
    })
  }
}
