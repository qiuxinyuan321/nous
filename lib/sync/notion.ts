import { Client, isFullPage } from '@notionhq/client'
import { prisma } from '@/lib/db'
import { decrypt, encrypt } from '@/lib/crypto'

export interface NotionStatus {
  connected: boolean
  databaseId?: string
  lastSyncedAt?: string | null
}

export async function getNotionStatus(userId: string): Promise<NotionStatus> {
  const row = await prisma.notionConnection.findUnique({ where: { userId } })
  if (!row) return { connected: false }
  return {
    connected: true,
    databaseId: row.databaseId,
    lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
  }
}

export async function saveNotionConnection(userId: string, token: string, databaseId: string) {
  const payload = encrypt(token)
  await prisma.notionConnection.upsert({
    where: { userId },
    create: {
      userId,
      tokenCipher: payload.cipher,
      tokenIv: payload.iv,
      tokenTag: payload.tag,
      databaseId,
    },
    update: {
      tokenCipher: payload.cipher,
      tokenIv: payload.iv,
      tokenTag: payload.tag,
      databaseId,
    },
  })
}

export async function disconnectNotion(userId: string) {
  await prisma.notionConnection.deleteMany({ where: { userId } })
}

async function getClient(userId: string) {
  const row = await prisma.notionConnection.findUnique({ where: { userId } })
  if (!row) return null
  const token = decrypt({ cipher: row.tokenCipher, iv: row.tokenIv, tag: row.tokenTag })
  return { client: new Client({ auth: token }), databaseId: row.databaseId }
}

/** 测试 token + database 能访问。 */
export async function testNotionConnection(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const conn = await getClient(userId)
  if (!conn) return { ok: false, error: 'NOT_CONFIGURED' }
  try {
    await conn.client.databases.retrieve({ database_id: conn.databaseId })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message.slice(0, 200) }
  }
}

interface PushIdeaInput {
  idea: {
    id: string
    title: string | null
    rawContent: string
    refinedSummary: string | null
    status: string
    tags: string[]
    createdAt: Date
  }
  plan?: {
    goal: string
    firstAction: string
    successCriteria: string[]
    risks: string[]
  } | null
}

/**
 * 把一个 Idea 推到 Notion 数据库。数据库要求以下 property (用户需手动建):
 *   Name (title), Status (select), Tags (multi_select), Source (url), First Action (rich_text),
 *   Goal (rich_text), Created (date)
 * 只要 Name 必填,其他可选;本函数按属性名填,缺失的属性 Notion 会忽略(返 400 时重试一次仅带 Name)。
 */
export async function pushIdeaToNotion(
  userId: string,
  input: PushIdeaInput,
  siteUrl?: string,
): Promise<{ ok: true; pageUrl: string } | { ok: false; error: string }> {
  const conn = await getClient(userId)
  if (!conn) return { ok: false, error: 'NOT_CONFIGURED' }

  const title = input.idea.title ?? input.idea.rawContent.split('\n')[0]?.slice(0, 60) ?? 'Untitled'
  const summary =
    input.idea.refinedSummary ??
    input.idea.rawContent.slice(0, 1800) + (input.idea.rawContent.length > 1800 ? '…' : '')
  const sourceUrl = siteUrl ? `${siteUrl}/inbox` : undefined

  const properties: Record<string, unknown> = {
    Name: { title: [{ type: 'text', text: { content: title } }] },
  }
  if (input.idea.tags.length > 0) {
    properties.Tags = {
      multi_select: input.idea.tags.slice(0, 12).map((name) => ({ name: name.slice(0, 100) })),
    }
  }
  properties.Status = { select: { name: input.idea.status } }
  properties.Created = { date: { start: input.idea.createdAt.toISOString() } }
  if (input.plan?.goal) {
    properties.Goal = {
      rich_text: [{ type: 'text', text: { content: input.plan.goal.slice(0, 2000) } }],
    }
  }
  if (input.plan?.firstAction) {
    properties['First Action'] = {
      rich_text: [{ type: 'text', text: { content: input.plan.firstAction.slice(0, 2000) } }],
    }
  }
  if (sourceUrl) {
    properties.Source = { url: sourceUrl }
  }

  const children: Array<Record<string, unknown>> = []
  if (summary) {
    children.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: summary } }] },
    })
  }
  if (input.plan) {
    children.push({
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: 'Plan' } }] },
    })
    children.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: `Goal: ${input.plan.goal}` } }],
      },
    })
    if (input.plan.firstAction) {
      children.push({
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [{ type: 'text', text: { content: `First: ${input.plan.firstAction}` } }],
          checked: false,
        },
      })
    }
    for (const c of input.plan.successCriteria) {
      children.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ type: 'text', text: { content: c } }] },
      })
    }
  }

  try {
    const page = await conn.client.pages.create({
      parent: { database_id: conn.databaseId },
      properties: properties as Parameters<typeof conn.client.pages.create>[0]['properties'],
      children: children as Parameters<typeof conn.client.pages.create>[0]['children'],
    })
    const url = isFullPage(page) ? page.url : ''
    await prisma.notionConnection.update({
      where: { userId },
      data: { lastSyncedAt: new Date() },
    })
    return { ok: true, pageUrl: url }
  } catch (e) {
    return { ok: false, error: (e as Error).message.slice(0, 300) }
  }
}
