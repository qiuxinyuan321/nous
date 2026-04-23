/**
 * POST /api/proactive/ack
 * -----------------------------------
 * 用户点击一个 ProactivePrompt 的 CTA 时调用 · 用于"标记已用"。
 *
 * 主要修复：dormant_blindspot / orphan_goal 这两个 kind 依赖 memory 表判定 · 若用户真的
 * 点击进去处理了 · 应更新该 memory 的 lastUsedAt · 避免 30 天阈值后立即再次 fire。
 *
 * 其他 kind 暂无持久化副作用 · 仅返回 ok (预留将来 analytics / 频控)。
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PROMPT_KINDS } from '@/lib/proactive/types'

const bodySchema = z.object({
  key: z.string().min(1).max(120),
  kind: z.enum(PROMPT_KINDS),
  memoryId: z.string().min(1).max(80).optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const userId = session.user.id

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { kind, memoryId } = parsed.data

  // 只有 blindspot / goal 类来自 memory · 其他 kind 没有 memory 副作用
  if ((kind === 'dormant_blindspot' || kind === 'orphan_goal') && memoryId) {
    // updateMany 自动按 userId 过滤 · 防止越权 touch 别人的 memory
    await prisma.memory
      .updateMany({
        where: { id: memoryId, userId },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => {
        console.warn('[proactive/ack] touch memory failed:', err)
      })
  }

  return NextResponse.json({ ok: true })
}
