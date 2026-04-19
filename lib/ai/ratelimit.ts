import { redis } from '@/lib/redis'
import { RateLimitError } from './types'

/**
 * 基于 Redis INCR + EXPIRE 的固定窗口限流。
 * windowSec 秒内最多 max 次。
 */
export async function consumeToken(
  key: string,
  max = 10,
  windowSec = 60,
): Promise<{ remaining: number }> {
  const bucketKey = `rl:${key}`
  const current = await redis.incr(bucketKey)
  if (current === 1) {
    await redis.expire(bucketKey, windowSec)
  }
  if (current > max) {
    const ttl = await redis.ttl(bucketKey)
    throw new RateLimitError(Math.max(ttl, 1))
  }
  return { remaining: max - current }
}
