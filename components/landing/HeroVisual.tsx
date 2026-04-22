import Image from 'next/image'
import { Seal } from '@/components/ink/Seal'
import { cn } from '@/lib/utils'

interface HeroVisualProps {
  alt: string
  className?: string
}

/**
 * Hero 右侧主视觉。
 * 性能考量：
 * - 不再包 motion.div 初始 opacity:0（避免 LCP 被推延到 JS hydrate 后）
 * - 去掉 26s 无限循环的 scale + translate（永不停止的合成层开销，对手机 GPU 不友好）
 * - 印章"思"入场动画改为轻量 CSS（纯装饰，不影响 LCP）
 */
export function HeroVisual({ alt, className }: HeroVisualProps) {
  return (
    <div
      className={cn(
        'relative aspect-[16/9] w-full overflow-hidden rounded-2xl',
        'shadow-[0_40px_80px_-40px_rgba(28,27,25,0.35)]',
        'ring-ink-light/20 ring-1',
        className,
      )}
    >
      <Image
        src="/hero.jpg"
        alt={alt}
        fill
        priority
        sizes="(max-width: 768px) 100vw, 60vw"
        className="object-cover"
      />

      <div className="from-paper-rice/45 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent" />

      <div className="animate-sealDrop absolute top-3 left-3 md:top-5 md:left-5">
        <Seal size="lg">思</Seal>
      </div>
    </div>
  )
}
