'use client'

import { create } from 'zustand'

export type PaletteInitialMode = 'command' | 'search'

interface PaletteState {
  open: boolean
  /** 面板打开时应进入哪个模式 · PaletteBody 初始化后即消费归零 */
  initialMode: PaletteInitialMode
  openPalette: () => void
  openSearch: () => void
  closePalette: () => void
  togglePalette: () => void
  /** PaletteBody 消费 initialMode 后调用，重置为默认 */
  consumeInitialMode: () => void
}

export const usePaletteStore = create<PaletteState>((set) => ({
  open: false,
  initialMode: 'command',
  openPalette: () => set({ open: true, initialMode: 'command' }),
  openSearch: () => set({ open: true, initialMode: 'search' }),
  closePalette: () => set({ open: false, initialMode: 'command' }),
  togglePalette: () => set((s) => ({ open: !s.open, initialMode: 'command' })),
  consumeInitialMode: () => set({ initialMode: 'command' }),
}))
