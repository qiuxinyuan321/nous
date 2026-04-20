import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { importMarkdownFiles } from '@/lib/sync/obsidian'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FILES = 200
const MAX_TOTAL = 10 * 1024 * 1024 // 10MB

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'INVALID_FORM' }, { status: 400 })
  const entries = form.getAll('files')
  if (entries.length === 0) {
    return NextResponse.json({ error: 'NO_FILES' }, { status: 400 })
  }
  if (entries.length > MAX_FILES) {
    return NextResponse.json({ error: 'TOO_MANY_FILES', limit: MAX_FILES }, { status: 413 })
  }

  let total = 0
  const files: Array<{ name: string; content: string }> = []
  for (const entry of entries) {
    if (!(entry instanceof File)) continue
    if (!entry.name.toLowerCase().endsWith('.md')) continue
    total += entry.size
    if (total > MAX_TOTAL) {
      return NextResponse.json({ error: 'PAYLOAD_TOO_LARGE', limit: MAX_TOTAL }, { status: 413 })
    }
    const content = await entry.text()
    files.push({ name: entry.name, content })
  }

  if (files.length === 0) {
    return NextResponse.json({ error: 'NO_MD_FILES' }, { status: 400 })
  }

  const result = await importMarkdownFiles(session.user.id, files)
  return NextResponse.json(result)
}
