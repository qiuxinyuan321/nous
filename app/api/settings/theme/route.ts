import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { THEME_CATALOG } from '@/lib/themes/catalog'

const bodySchema = z.object({
  themeId: z.enum(THEME_CATALOG.map((t) => t.id) as [string, ...string[]]),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, theme: parsed.data.themeId },
    update: { theme: parsed.data.themeId },
  })

  return NextResponse.json({ ok: true })
}
