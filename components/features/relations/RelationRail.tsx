import { getRelatedBundle } from '@/lib/relations'
import type { EntityRef, EntityType, RelatedBundle } from '@/lib/relations/types'
import { EntityRefLink } from './EntityRefLink'

interface RelationRailProps {
  entityType: EntityType
  entityId: string
  userId: string
  /** 每维度 · 默认 5 */
  limitPer?: number
  /** 是否跑语义相似 · 默认 true（无 API Key 自动降级为空） */
  includeSemantic?: boolean
  /** 容器 className 扩展 */
  className?: string
}

/**
 * 统一的关系侧栏（Stage 1 · Server Component）
 * -----------------------------------------------------------
 * 接受任意 (type, id, userId)，并发取 6 个维度的关联项并渲染。
 * - 零 JS · 纯 SSR
 * - 空维度自动隐藏；整体全空时显示安静提示
 * - 共享 Ink 设计语言（paper-aged / ink-heavy / cinnabar）
 * - 默认 sticky top-24，配合详情页的 header 高度
 */
export async function RelationRail({
  entityType,
  entityId,
  userId,
  limitPer = 5,
  includeSemantic = true,
  className,
}: RelationRailProps) {
  const bundle = await getRelatedBundle({
    userId,
    type: entityType,
    id: entityId,
    limitPer,
    includeSemantic,
  })

  const total = countItems(bundle)

  return (
    <aside
      aria-label="关联项"
      className={cx(
        'border-ink-light/15 bg-paper-rice/40 flex flex-col gap-5 rounded-sm border px-4 py-5 backdrop-blur-sm',
        className,
      )}
    >
      <header className="border-ink-light/15 flex items-baseline justify-between border-b pb-3">
        <h2 className="font-serif-cn text-ink-heavy text-sm tracking-widest">关联</h2>
        <span className="text-ink-light text-[10px] tabular-nums">
          {total > 0 ? `${total} 项` : '—'}
        </span>
      </header>

      {total === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-5">
          <RelationSection title="指向" icon="→" items={bundle.outgoing} />
          <RelationSection title="被引" icon="↩" items={bundle.incoming} />
          <RelationSection title="同源" icon="⋯" items={bundle.siblings} />
          <RelationSection title="同标签" icon="#" items={bundle.tagPeers} />
          <RelationSection title="同时段" icon="◴" items={bundle.temporal} />
          <RelationSection title="意近" icon="≈" items={bundle.semantic} />
        </div>
      )}
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────

function RelationSection({
  title,
  icon,
  items,
}: {
  title: string
  icon: string
  items: EntityRef[]
}) {
  if (!items.length) return null
  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-baseline gap-2">
        <span aria-hidden className="text-ink-light/70 font-mono text-xs leading-none">
          {icon}
        </span>
        <h3 className="text-ink-medium text-[11px] tracking-[0.2em] uppercase">{title}</h3>
        <span className="text-ink-light/50 text-[10px] tabular-nums">{items.length}</span>
      </header>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={`${item.type}:${item.id}`}>
            <EntityRefLink entity={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function EmptyState() {
  return (
    <div className="text-ink-light py-6 text-center">
      <p className="text-[12px] leading-relaxed">
        还没有关联
        <br />
        <span className="text-ink-light/70 text-[10px]">写下更多 · 让想法之间生出脉络</span>
      </p>
    </div>
  )
}

function countItems(bundle: RelatedBundle): number {
  return (
    bundle.outgoing.length +
    bundle.incoming.length +
    bundle.siblings.length +
    bundle.tagPeers.length +
    bundle.temporal.length +
    bundle.semantic.length
  )
}

function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(' ')
}
