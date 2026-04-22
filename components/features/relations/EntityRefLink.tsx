import { Link } from '@/lib/i18n/navigation'
import { pathForEntity, TYPE_ICONS, TYPE_LABELS_ZH } from '@/lib/relations/routes'
import type { EntityRef } from '@/lib/relations/types'

/**
 * 关联栏里单行 Ref 卡片
 * -----------------------------------------------------------
 * - Server Component · 零 JS
 * - 悬浮高亮 + 类型徽章 + 截断摘要 + MM-DD 时间戳
 * - Link 使用 i18n-aware 包装
 */
export function EntityRefLink({ entity }: { entity: EntityRef }) {
  const href = pathForEntity(entity)
  const icon = TYPE_ICONS[entity.type]
  const label = TYPE_LABELS_ZH[entity.type]

  const dateLabel = formatShortDate(entity.timestamp)

  return (
    <Link
      href={href}
      className="group border-ink-light/10 hover:border-ink-light/30 hover:bg-paper-aged/40 block rounded-sm border px-3 py-2 transition-colors"
    >
      <div className="flex items-start gap-2">
        <span aria-hidden className="mt-0.5 shrink-0 text-sm opacity-70">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-ink-light text-[10px] tracking-[0.15em] uppercase">{label}</span>
            <span className="text-ink-light/40 text-[10px]">·</span>
            <span className="text-ink-light text-[10px] tabular-nums">{dateLabel}</span>
          </div>
          <p className="text-ink-heavy mt-0.5 line-clamp-1 text-[13px] leading-snug">
            {entity.title}
          </p>
          {entity.snippet && (
            <p className="text-ink-light mt-0.5 line-clamp-2 text-[11px] leading-relaxed">
              {entity.snippet}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

function formatShortDate(date: Date): string {
  const d = new Date(date)
  const now = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  // 跨年时标年份
  if (d.getFullYear() !== now.getFullYear()) {
    return `${d.getFullYear().toString().slice(2)}-${mm}-${dd}`
  }
  return `${mm}-${dd}`
}
