'use client'

import { Command } from 'cmdk'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Search as SearchIcon, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pathForEntity, TYPE_ICONS, TYPE_LABELS_ZH } from '@/lib/relations/routes'
import { parseQuery } from '@/lib/search/parse'
import type { SearchEntityType, SearchResponse, SearchResultItem } from '@/lib/search/types'

interface SearchModeProps {
  onBack: () => void
  onNavigate: (path: string) => void
  initialQuery?: string
}

/**
 * Omni-Search 深度搜模式
 * -----------------------------------------------------------
 * - 调 GET /api/search · 300ms 防抖 · AbortController 取消旧请求
 * - cmdk shouldFilter=false · 完全由服务端决定顺序
 * - 支持 prefix (idea: note: msg: ref: mem: tag:xxx) · 输入即解析
 * - ↑↓ 选择 · Enter 跳转 · ⌘Enter 保留面板
 */
export function SearchMode({ onBack, onNavigate, initialQuery = '' }: SearchModeProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<SearchResponse | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const parsed = useMemo(() => parseQuery(query), [query])
  const effectiveQ = parsed.query

  // 300ms 防抖 + AbortController
  // 只在 effectiveQ 足够长时发请求，短时不重置 state (renderer 决定显示)
  // 从而避开 react-hooks/set-state-in-effect
  useEffect(() => {
    if (effectiveQ.length < 2) return
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ q: query, limit: '20' })
        const res = await fetch(`/api/search?${params.toString()}`, { signal: ctrl.signal })
        if (!res.ok) {
          setError(res.status === 401 ? '登录态已失效' : '搜索失败')
          return
        }
        const data: SearchResponse = await res.json()
        setResponse(data)
        setResults(data.results)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError('搜索失败')
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, effectiveQ])

  // 渲染时根据 effectiveQ 决定是否显示 results · 短查询显示提示
  const showResults = effectiveQ.length >= 2
  const visibleResults = showResults ? results : []

  // 销毁时 abort
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return (
    <Command label="深度搜索" shouldFilter={false} className={headingClass}>
      <div className="border-ink-light/15 flex items-center gap-2 border-b px-3 py-2">
        <button
          type="button"
          onClick={onBack}
          className="text-ink-light hover:text-ink-heavy flex items-center gap-1 rounded px-2 py-1 text-xs transition"
        >
          <ArrowLeft className="h-3 w-3" />
          返回
        </button>
        <span className="text-ink-light font-serif-cn flex items-center gap-1 text-xs">
          <SearchIcon className="h-3 w-3" />
          深度搜索
        </span>
        {response?.used.semantic && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-[color:var(--celadon)]">
            <Sparkles className="h-3 w-3" />
            语义
          </span>
        )}
      </div>

      <div className="border-ink-light/15 flex items-center gap-3 border-b px-4 py-3">
        <SearchIcon className="text-ink-light h-4 w-4 shrink-0" aria-hidden />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="跨想法 / 笔记 / 对话 / 复盘 / 记忆 · idea: note: tag:xx 前缀可过滤"
          className="font-serif-cn text-ink-heavy flex-1 bg-transparent text-base outline-none placeholder:text-[color:var(--ink-light)]"
          autoFocus
        />
        {loading && <span className="text-ink-light text-[11px]">…</span>}
      </div>

      <FilterChips parsedTypes={parsed.filters.types} parsedTag={parsed.filters.tag} />

      <Command.List className="max-h-[55vh] overflow-y-auto px-2 py-2">
        {error && <div className="text-cinnabar py-6 text-center text-sm">{error}</div>}

        {!error && !showResults && <HintBlock />}

        {!error && showResults && !loading && visibleResults.length === 0 && (
          <Command.Empty className="text-ink-light py-8 text-center text-sm">
            没有命中 · 试试换个词，或去掉前缀
          </Command.Empty>
        )}

        {visibleResults.map((item) => (
          <ResultItem
            key={`${item.entity.type}:${item.entity.id}`}
            item={item}
            onSelect={() => onNavigate(pathForEntity(item.entity))}
          />
        ))}
      </Command.List>

      <footer className="border-ink-light/15 text-ink-light flex items-center justify-between border-t px-4 py-2 text-[11px]">
        <span className="flex items-center gap-2">
          {response && (
            <span className="tabular-nums">
              {response.results.length} 项 · {response.elapsedMs}ms
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className={kbdClass}>↑↓</kbd>
          <span>选择</span>
          <span className="mx-1">·</span>
          <kbd className={kbdClass}>Enter</kbd>
          <span>打开</span>
          <span className="mx-1">·</span>
          <kbd className={kbdClass}>Esc</kbd>
          <span>关闭</span>
        </span>
      </footer>
    </Command>
  )
}

