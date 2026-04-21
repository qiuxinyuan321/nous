import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveProvider } from '@/lib/ai/providers'
import { buildModel } from '@/lib/ai/model'

const bodySchema = z.object({
  noteIds: z.array(z.string()).min(1).max(20),
  prompt: z.string().max(500).optional(),
})

const SYSTEM = `你是一个笔记整理助手。用户会给你一组笔记内容，你需要：
1. 提炼核心要点，按主题分组归纳
2. 标注不同笔记间的关联和矛盾
3. 如有可执行的行动项，列为待办清单
4. 输出格式为 Markdown

要求：简洁、结构清晰、不添加原文没有的信息。`

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const notes = await prisma.note.findMany({
    where: { id: { in: parsed.data.noteIds }, userId: session.user.id },
    select: { id: true, title: true, content: true },
  })

  if (notes.length === 0) {
    return NextResponse.json({ error: 'NO_NOTES_FOUND' }, { status: 404 })
  }

  // 拼接笔记内容
  const notesText = notes
    .map((n, i) => `## 笔记 ${i + 1}: ${n.title || '无题'}\n\n${n.content.replace(/<[^>]*>/g, '')}`)
    .join('\n\n---\n\n')

  const userPrompt = parsed.data.prompt
    ? `${notesText}\n\n---\n\n用户附加要求: ${parsed.data.prompt}`
    : notesText

  const provider = await resolveProvider(session.user.id)
  const model = buildModel(provider)

  const result = await generateText({
    model,
    system: SYSTEM,
    prompt: userPrompt,
    maxOutputTokens: 2000,
  })

  // 保存到数据库
  const digest = await prisma.aiDigest.create({
    data: {
      userId: session.user.id,
      noteIds: parsed.data.noteIds,
      prompt: parsed.data.prompt ?? null,
      result: result.text,
    },
  })

  return NextResponse.json({
    id: digest.id,
    result: result.text,
    noteCount: notes.length,
  })
}
