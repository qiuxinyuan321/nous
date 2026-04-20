import JSZip from 'jszip'
import { prisma } from '@/lib/db'

function safeFilename(s: string) {
  return (
    s
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'untitled'
  )
}

function toFrontmatter(map: Record<string, unknown>): string {
  const lines: string[] = ['---']
  for (const [k, v] of Object.entries(map)) {
    if (v == null || v === '') continue
    if (Array.isArray(v)) {
      if (v.length === 0) continue
      lines.push(`${k}:`)
      for (const item of v) lines.push(`  - ${JSON.stringify(String(item))}`)
      continue
    }
    if (v instanceof Date) {
      lines.push(`${k}: ${v.toISOString()}`)
      continue
    }
    lines.push(`${k}: ${JSON.stringify(String(v))}`)
  }
  lines.push('---')
  return lines.join('\n')
}

/**
 * 导出用户全部非归档 Idea 为 Obsidian-friendly zip。
 * - 每个 Idea 一个 .md: frontmatter + raw + refined + plan + 对话
 * - 子目录按 status 分
 */
export async function exportUserIdeasAsZip(userId: string): Promise<Buffer> {
  const ideas = await prisma.idea.findMany({
    where: { userId, status: { not: 'archived' } },
    orderBy: { createdAt: 'desc' },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      plan: { include: { milestones: { include: { tasks: true }, orderBy: { orderIdx: 'asc' } } } },
    },
  })

  const zip = new JSZip()
  const root = zip.folder('nous-export')!
  root.file(
    'README.md',
    [
      '# Nous Export',
      '',
      `Exported at ${new Date().toISOString()}`,
      `Total ideas: ${ideas.length}`,
      '',
      'Each file is an Obsidian-friendly Markdown note with YAML frontmatter.',
      'Drop this folder into your vault as a subfolder — or merge into an existing one.',
    ].join('\n'),
  )

  for (const idea of ideas) {
    const title = idea.title ?? idea.rawContent.split('\n')[0]?.slice(0, 40) ?? 'Untitled'
    const fm = toFrontmatter({
      id: idea.id,
      title,
      status: idea.status,
      tags: idea.tags,
      created: idea.createdAt,
      updated: idea.updatedAt,
      hasPlan: !!idea.plan,
      source: 'nous',
    })

    const body: string[] = [fm, '', `# ${title}`, '']

    body.push('## Raw', '', idea.rawContent, '')
    if (idea.refinedSummary) body.push('## Refined', '', idea.refinedSummary, '')

    if (idea.plan) {
      body.push('## Plan', '', `**Goal**: ${idea.plan.goal}`, '')
      body.push(`**First Action**: ${idea.plan.firstAction}`, '')
      const crit = Array.isArray(idea.plan.successCriteria)
        ? (idea.plan.successCriteria as string[])
        : []
      if (crit.length > 0) {
        body.push('**Success Criteria**:')
        for (const c of crit) body.push(`- ${c}`)
        body.push('')
      }
      const risks = Array.isArray(idea.plan.risks) ? (idea.plan.risks as string[]) : []
      if (risks.length > 0) {
        body.push('**Risks**:')
        for (const r of risks) body.push(`- ${r}`)
        body.push('')
      }
      for (const m of idea.plan.milestones) {
        body.push(`### Milestone · ${m.title}`, '')
        for (const task of m.tasks) {
          const mark = task.status === 'done' ? '[x]' : '[ ]'
          body.push(
            `- ${mark} ${task.title}${task.estimatedMin ? ` _(~${task.estimatedMin}m)_` : ''}`,
          )
        }
        body.push('')
      }
    }

    if (idea.messages.length > 0) {
      body.push('## Dialogue', '')
      for (const m of idea.messages) {
        body.push(`**${m.role}** · ${m.phase}`, '', m.content, '')
      }
    }

    const subfolder = root.folder(idea.status)!
    subfolder.file(`${safeFilename(title)}-${idea.id.slice(-6)}.md`, body.join('\n'))
  }

  return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}

/** 极简 YAML frontmatter 解析 (仅支持 string / string[] / date) */
export function parseFrontmatter(raw: string): {
  frontmatter: Record<string, unknown>
  body: string
} {
  if (!raw.startsWith('---')) return { frontmatter: {}, body: raw }
  const end = raw.indexOf('\n---', 3)
  if (end === -1) return { frontmatter: {}, body: raw }
  const head = raw.slice(3, end)
  const body = raw.slice(end + 4).replace(/^\r?\n/, '')

  const fm: Record<string, unknown> = {}
  const lines = head.split(/\r?\n/)
  let currentKey: string | null = null
  let list: string[] = []

  const flushList = () => {
    if (currentKey && list.length) fm[currentKey] = list
    currentKey = null
    list = []
  }

  for (const line of lines) {
    if (!line.trim()) continue
    // list continuation
    const listMatch = line.match(/^\s+-\s+(.*)$/)
    if (listMatch && currentKey) {
      list.push(unquote(listMatch[1]))
      continue
    }
    flushList()
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    const val = m[2]
    if (val === '') {
      currentKey = key
      list = []
      continue
    }
    fm[key] = unquote(val)
  }
  flushList()

  return { frontmatter: fm, body }
}

function unquote(s: string): string {
  const t = s.trim()
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    try {
      return JSON.parse(t.startsWith("'") ? `"${t.slice(1, -1).replace(/"/g, '\\"')}"` : t)
    } catch {
      return t.slice(1, -1)
    }
  }
  return t
}

export interface ImportedIdeaPreview {
  title: string
  status: string
  tags: string[]
  body: string
  existingId: string | null
}

const VALID_STATUS = new Set(['raw', 'refining', 'planned', 'executing', 'done'])

export async function importMarkdownFiles(
  userId: string,
  files: Array<{ name: string; content: string }>,
): Promise<{ created: number; skipped: number; errors: string[] }> {
  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (const file of files) {
    try {
      const { frontmatter: fm, body } = parseFrontmatter(file.content)
      const title =
        typeof fm.title === 'string' ? fm.title : file.name.replace(/\.md$/i, '').slice(0, 80)
      const status =
        typeof fm.status === 'string' && VALID_STATUS.has(fm.status) ? fm.status : 'raw'
      const tags = Array.isArray(fm.tags)
        ? (fm.tags as unknown[]).map((t) => String(t).slice(0, 40))
        : []

      // 若 frontmatter 里带 source=nous + 旧 id,说明是 Nous 自己导出的,跳过避免重复
      if (fm.source === 'nous' && typeof fm.id === 'string') {
        const exists = await prisma.idea.findFirst({
          where: { id: fm.id, userId },
          select: { id: true },
        })
        if (exists) {
          skipped++
          continue
        }
      }

      const rawContent = body.trim() || title

      await prisma.idea.create({
        data: {
          userId,
          title,
          rawContent: rawContent.slice(0, 30_000),
          status,
          tags,
        },
      })
      created++
    } catch (e) {
      errors.push(`${file.name}: ${(e as Error).message.slice(0, 160)}`)
    }
  }

  return { created, skipped, errors }
}
