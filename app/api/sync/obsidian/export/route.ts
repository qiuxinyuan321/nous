import { auth } from '@/lib/auth'
import { exportUserIdeasAsZip } from '@/lib/sync/obsidian'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const buf = await exportUserIdeasAsZip(session.user.id)
  const date = new Date().toISOString().slice(0, 10)
  const filename = `nous-export-${date}.zip`

  // Buffer 可直接塞到 Response (会被当 Uint8Array 处理)
  const body = new Uint8Array(buf)

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buf.byteLength),
      'Cache-Control': 'no-store',
    },
  })
}
