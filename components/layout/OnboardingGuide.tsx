'use client'

import { useCallback, useState } from 'react'

const STORAGE_KEY = 'nous-onboarding-seen'

interface Step {
  icon: string
  title: string
  desc: string
}

const STEPS: Step[] = [
  {
    icon: '🏠',
    title: '工作台',
    desc: '你的主页。左侧是想法收件箱，右侧是今日聚焦——输入和输出一目了然。按 ⌘K 随时录入新想法。',
  },
  {
    icon: '💬',
    title: 'AI 对话',
    desc: '点击想法卡片进入对话，AI 会用苏格拉底式提问帮你把模糊的念头理清楚。',
  },
  {
    icon: '📋',
    title: '方案生成',
    desc: '对话够了，一键生成可执行方案——目标、里程碑、任务，全部拆好。',
  },
  {
    icon: '📓',
    title: '笔记',
    desc: '随时记录想法、参考资料。支持 Markdown 和双向链接。',
  },
  {
    icon: '�',
    title: '复盘与记忆',
    desc: 'AI 每周复盘你的节奏，长期记忆帮你越聊越懂自己。',
  },
]

export function OnboardingGuide() {
  // 用 lazy init 判定首次访问，避免在 effect 内 setState 触发级联渲染
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(STORAGE_KEY)
  })
  const [step, setStep] = useState(0)

  const dismiss = useCallback(() => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }, [])

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else dismiss()
  }

  const prev = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  if (!visible) return null

  const current = STEPS[step]!

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-paper-rice border-ink-light/30 mx-4 w-full max-w-md rounded-sm border shadow-xl">
        {/* Header */}
        <div className="border-ink-light/20 border-b px-6 pt-6 pb-4">
          <h2 className="font-serif-cn text-ink-heavy text-xl">欢迎使用 Nous</h2>
          <p className="text-ink-light mt-1 text-sm">让想法，落地 — 快速了解核心功能</p>
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          <div className="text-4xl">{current.icon}</div>
          <h3 className="font-serif-cn text-ink-heavy mt-4 text-lg font-medium">{current.title}</h3>
          <p className="text-ink-medium mt-3 text-sm leading-relaxed">{current.desc}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 px-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'bg-ink-heavy w-6' : 'bg-ink-light/30 hover:bg-ink-light/50 w-2'
              }`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 pt-4 pb-6">
          <button
            onClick={dismiss}
            className="text-ink-light hover:text-ink-medium text-sm transition"
          >
            跳过
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="border-ink-light/40 text-ink-medium hover:border-ink-heavy hover:text-ink-heavy rounded-sm border px-4 py-1.5 text-sm transition"
              >
                上一步
              </button>
            )}
            <button
              onClick={next}
              className="bg-ink-heavy hover:bg-ink-medium rounded-sm px-5 py-1.5 text-sm text-[color:var(--paper-rice)] transition"
            >
              {step < STEPS.length - 1 ? '下一步' : '开始使用'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
