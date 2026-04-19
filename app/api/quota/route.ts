import { NextResponse } from 'next/server'
import { getDemoUsageToday } from '@/lib/ai/quota'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const hasByok = !!(await prisma.apiKey.findFirst({
    where: { userId: session.user.id, isDefault: true },
    select: { id: true },
  }))

  if (hasByok) {
    return NextResponse.json({
      source: 'byok',
      limit: null,
      count: 0,
      remaining: null,
    })
  }

  const usage = await getDemoUsageToday(session.user.id)
  return NextResponse.json({
    source: 'demo',
    limit: usage.limit,
    count: usage.count,
    remaining: usage.remaining,
  })
}
