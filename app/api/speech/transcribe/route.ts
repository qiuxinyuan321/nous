import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { transcribeAudio, WhisperUnsupportedError } from '@/lib/ai/speech'
import { QuotaExceededError } from '@/lib/ai/types'
import { consumeDemoQuota } from '@/lib/ai/quota'
import { resolveProvider } from '@/lib/ai/providers'

const MAX_BYTES = 15 * 1024 * 1024 // 15 MB
const ACCEPTED = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/x-m4a',
]

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * 语音转写 API
 * -----------
 * POST /api/speech/transcribe  (multipart/form-data)
 *   file:      audio blob (≤ 15MB)
 *   language?: ISO-639-1 (例如 "zh", "en")
 *
 * Demo 用户每次消耗 1 次额度 (同文本 AI 共享配额)。
 * 不在此创建 idea,交给客户端拿到 transcript 后再走常规 POST /api/ideas。
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'INVALID_CONTENT_TYPE' }, { status: 400 })
  }

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  const language =
    typeof form?.get('language') === 'string' ? (form.get('language') as string) : undefined

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'MISSING_FILE' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'FILE_TOO_LARGE', limitBytes: MAX_BYTES }, { status: 413 })
  }
  if (file.type && !ACCEPTED.some((t) => file.type.startsWith(t))) {
    return NextResponse.json(
      { error: 'UNSUPPORTED_AUDIO_TYPE', got: file.type, accepted: ACCEPTED },
      { status: 415 },
    )
  }

  try {
    const provider = await resolveProvider(session.user.id)

    // Demo 用户: 占用一次额度 (不按时长计,最保守)
    if (provider.source === 'demo') {
      await consumeDemoQuota(session.user.id, 0, 0)
    }

    const result = await transcribeAudio(session.user.id, file, { language })
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: 'QUOTA_EXCEEDED', message: err.message }, { status: 429 })
    }
    if (err instanceof WhisperUnsupportedError) {
      return NextResponse.json(
        { error: 'WHISPER_UNSUPPORTED', reason: err.reason, detail: err.detail },
        { status: 501 },
      )
    }
    console.error('[transcribe] error', err)
    return NextResponse.json(
      { error: 'TRANSCRIPTION_FAILED', message: (err as Error).message },
      { status: 500 },
    )
  }
}
