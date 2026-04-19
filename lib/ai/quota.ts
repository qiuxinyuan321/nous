import { prisma } from '@/lib/db'
import { QuotaExceededError } from './types'

export const DEMO_DAILY_LIMIT = Number(process.env.DEMO_DAILY_LIMIT || 20)

function startOfDayUTC(d: Date = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

export async function getDemoUsageToday(userId: string) {
  const date = startOfDayUTC()
  const usage = await prisma.demoUsage.findUnique({
    where: { userId_date: { userId, date } },
  })
  const count = usage?.count ?? 0
  return {
    count,
    limit: DEMO_DAILY_LIMIT,
    remaining: Math.max(0, DEMO_DAILY_LIMIT - count),
  }
}

/**
 * 检查并增加 Demo Key 使用计数（atomic upsert）。
 * 超额则回滚 + 抛 QuotaExceededError。
 */
export async function consumeDemoQuota(
  userId: string,
  tokensIn = 0,
  tokensOut = 0,
): Promise<{ count: number; remaining: number }> {
  const date = startOfDayUTC()
  const usage = await prisma.demoUsage.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, count: 1, tokensIn, tokensOut },
    update: {
      count: { increment: 1 },
      tokensIn: { increment: tokensIn },
      tokensOut: { increment: tokensOut },
    },
  })
  if (usage.count > DEMO_DAILY_LIMIT) {
    await prisma.demoUsage.update({
      where: { userId_date: { userId, date } },
      data: { count: { decrement: 1 } },
    })
    throw new QuotaExceededError(0)
  }
  return { count: usage.count, remaining: DEMO_DAILY_LIMIT - usage.count }
}
