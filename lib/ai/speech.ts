import { resolveProvider } from './providers'

export class WhisperUnsupportedError extends Error {
  name = 'WhisperUnsupportedError'
  constructor(
    public reason: 'anthropic' | 'http_error',
    public detail?: string,
  ) {
    super(`Whisper not supported: ${reason}${detail ? ' · ' + detail : ''}`)
  }
}

export interface TranscriptionResult {
  text: string
  language?: string
  durationSec?: number
}

/**
 * 复用 BYOK / Demo 解析出的 openai-compatible 凭证,
 * 走 `/audio/transcriptions` 端点 (OpenAI 官方 & 大多数兼容网关都支持)。
 *
 * Anthropic 本身不提供 Whisper,直接退出让上层提示用户切换。
 */
export async function transcribeAudio(
  userId: string,
  audio: File,
  opts: { language?: string } = {},
): Promise<TranscriptionResult> {
  const provider = await resolveProvider(userId)

  if (provider.kind === 'anthropic') {
    throw new WhisperUnsupportedError('anthropic')
  }

  const base = (provider.baseURL ?? 'https://api.openai.com/v1').replace(/\/$/, '')
  const url = `${base}/audio/transcriptions`

  const body = new FormData()
  body.append('file', audio)
  body.append('model', process.env.WHISPER_MODEL ?? 'whisper-1')
  body.append('response_format', 'verbose_json')
  if (opts.language) body.append('language', opts.language)

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${provider.apiKey}` },
    body,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new WhisperUnsupportedError('http_error', `${res.status} ${detail.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    text: string
    language?: string
    duration?: number
  }
  return {
    text: data.text?.trim() ?? '',
    language: data.language,
    durationSec: data.duration,
  }
}
