import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generatePrompts } from '@/lib/proactive/engine'

/**
 * GET /api/proactive
 *   返回当前用户的主动问列表 · 至多 3 条
 *   dismiss 状态由客户端 localStorage 追踪 · 服务端不持久化
 *
 * Query:
 *   ?persona=auto|zhuge|rick|chuxuan|socrates|zhuangzi|holmes
 *   未指定 · 不识别 · 均回落 auto
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const personaId = req.nextUrl.searchParams.get('persona')

  try {
    const resp = await generatePrompts({ userId: session.user.id, personaId })
    return NextResponse.json(resp)
  } catch (err) {
    console.error('[proactive] error:', err)
    return NextResponse.json({ error: 'GENERATE_FAILED' }, { status: 500 })
  }
}
