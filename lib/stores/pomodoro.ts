'use client'

import { create } from 'zustand'

type Mode = 'work' | 'break' | 'idle'

interface PomodoroState {
  mode: Mode
  running: boolean
  remaining: number // 秒
  workMinutes: number
  breakMinutes: number
  activeTaskId: string | null

  /** 设置当前正在专注的任务 */
  setTask: (taskId: string | null) => void
  /** 开始工作番茄 */
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  /** 内部：每秒 tick */
  tick: () => void
  /** 内部：切换到休息 */
  switchToBreak: () => void
  /** 内部：切换到工作 */
  switchToWork: () => void
  /** 设置时长（分钟） */
  configure: (work: number, brk: number) => void
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  mode: 'idle',
  running: false,
  remaining: 25 * 60,
  workMinutes: 25,
  breakMinutes: 5,
  activeTaskId: null,

  setTask: (taskId) => set({ activeTaskId: taskId }),

  start: () =>
    set((s) => ({
      mode: 'work',
      remaining: s.workMinutes * 60,
      running: true,
    })),

  pause: () => set({ running: false }),
  resume: () => set({ running: true }),

  reset: () =>
    set((s) => ({
      mode: 'idle',
      running: false,
      remaining: s.workMinutes * 60,
    })),

  tick: () => {
    const { remaining, running, mode } = get()
    if (!running || mode === 'idle') return
    if (remaining > 1) {
      set({ remaining: remaining - 1 })
      return
    }
    // 倒计时归零，自动切换
    if (mode === 'work') {
      get().switchToBreak()
    } else {
      get().switchToWork()
    }
  },

  switchToBreak: () =>
    set((s) => ({
      mode: 'break',
      remaining: s.breakMinutes * 60,
      running: true,
    })),

  switchToWork: () =>
    set((s) => ({
      mode: 'work',
      remaining: s.workMinutes * 60,
      running: false, // 休息完主动确认
    })),

  configure: (work, brk) =>
    set((s) => ({
      workMinutes: work,
      breakMinutes: brk,
      remaining: s.mode === 'idle' ? work * 60 : s.remaining,
    })),
}))

/** 格式化剩余秒数为 MM:SS */
export function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
