'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type VoiceStatus = 'idle' | 'requesting-permission' | 'recording' | 'transcribing' | 'error'

interface VoiceCaptureOptions {
  /** 最长录制时长 (秒),超时自动停止。默认 180s */
  maxDurationSec?: number
  /** ISO-639-1 语言提示 (可选, 例 "zh"/"en") */
  language?: string
}

interface VoiceCaptureState {
  status: VoiceStatus
  elapsedSec: number
  /** 麦克风实时音量 0~1,用于波形动效 */
  level: number
  error: string | null
}

export interface UseVoiceCapture extends VoiceCaptureState {
  start: () => Promise<void>
  stop: () => Promise<string | null>
  cancel: () => void
  supported: boolean
}

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
]

function pickMime(): string | null {
  if (typeof MediaRecorder === 'undefined') return null
  for (const m of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(m)) return m
  }
  return null
}

/**
 * useVoiceCapture
 * ---------------
 * 浏览器端麦克风录音 → 上传 /api/speech/transcribe → 返回转写文本。
 *
 * 使用:
 *   const v = useVoiceCapture()
 *   await v.start()       // 请求权限 & 开始录音
 *   const text = await v.stop()  // 停止 & 转写,返回 text
 *   v.cancel()            // 丢弃当前录音
 */
export function useVoiceCapture(opts: VoiceCaptureOptions = {}): UseVoiceCapture {
  const { maxDurationSec = 180, language } = opts

  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [elapsedSec, setElapsedSec] = useState(0)
  const [level, setLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<number>(0)
  const cancelledRef = useRef(false)

  const supported =
    typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && !!pickMime()

  const cleanup = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {})
    }
    audioCtxRef.current = null
    analyserRef.current = null
    recorderRef.current = null
    chunksRef.current = []
    setLevel(0)
    setElapsedSec(0)
  }, [])

  useEffect(() => cleanup, [cleanup])

  const start = useCallback(async () => {
    if (!supported) {
      setStatus('error')
      setError('NOT_SUPPORTED')
      return
    }
    cancelledRef.current = false
    setError(null)
    setStatus('requesting-permission')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      })
      streamRef.current = stream

      const mime = pickMime()!
      const recorder = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 64_000 })
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.addEventListener('dataavailable', (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      })

      // 音量分析 (波形动效)
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AC()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      src.connect(analyser)
      audioCtxRef.current = ctx
      analyserRef.current = analyser

      const buf = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteTimeDomainData(buf)
        // RMS 归一化到 0~1
        let sum = 0
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / buf.length)
        setLevel(Math.min(1, rms * 2.8))
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)

      startedAtRef.current = performance.now()
      timerRef.current = setInterval(() => {
        const sec = Math.floor((performance.now() - startedAtRef.current) / 1000)
        setElapsedSec(sec)
        if (sec >= maxDurationSec && recorderRef.current?.state === 'recording') {
          recorderRef.current.stop()
        }
      }, 250)

      recorder.start(250)
      setStatus('recording')
    } catch (err) {
      cleanup()
      setStatus('error')
      const name = (err as { name?: string })?.name
      setError(
        name === 'NotAllowedError' || name === 'PermissionDeniedError'
          ? 'PERMISSION_DENIED'
          : name === 'NotFoundError'
            ? 'NO_DEVICE'
            : 'GETUSERMEDIA_FAILED',
      )
    }
  }, [cleanup, maxDurationSec, supported])

  const stop = useCallback(async (): Promise<string | null> => {
    const recorder = recorderRef.current
    if (!recorder) return null

    const mime = recorder.mimeType || 'audio/webm'

    // 等录制结束
    const blob: Blob = await new Promise((resolve) => {
      const finalize = () => {
        const b = new Blob(chunksRef.current, { type: mime })
        resolve(b)
      }
      if (recorder.state === 'inactive') finalize()
      else {
        recorder.addEventListener('stop', finalize, { once: true })
        recorder.stop()
      }
    })

    // 停止音量追踪
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())

    if (cancelledRef.current || blob.size === 0) {
      cleanup()
      setStatus('idle')
      return null
    }

    setStatus('transcribing')
    try {
      const ext = mime.includes('webm')
        ? 'webm'
        : mime.includes('ogg')
          ? 'ogg'
          : mime.includes('mp4')
            ? 'm4a'
            : 'wav'
      const form = new FormData()
      form.append('file', new File([blob], `voice.${ext}`, { type: mime }))
      if (language) form.append('language', language)

      const res = await fetch('/api/speech/transcribe', { method: 'POST', body: form })
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(errBody.error ?? `HTTP_${res.status}`)
      }
      const data = (await res.json()) as { text: string }
      cleanup()
      setStatus('idle')
      return data.text
    } catch (err) {
      cleanup()
      setStatus('error')
      setError((err as Error).message || 'TRANSCRIPTION_FAILED')
      return null
    }
  }, [cleanup, language])

  const cancel = useCallback(() => {
    cancelledRef.current = true
    const r = recorderRef.current
    if (r && r.state === 'recording') r.stop()
    cleanup()
    setStatus('idle')
    setError(null)
  }, [cleanup])

  return { status, elapsedSec, level, error, start, stop, cancel, supported }
}
