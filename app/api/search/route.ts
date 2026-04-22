import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { search, SEARCHABLE_TYPES, type SearchEntityType } from '@/lib/search'

/**
 * GET /api/search?q=...&limit=20&semantic=true&types=idea,note
 *
 * 返回 SearchResponse · 前端消费 EntityRef[] + score + matchedField + highlight
 *
 * 设计：
 * - GET 方法 · 便于分享 / 刷新 · query 长度限制 500 字
 * - query 短于 2 字符时直接返回空（避免无意义宽扫）
 * - filters.types 来自 query string "types=idea,note"，和 prefix 解析结果做交集
 * - semantic=false 时仅跑 fulltext
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const raw = searchParams.get('q') ?? ''
  const q = raw.slice(0, 500).trim()

  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 20), 1), 50)
  const semantic = searchParams.get('semantic') !== 'false'

  const typesParam = searchParams.get('types')
  const types = parseTypes(typesParam)

  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')
  const from = fromParam ? safeDate(fromParam) : undefined
  const to = toParam ? safeDate(toParam) : undefined

  if (q.length < 2) {
    return NextResponse.json({
      results: [],
      filters: { types, from, to },
      used: { fulltext: false, semantic: false },
      elapsedMs: 0,
    })
  }

  try {
    const response = await search({
      userId: session.user.id,
      query: q,
      filters: { types, from, to },
      limit,
      semantic,
    })
    return NextResponse.json(response)
  } catch (err) {
    console.error('[search] error:', err)
    return NextResponse.json({ error: 'SEARCH_FAILED' }, { status: 500 })
  }
}

function parseTypes(raw: string | null): SearchEntityType[] | undefined {
  if (!raw) return undefined
  const valid = new Set<string>(SEARCHABLE_TYPES)
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => valid.has(s)) as SearchEntityType[]
  return parts.length ? parts : undefined
}

function safeDate(raw: string): Date | undefined {
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? undefined : d
}
