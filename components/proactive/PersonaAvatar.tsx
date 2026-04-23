import type { Persona } from '@/lib/proactive/personas'
import { cn } from '@/lib/utils'

interface Props {
  persona: Persona
  /** 印章边长 px · 默认 24 */
  size?: number
  className?: string
  /** title · 默认 `${persona.name}` · 鼠标 hover 可见 */
  title?: string
  /** -3 ~ +3 deg 随机手盖感 · 默认 `-2` */
  rotate?: number
}

/**
 * Persona 头像 · 统一入口
 * -----------------------------------------
 * - 有朱砂印章图（6 个 persona）：渲染透明底 webp · 略倾斜模拟手盖
 * - 无印章图（auto · Nous 本体）：渲染品牌字符 ◌
 *
 * 所有"展示 persona 身份"的 UI 都应使用本组件 · 不要再直接读 persona.avatar / persona.seal。
 * 唯一例外：`<option>` 里无法嵌入自定义 DOM · 继续使用 persona.avatar 纯字符。
 *
 * SSR 安全：纯静态渲染 · 无 effect · 无 localStorage 访问。
 */
export function PersonaAvatar({ persona, size = 24, className, title, rotate = -2 }: Props) {
  const label = title ?? persona.name

  if (persona.seal) {
    return (
      <span
        className={cn('inline-flex shrink-0 items-center justify-center leading-none', className)}
        style={{ width: size, height: size }}
        title={label}
        aria-hidden
      >
        {/* 用原生 img 而非 next/image · 这些图是 24~40px 的装饰 · 不值得走 next/image pipeline */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={persona.seal}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className="block select-none"
          style={{
            width: size,
            height: size,
            transform: `rotate(${rotate}deg)`,
          }}
        />
      </span>
    )
  }

  // auto · 品牌 ◌ · 不扮演
  return (
    <span
      aria-hidden
      title={label}
      className={cn(
        'font-serif-cn text-ink-heavy inline-flex shrink-0 items-center justify-center leading-none',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.85 }}
    >
      {persona.avatar}
    </span>
  )
}
