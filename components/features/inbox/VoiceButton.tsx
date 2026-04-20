'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { useVoiceCapture } from '@/lib/hooks/useVoiceCapture'
import { cn } from '@/lib/utils'

interface VoiceButtonProps {
  /** 转写完成后的 text (若失败为 null) */
  onTranscript: (text: string | null) => void
  className?: string
  /** ISO-639-1 语言提示 */
  language?: string
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * 麦克风按钮
 * ---------
 * idle 态: 圆形墨色按钮 + 麦克风图标
 * recording 态: 展开为胶囊,显示时长 + 波形
 * transcribing 态: 三点墨滴 loading
 */
export function VoiceButton({ onTranscript, className, language }: VoiceButtonProps) {
  const t = useTranslations('inbox.voice')
  const v = useVoiceCapture({ language })

  if (!v.supported) {
    return null
  }

  const busy =
    v.status === 'recording' || v.status === 'transcribing' || v.status === 'requesting-permission'

  async function handleClick() {
    if (v.status === 'idle' || v.status === 'error') {
      await v.start()
      return
    }
    if (v.status === 'recording') {
      const text = await v.stop()
      onTranscript(text)
    }
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation()
    v.cancel()
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <motion.button
        type="button"
        onClick={handleClick}
        aria-label={t(v.status === 'recording' ? 'stop' : 'start')}
        aria-pressed={v.status === 'recording'}
        disabled={v.status === 'transcribing' || v.status === 'requesting-permission'}
        layout
        className={cn(
          'font-serif-en group relative inline-flex h-9 items-center justify-center gap-2 rounded-full text-xs transition-colors',
          v.status === 'recording'
            ? 'bg-cinnabar text-paper-rice pr-3 pl-2 shadow-[0_0_0_4px_rgba(184,55,47,0.18)]'
            : v.status === 'transcribing'
              ? 'bg-ink-heavy/90 text-paper-rice w-9'
              : 'border-ink-light/60 text-ink-medium hover:border-ink-heavy hover:text-ink-heavy w-9 border bg-transparent',
        )}
      >
        {/* 录音波纹 (recording 态) */}
        {v.status === 'recording' && (
          <>
            <motion.span
              aria-hidden
              className="bg-cinnabar/50 absolute inset-0 rounded-full"
              animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            />
            <span className="relative flex h-5 w-5 items-center justify-center">
              {/* stop icon 方块 */}
              <span className="bg-paper-rice h-2.5 w-2.5 rounded-sm" />
            </span>
            <span className="relative tabular-nums">{fmt(v.elapsedSec)}</span>
            <span
              className="bg-paper-rice/80 relative h-3 rounded-full transition-[width] duration-75"
              style={{ width: 4 + v.level * 28 }}
              aria-hidden
            />
          </>
        )}

        {/* transcribing loading */}
        {v.status === 'transcribing' && (
          <span className="relative flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="bg-paper-rice h-1.5 w-1.5 rounded-full"
                animate={{ y: [0, -3, 0], opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12 }}
              />
            ))}
          </span>
        )}

        {/* idle / requesting 态: 麦克风图标 */}
        {(v.status === 'idle' || v.status === 'error' || v.status === 'requesting-permission') && (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
            <path
              d="M12 3a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V6a3 3 0 0 0-3-3Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        )}
      </motion.button>

      {/* 录音中显示取消按钮 */}
      {v.status === 'recording' && (
        <button
          type="button"
          onClick={handleCancel}
          className="text-ink-light hover:text-ink-heavy text-xs transition"
          aria-label={t('cancel')}
        >
          {t('cancel')}
        </button>
      )}

      {/* 错误信息 */}
      {v.status === 'error' && v.error && (
        <span className="text-cinnabar max-w-[180px] truncate text-xs">
          {v.error === 'PERMISSION_DENIED'
            ? t('permissionDenied')
            : v.error === 'NOT_SUPPORTED'
              ? t('notSupported')
              : v.error === 'WHISPER_UNSUPPORTED'
                ? t('providerUnsupported')
                : v.error === 'QUOTA_EXCEEDED'
                  ? t('quotaExceeded')
                  : t('failed')}
        </span>
      )}

      {!busy && v.status === 'idle' && (
        <span className="text-ink-light text-[11px]">{t('hint')}</span>
      )}
    </div>
  )
}
