import { PrismaClient } from '@prisma/client'

declare global {
  var __nousPrisma: PrismaClient | undefined
}

/**
 * Prisma Client 单例。
 * 在开发模式下挂到 globalThis 避免 HMR 热重载时连接泄漏。
 */
export const prisma: PrismaClient =
  globalThis.__nousPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__nousPrisma = prisma
}
