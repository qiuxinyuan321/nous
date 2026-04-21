'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatRemaining, usePomodoroStore } from '@/lib/stores/pomodoro'

const POMODORO_CHEERS = [
  '一轮完成！你的专注力正在积累。',
  '又一个番茄收入囊中。',
  '25 分钟的深度工作，值得骄傲。',
  '休息一下，回来继续乘胜追击。',
  '专注是一种超能力，你正在练习它。',
]

interface PomodoroProps {
  activeTaskTitle?: string | null
}

export function Pomodoro({ activeTaskTitle }: PomodoroProps) {
  const mode = usePomodoroStore((s) => s.mode)
  const running = usePomodoroStore((s) => s.running)
  const remaining = usePomodoroStore((s) => s.remaining)
  const workMinutes = usePomodoroStore((s) => s.workMinutes)
  const start = usePomodoroStore((s) => s.start)
  const pause = usePomodoroStore((s) => s.pause)
  const resume = usePomodoroStore((s) => s.resume)
  const reset = usePomodoroStore((s) => s.reset)
  const tick = usePomodoroStore((s) => s.tick)

  // 每秒 tick
  const prevMode = useRef<typeof mode>(mode)
  useEffect(() => {
    if (!running) return
    const h = window.setInterval(() => tick(), 1000)
    return () => window.clearInterval(h)
  }, [running, tick])

  const [pomodoroToast, setPomodoroToast] = useState<string | null>(null)

  // mode 切换时推送通知 + 声音 + 激励
  useEffect(() => {
    if (prevMode.current === mode) return
    const from = prevMode.current
    prevMode.current = mode
    if (from === 'work' && mode === 'break') {
      notify('一轮专注完成', '休息 5 分钟')
      beep()
      const msg = POMODORO_CHEERS[Math.floor(Math.random() * POMODORO_CHEERS.length)]
      setPomodoroToast(msg)
      setTimeout(() => setPomodoroToast(null), 3000)
    } else if (from === 'break' && mode === 'work') {
      notify('休息结束', '开始下一轮')
      beep()
    }
  }, [mode])

  // 请求通知权限
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  const isIdle = mode === 'idle'
  const isWorking = mode === 'work' && running
  const isPausedWork = mode === 'work' && !running
  const isBreak = mode === 'break'

  // 进度环
  const total = mode === 'break' ? usePomodoroStore.getState().breakMinutes * 60 : workMinutes * 60
  const progress = total > 0 ? 1 - remaining / total : 0
  const circumference = 2 * Math.PI * 72

  return (
    <div className="border-ink-light/20 bg-paper-aged/40 rounded-sm border p-8">
      <div className="flex flex-col items-center gap-4">
        {/* 进度环 + 时间 */}
        <div className="relative">
          <svg width="180" height="180" className="-rotate-90">
            <circle
              cx="90"
              cy="90"
              r="72"
              fill="none"
              stroke="var(--ink-light)"
              strokeOpacity="0.2"
              strokeWidth="2"
            />
            <motion.circle
              cx="90"
              cy="90"
              r="72"
              fill="none"
              stroke={isBreak ? 'var(--celadon)' : 'var(--cinnabar)'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <AnimatePresence mode="wait">
              <motion.span
                key={isBreak ? 'break' : 'work'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-ink-light text-[10px] tracking-[0.3em] uppercase"
              >
                {isIdle ? '未开始' : isBreak ? '休息' : '专注'}
              </motion.span>
            </AnimatePresence>
            <span className="text-ink-heavy font-mono text-4xl font-light tabular-nums">
              {formatRemaining(remaining)}
            </span>
            {activeTaskTitle && (
              <span className="font-serif-cn text-ink-medium mt-1 max-w-[140px] truncate px-2 text-center text-xs">
                {activeTaskTitle}
              </span>
            )}
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center gap-3">
          {isIdle && (
            <button
              onClick={start}
              className="bg-cinnabar hover:bg-cinnabar/90 font-serif-cn text-paper-rice rounded-sm px-6 py-2 text-sm transition"
            >
              开始专注
            </button>
          )}
          {isWorking && (
            <button
              onClick={pause}
              className="border-ink-heavy/40 text-ink-heavy hover:bg-ink-heavy/5 font-serif-cn rounded-sm border px-6 py-2 text-sm transition"
            >
              暂停
            </button>
          )}
          {isPausedWork && (
            <>
              <button
                onClick={resume}
                className="bg-cinnabar hover:bg-cinnabar/90 font-serif-cn text-paper-rice rounded-sm px-6 py-2 text-sm transition"
              >
                继续
              </button>
              <button
                onClick={reset}
                className="text-ink-light hover:text-ink-medium rounded-sm px-4 py-2 text-sm transition"
              >
                放弃
              </button>
            </>
          )}
          {isBreak && (
            <button
              onClick={reset}
              className="border-celadon/60 text-celadon hover:bg-celadon/10 font-serif-cn rounded-sm border px-6 py-2 text-sm transition"
            >
              结束休息
            </button>
          )}
        </div>

        {/* 番茄钟完成激励 */}
        <AnimatePresence>
          {pomodoroToast && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-celadon/10 border-celadon/30 text-celadon font-serif-cn mt-4 rounded-sm border px-4 py-2 text-center text-xs"
            >
              🍅 {pomodoroToast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function notify(title: string, body: string) {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/favicon.ico', tag: 'pomodoro' })
  } catch {
    /* ignore */
  }
}

function beep() {
  if (typeof window === 'undefined') return
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 660
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
    osc.onended = () => ctx.close().catch(() => {})
  } catch {
    /* ignore */
  }
}
