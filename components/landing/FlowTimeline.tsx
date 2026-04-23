import type { CSSProperties } from 'react'

export interface FlowStep {
  key: string
  title: string
  desc: string
}

/**
 * 流程时间线 · 服务端组件 · 零 JS
 *
 * 历史：旧版用 `motion.li + whileInView + initial opacity:0`，
 * 依赖 IntersectionObserver 触发可见。用户快速滚动进入该 section 时
 * observer 在连续帧里 miss · li 保持 opacity:0 = 视觉"空白"。
 *
 * 现在：和 {@link Reveal} 对齐
 * - SSR 直出 opacity:1 · 内容立刻可见
 * - 用 `animate-revealUp` CSS keyframe + `animationDelay` 做微上浮
 * - `motion-safe:` 前缀尊重 prefers-reduced-motion
 * - 零 framer-motion / 零 hydration 风险
 */
export function FlowTimeline({ steps }: { steps: FlowStep[] }) {
  return (
    <ol className="relative mx-auto max-w-3xl space-y-9 pl-10 md:pl-14">
      <span
        className="from-ink-heavy/50 via-ink-light/30 pointer-events-none absolute top-2 bottom-2 left-3 w-px bg-gradient-to-b to-transparent md:left-5"
        aria-hidden
      />

      {steps.map((step, idx) => {
        const style: CSSProperties = { animationDelay: `${idx * 0.08}s` }
        return (
          <li key={step.key} className="motion-safe:animate-revealUp relative" style={style}>
            <span
              className="bg-ink-heavy text-paper-rice font-serif-en absolute top-0.5 left-[-2.5rem] flex h-7 w-7 items-center justify-center rounded-full text-xs shadow-[0_0_0_4px_var(--paper-rice)] md:left-[-3rem] md:h-8 md:w-8 md:text-sm"
              aria-hidden
            >
              {idx + 1}
            </span>

            <h3 className="font-serif-cn text-ink-heavy text-base font-medium md:text-lg">
              {step.title}
            </h3>
            <p className="text-ink-medium mt-1.5 text-sm leading-relaxed">{step.desc}</p>
          </li>
        )
      })}
    </ol>
  )
}
