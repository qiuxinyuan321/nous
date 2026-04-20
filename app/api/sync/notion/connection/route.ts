import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
  disconnectNotion,
  getNotionStatus,
  saveNotionConnection,
  testNotionConnection,
} from '@/lib/sync/notion'

const connectSchema = z.object({
  token: z.string().min(10).max(500),
  databaseId: z.string().min(10).max(100),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const status = await getNotionStatus(session.user.id)
  return NextResponse.json(status)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = connectSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  await saveNotionConnection(
    session.user.id,
    parsed.data.token.trim(),
    parsed.data.databaseId.replace(/-/g, '').trim(),
  )

  // 立即测一下可访问
  const testResult = await testNotionConnection(session.user.id)
  if (!testResult.ok) {
    // 保存成功但测试失败 — 保留配置,让用户看到具体错误再决定
    return NextResponse.json(
      { ok: true, testOk: false, testError: testResult.error },
      { status: 200 },
    )
  }
  return NextResponse.json({ ok: true, testOk: true })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  await disconnectNotion(session.user.id)
  return NextResponse.json({ ok: true })
}