// ─────────────────────────────────────────────────────────────

function FilterChips({
  parsedTypes,
  parsedTag,
}: {
  parsedTypes: SearchEntityType[] | undefined
  parsedTag: string | undefined
}) {
  if ((!parsedTypes || !parsedTypes.length) && !parsedTag) return null
  return (
    <div className="border-ink-light/15 flex flex-wrap items-center gap-2 border-b px-4 py-2">
      <span className="text-ink-light text-[10px] tracking-[0.15em] uppercase">过滤</span>
      {parsedTypes?.map((t) => (
        <span
          key={t}
          className="bg-paper-rice/60 text-ink-medium border-ink-light/30 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]"
        >
          <span aria-hidden>{TYPE_ICONS[t]}</span>
          <span>{TYPE_LABELS_ZH[t]}</span>
        </span>
      ))}
      {parsedTag && (
        <span className="bg-gold-leaf/10 text-gold-leaf border-gold-leaf/40 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]">
          #{parsedTag}
        </span>
      )}
    </div>
  )
}

function HintBlock() {
  return (
    <div className="text-ink-light flex flex-col gap-2 px-4 py-6 text-[12px] leading-relaxed">
      <p>输入 2 个字符以上开始搜索。</p>
      <div>
        <p className="text-ink-medium mb-1 text-[11px] tracking-[0.15em] uppercase">前缀示例</p>
        <ul className="space-y-0.5 text-[11px]">
          <li>
            <code className="text-ink-medium bg-paper-rice/50 rounded px-1">idea: 产品</code>
            <span className="ml-2">只搜想法</span>
          </li>
          <li>
            <code className="text-ink-medium bg-paper-rice/50 rounded px-1">msg: ref: 回顾</code>
            <span className="ml-2">只搜对话 + 复盘</span>
          </li>
          <li>
            <code className="text-ink-medium bg-paper-rice/50 rounded px-1">tag:写作 灵感</code>
            <span className="ml-2">只在 #写作 里找</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

function ResultItem({ item, onSelect }: { item: SearchResultItem; onSelect: () => void }) {
  const { entity } = item
  const icon = TYPE_ICONS[entity.type]
  const label = TYPE_LABELS_ZH[entity.type]
  return (
    <Command.Item
      value={`${entity.type}:${entity.id}`}
      onSelect={onSelect}
      className={cn(
        'text-ink-medium flex cursor-pointer items-start gap-3 rounded px-3 py-2 text-sm transition',
        'data-[selected=true]:bg-paper-rice/70 data-[selected=true]:text-ink-heavy',
        'dark:data-[selected=true]:bg-white/5',
      )}
    >
      <span aria-hidden className="mt-0.5 shrink-0 text-base opacity-80">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-ink-light text-[10px] tracking-[0.15em] uppercase">{label}</span>
          <span className="text-ink-light/40 text-[10px]">·</span>
          <span className="text-ink-light text-[10px] tabular-nums">
            {formatDate(new Date(entity.timestamp))}
          </span>
          {item.matchedField === 'mixed' && (
            <span className="ml-auto flex items-center gap-0.5 text-[9px] text-[color:var(--celadon)]">
              <Sparkles className="h-2.5 w-2.5" />
              语义近
            </span>
          )}
        </div>
        <p className="text-ink-heavy mt-0.5 truncate text-[13px] leading-snug font-medium">
          {entity.title}
        </p>
        {item.highlight && (
          <p className="text-ink-light mt-0.5 line-clamp-2 text-[11px] leading-relaxed">
            {item.highlight}
          </p>
        )}
      </div>
    </Command.Item>
  )
}

function formatDate(d: Date): string {
  const now = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  if (d.getFullYear() !== now.getFullYear()) {
    return `${d.getFullYear().toString().slice(2)}-${mm}-${dd}`
  }
  return `${mm}-${dd}`
}

const headingClass =
  '[&_[cmdk-group-heading]]:text-ink-light [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:uppercase'

const kbdClass = 'border-ink-light/40 rounded border px-1.5 py-0.5 font-mono text-[10px]'
