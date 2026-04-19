import { Seal } from '@/components/ink/Seal'

export function FirstActionCard({ text }: { text: string }) {
  return (
    <section className="bg-paper-aged/60 border-cinnabar/40 relative overflow-hidden rounded-sm border p-6">
      <div className="absolute top-3 right-3">
        <Seal variant="decision" size="sm">
          起
        </Seal>
      </div>
      <p className="font-serif-cn text-ink-light text-xs tracking-widest uppercase">
        今天的第一步 · 15 分钟以内
      </p>
      <p className="font-serif-cn text-ink-heavy mt-3 text-lg leading-relaxed">{text}</p>
    </section>
  )
}
