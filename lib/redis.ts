import Redis from 'ioredis'

declare global {
  var __nousRedis: Redis | undefined
}

/**
 * ioredis 单例。
 * 与 Prisma 同理：开发模式挂 globalThis 避免 HMR 连接泄漏。
 * 默认 127.0.0.1:6379（避开 Windows IPv6 localhost 陷阱）。
 */
export const redis: Redis =
  globalThis.__nousRedis ??
  new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: false,
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__nousRedis = redis
}
