import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || ''
const DEMO_DAILY_LIMIT = Number(process.env.DEMO_DAILY_LIMIT || 20)

function startOfDayUTC(d: Date = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.email || session.user.email !== SUPER_ADMIN_EMAIL) {
    return new NextResponse(null, { status: 404 })
  }

  const today = startOfDayUTC()

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          ideas: true,
          apiKeys: true,
          reflections: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const todayUsages = await prisma.demoUsage.findMany({
    where: { date: today },
    select: { userId: true, count: true },
  })
  const usageMap = new Map(todayUsages.map((u) => [u.userId, u.count]))

  const totalUsages = await prisma.demoUsage.groupBy({
    by: ['userId'],
    _sum: { count: true },
  })
  const totalMap = new Map(totalUsages.map((u) => [u.userId, u._sum.count ?? 0]))

  const msgCounts = await prisma.message.groupBy({
    by: ['ideaId'],
    _count: { id: true },
  })
  const ideas = await prisma.idea.findMany({
    select: { id: true, userId: true },
  })
  const ideaUserMap = new Map(ideas.map((i) => [i.id, i.userId]))
  const userMsgMap = new Map<string, number>()
  for (const mc of msgCounts) {
    const uid = ideaUserMap.get(mc.ideaId)
    if (uid) {
      userMsgMap.set(uid, (userMsgMap.get(uid) ?? 0) + mc._count.id)
    }
  }

  const enrichedUsers = users.map((u) => ({
    ...u,
    todayUsed: usageMap.get(u.id) ?? 0,
    totalUsed: totalMap.get(u.id) ?? 0,
    totalMessages: userMsgMap.get(u.id) ?? 0,
  }))

  return NextResponse.json({
    total: users.length,
    dailyLimit: DEMO_DAILY_LIMIT,
    totalTodayUsed: todayUsages.reduce((s, u) => s + u.count, 0),
    users: enrichedUsers,
  })
}
