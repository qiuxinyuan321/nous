/**
 * Prisma Seed · 种子数据
 * 运行: pnpm prisma:seed
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding …')

  const demo = await prisma.user.upsert({
    where: { email: 'demo@nous.dev' },
    update: {},
    create: {
      email: 'demo@nous.dev',
      name: 'Demo User',
      settings: { create: { locale: 'zh-CN', theme: 'rice' } },
    },
    include: { settings: true },
  })

  const idea = await prisma.idea.upsert({
    where: { id: 'seed-idea-1' },
    update: {},
    create: {
      id: 'seed-idea-1',
      userId: demo.id,
      title: '示例想法',
      rawContent: '我想做一个帮助 INTP 把想法落地的工具…',
      status: 'raw',
      tags: ['demo', 'intp'],
    },
  })

  console.log(`✓ User ${demo.email}`)
  console.log(`✓ Idea ${idea.id}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
