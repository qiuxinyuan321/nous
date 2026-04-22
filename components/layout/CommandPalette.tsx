'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Command } from 'cmdk'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Inbox,
  Target,
  NotebookPen,
  BookOpen,
  Brain,
  Settings,
  Palette as PaletteIcon,
  Network,
  Feather,
  FileText,
  StickyNote,
  Link2,
  ArrowLeft,
  CornerDownLeft,
  Command as CommandIcon,
  Search as SearchIcon,
} from 'lucide-react'
import { usePaletteStore } from '@/lib/stores/palette'
import { useIdeas, useCreateIdea } from '@/lib/hooks/useIdeas'
import { useTheme } from '@/lib/hooks/useTheme'
import { VoiceButton } from '@/components/features/inbox/VoiceButton'
import { SearchMode } from '@/components/layout/palette/SearchMode'
import { cn } from '@/lib/utils'

type Mode = 'command' | 'capture' | 'theme' | 'search'

interface NoteResult {
  id: string
  title: string
}

/**
 * ⌘K CommandPalette v2 ——
 * - 命令模式：分组 · 跳转 / 操作 / 主题 / 运行时搜索想法+笔记
 * - 快速捕获子视图：保留原 textarea + 语音体验
 * - 主题子视图：cmdk 内置过滤 + 预览色块
 *
 * 外层只管全局快捷键 + 开关；真正的内容在 PaletteBody，
 * 随 AnimatePresence 挂卸，内部 state 天然随每次打开重置，
 * 从而避免在 effect 内做 setState 重置。
 */
export function CommandPalette() {
  const { open, closePalette } = usePaletteStore()

  // 全局 ⌘K / Ctrl+K 唤起 · ⌘⇧K 直接进深度搜
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (e.shiftKey) {
          usePaletteStore.getState().openSearch()
        } else {
          usePaletteStore.getState().togglePalette()
        }
      }
      if (e.key === 'Escape' && usePaletteStore.getState().open) {
        usePaletteStore.getState().closePalette()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return <AnimatePresence>{open && <PaletteBody onClose={closePalette} />}</AnimatePresence>
}

/* ────── 面板主体（仅在 open 时挂载，天然重置内部 state） ────── */

function PaletteBody({ onClose }: { onClose: () => void }) {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations('inbox.quickCapture')

  // 从 store 的 initialMode 决定初始模式（⌘⇧K 走 search）
  const initialMode = usePaletteStore.getState().initialMode
  useEffect(() => {
    usePaletteStore.getState().consumeInitialMode()
  }, [])

  const [mode, setMode] = useState<Mode>(initialMode)
  const [query, setQuery] = useState('')
  const [captureValue, setCaptureValue] = useState('')
  const captureRef = useRef<HTMLTextAreaElement>(null)
  const { mutateAsync: createIdea, isPending: isCreating } = useCreateIdea()
  const { data: ideas } = useIdeas()

  // 笔记搜索：rawNoteResults 是原始 fetch 结果，展示用的 noteResults 是按当前 query 派生
  const [rawNoteResults, setRawNoteResults] = useState<NoteResult[]>([])
  useEffect(() => {
    if (mode !== 'command') return
    const q = query.trim()
    if (q.length < 2) return
    let cancelled = false
    const timer = setTimeout(() => {
      fetch(`/api/notes?q=${encodeURIComponent(q)}&limit=5`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled || !data) return
          setRawNoteResults(
            (data.notes ?? []).map((n: NoteResult) => ({ id: n.id, title: n.title })),
          )
        })
        .catch(() => {})
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, mode])
  const noteResults = query.trim().length >= 2 ? rawNoteResults : []

  // capture 模式自动聚焦
  useEffect(() => {
    if (mode === 'capture') {
      const id = setTimeout(() => captureRef.current?.focus(), 30)
      return () => clearTimeout(id)
    }
  }, [mode])

  function go(path: string) {
    router.push(`/${locale}${path}`)
    onClose()
  }

  async function submitCapture() {
    if (!captureValue.trim() || isCreating) return
    try {
      await createIdea({ rawContent: captureValue.trim() })
      setCaptureValue('')
      onClose()
    } catch (err) {
      console.error(err)
    }
  }

  function onCaptureKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submitCapture()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setMode('command')
    }
  }

  function handleTranscript(text: string | null) {
    if (!text) return
    setCaptureValue((prev) => (prev.trim() ? `${prev.trimEnd()}\n${text}` : text))
    captureRef.current?.focus()
  }

  // 想法：只取前 5 条，cmdk 会做 fuzzy 过滤
  const topIdeas = ideas?.slice(0, 5) ?? []

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
    >
      <div className="bg-paper-rice/70 absolute inset-0 backdrop-blur-sm" aria-hidden />
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: -16, opacity: 0, filter: 'blur(6px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        exit={{ y: -8, opacity: 0, filter: 'blur(4px)' }}
        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        className="border-ink-light/30 bg-paper-aged/95 relative w-full max-w-xl overflow-hidden rounded-md border shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {mode === 'command' && (
          <CommandMode
            query={query}
            setQuery={(v) => {
              // 输入首字符 "?" 自动切深度搜 · 去掉前缀
              if (v.startsWith('?')) {
                const rest = v.slice(1).trimStart()
                setQuery(rest)
                setMode('search')
                return
              }
              setQuery(v)
            }}
            ideas={topIdeas}
            noteResults={noteResults}
            onSelectIdea={(id) => go(`/refine/${id}`)}
            onSelectNote={(id) => go(`/notes?id=${id}`)}
            onCapture={() => setMode('capture')}
            onTheme={() => {
              setQuery('')
              setMode('theme')
            }}
            onSearch={() => setMode('search')}
            onGo={go}
          />
        )}

        {mode === 'search' && (
          <SearchMode
            onBack={() => {
              setQuery('')
              setMode('command')
            }}
            onNavigate={go}
            initialQuery={query}
          />
        )}

        {mode === 'capture' && (
          <CaptureMode
            textareaRef={captureRef}
            value={captureValue}
            onChange={setCaptureValue}
            onKeyDown={onCaptureKeyDown}
            onSubmit={submitCapture}
            onBack={() => setMode('command')}
            onTranscript={handleTranscript}
            isPending={isCreating}
            placeholder={t('placeholder')}
            saveLabel={t('save')}
          />
        )}

        {mode === 'theme' && <ThemeMode onClose={() => setMode('command')} />}
      </motion.div>
    </motion.div>
  )
}

/* ────── 命令模式 ────── */

const NAV_ITEMS: Array<{
  path: string
  labelZh: string
  labelEn: string
  icon: React.ComponentType<{ className?: string }>
  keywords?: string
}> = [
  {
    path: '/workspace',
    labelZh: '工作台',
    labelEn: 'Workspace',
    icon: LayoutDashboard,
    keywords: 'home dashboard',
  },
  { path: '/inbox', labelZh: '收件箱', labelEn: 'Inbox', icon: Inbox, keywords: 'ideas capture' },
  {
    path: '/focus',
    labelZh: '今日聚焦',
    labelEn: 'Focus',
    icon: Target,
    keywords: 'today pomodoro',
  },
  {
    path: '/notes',
    labelZh: '笔记',
    labelEn: 'Notes',
    icon: NotebookPen,
    keywords: 'notes markdown',
  },
  {
    path: '/journal',
    labelZh: '复盘',
    labelEn: 'Journal',
    icon: BookOpen,
    keywords: 'journal review reflection',
  },
  { path: '/memory', labelZh: '记忆', labelEn: 'Memory', icon: Brain, keywords: 'memory profile' },
  {
    path: '/graph',
    labelZh: '知识图谱',
    labelEn: 'Graph',
    icon: Network,
    keywords: 'graph connections',
  },
  {
    path: '/settings',
    labelZh: '设置',
    labelEn: 'Settings',
    icon: Settings,
    keywords: 'settings api keys profile',
  },
]

interface CommandModeProps {
  query: string
  setQuery: (s: string) => void
  ideas: Array<{ id: string; title: string | null; rawContent: string }>
  noteResults: NoteResult[]
  onSelectIdea: (id: string) => void
  onSelectNote: (id: string) => void
  onCapture: () => void
  onTheme: () => void
  onSearch: () => void
  onGo: (path: string) => void
}

function CommandMode({
  query,
  setQuery,
  ideas,
  noteResults,
  onSelectIdea,
  onSelectNote,
  onCapture,
  onTheme,
  onSearch,
  onGo,
}: CommandModeProps) {
  const locale = useLocale()

  return (
    <Command
      label="命令面板"
      className="[&_[cmdk-group-heading]]:text-ink-light [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:uppercase"
    >
      <div className="border-ink-light/15 flex items-center gap-3 border-b px-4 py-3">
        <CommandIcon className="text-ink-light h-4 w-4 shrink-0" aria-hidden />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="搜索想法、笔记，或输入命令..."
          className="font-serif-cn text-ink-heavy flex-1 bg-transparent text-base outline-none placeholder:text-[color:var(--ink-light)]"
          autoFocus
        />
      </div>

      <Command.List className="max-h-[60vh] overflow-y-auto px-2 py-2">
        <Command.Empty className="text-ink-light py-8 text-center text-sm">
          没有命中 · 按 Enter 落成新想法
        </Command.Empty>

        {/* 想法：运行时过滤 */}
        {ideas.length > 0 && (
          <Command.Group heading="想法">
            {ideas.map((idea) => {
              const title = idea.title?.trim() || idea.rawContent.slice(0, 40) || '无题'
              return (
                <PaletteItem
                  key={idea.id}
                  value={`idea ${title} ${idea.rawContent.slice(0, 80)}`}
                  onSelect={() => onSelectIdea(idea.id)}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{title}</span>
                  <span className="text-ink-light ml-auto text-[10px] tracking-wider uppercase">
                    打开对话
                  </span>
                </PaletteItem>
              )
            })}
          </Command.Group>
        )}

        {/* 笔记：服务端搜索 */}
        {noteResults.length > 0 && (
          <Command.Group heading="笔记">
            {noteResults.map((n) => (
              <PaletteItem key={n.id} value={`note ${n.title}`} onSelect={() => onSelectNote(n.id)}>
                <StickyNote className="h-4 w-4 shrink-0" />
                <span className="truncate">{n.title || '无题'}</span>
                <span className="text-ink-light ml-auto text-[10px] tracking-wider uppercase">
                  打开笔记
                </span>
              </PaletteItem>
            ))}
          </Command.Group>
        )}

        {/* 操作 */}
        <Command.Group heading="操作">
          <PaletteItem
            value="search deep omni 深度 搜索 全局 search all everywhere"
            onSelect={onSearch}
          >
            <SearchIcon className="h-4 w-4 shrink-0" />
            <span>深度搜索</span>
            <span className="text-ink-light ml-auto flex items-center gap-1 text-[10px] tracking-wider uppercase">
              跨想法笔记对话
              <kbd className="border-ink-light/40 rounded border px-1 py-0.5 font-mono text-[10px]">
                ?
              </kbd>
            </span>
          </PaletteItem>
          <PaletteItem value="new idea capture 新建 想法 捕获" onSelect={onCapture}>
            <Feather className="h-4 w-4 shrink-0" />
            <span>新建想法</span>
            <kbd className="border-ink-light/40 text-ink-light ml-auto rounded border px-1.5 py-0.5 font-mono text-[10px]">
              N
            </kbd>
          </PaletteItem>
          <PaletteItem value="theme switch color 主题 切换" onSelect={onTheme}>
            <PaletteIcon className="h-4 w-4 shrink-0" />
            <span>切换主题</span>
          </PaletteItem>
          <PaletteItem
            value="copy current url 复制 链接"
            onSelect={() => {
              if (typeof window !== 'undefined') {
                void navigator.clipboard.writeText(window.location.href)
              }
              usePaletteStore.getState().closePalette()
            }}
          >
            <Link2 className="h-4 w-4 shrink-0" />
            <span>复制当前链接</span>
          </PaletteItem>
        </Command.Group>

        {/* 跳转 */}
        <Command.Group heading="跳转">
          {NAV_ITEMS.map((item) => {
            const label = locale === 'en-US' ? item.labelEn : item.labelZh
            const Icon = item.icon
            return (
              <PaletteItem
                key={item.path}
                value={`goto ${label} ${item.keywords ?? ''} ${item.path}`}
                onSelect={() => onGo(item.path)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                <span className="text-ink-light ml-auto font-mono text-[10px]">{item.path}</span>
              </PaletteItem>
            )
          })}
        </Command.Group>
      </Command.List>

      <footer className="border-ink-light/15 text-ink-light flex items-center justify-between border-t px-4 py-2 text-[11px]">
        <span className="flex items-center gap-1.5">
          <kbd className="border-ink-light/40 rounded border px-1.5 py-0.5 font-mono text-[10px]">
            ↑↓
          </kbd>
          <span>选择</span>
        </span>
        <span className="flex items-center gap-1.5">
          <CornerDownLeft className="h-3 w-3" />
          <span>确认</span>
          <span className="mx-1">·</span>
          <kbd className="border-ink-light/40 rounded border px-1.5 py-0.5 font-mono text-[10px]">
            Esc
          </kbd>
          <span>关闭</span>
        </span>
      </footer>
    </Command>
  )
}

/* ────── 快速捕获模式 ────── */

interface CaptureModeProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSubmit: () => void
  onBack: () => void
  onTranscript: (t: string | null) => void
  isPending: boolean
  placeholder: string
  saveLabel: string
}

function CaptureMode({
  textareaRef,
  value,
  onChange,
  onKeyDown,
  onSubmit,
  onBack,
  onTranscript,
  isPending,
  placeholder,
  saveLabel,
}: CaptureModeProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div className="border-ink-light/15 flex items-center gap-2 border-b px-3 py-2">
        <button
          type="button"
          onClick={onBack}
          className="text-ink-light hover:text-ink-heavy flex items-center gap-1 rounded px-2 py-1 text-xs transition"
        >
          <ArrowLeft className="h-3 w-3" />
          返回
        </button>
        <span className="text-ink-light font-serif-cn text-xs">新建想法</span>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={5}
        placeholder={placeholder}
        className="font-serif-cn text-ink-heavy w-full resize-none bg-transparent px-6 py-5 text-lg leading-relaxed outline-none placeholder:text-[color:var(--ink-light)]"
      />
      <div className="border-ink-light/20 flex flex-wrap items-center gap-3 border-t px-4 py-3">
        <VoiceButton onTranscript={onTranscript} />
        <div className="text-ink-light ml-auto flex items-center gap-3 text-xs">
          <span className="hidden sm:inline">
            <kbd className="border-ink-light/40 rounded border px-1.5 py-0.5 font-mono text-[10px]">
              Enter
            </kbd>{' '}
            落笔 ·{' '}
            <kbd className="border-ink-light/40 rounded border px-1.5 py-0.5 font-mono text-[10px]">
              Esc
            </kbd>{' '}
            返回
          </span>
          <button
            type="submit"
            disabled={!value.trim() || isPending}
            className="bg-ink-heavy hover:bg-ink-medium rounded px-3 py-1 text-xs text-[color:var(--paper-rice)] transition disabled:opacity-40"
          >
            {isPending ? '…' : saveLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

/* ────── 主题子视图 ────── */

function ThemeMode({ onClose }: { onClose: () => void }) {
  const { apply, themes, themeId } = useTheme()
  const locale = useLocale()

  return (
    <Command
      label="主题切换"
      className="[&_[cmdk-group-heading]]:text-ink-light [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:uppercase"
    >
      <div className="border-ink-light/15 flex items-center gap-2 border-b px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          className="text-ink-light hover:text-ink-heavy flex items-center gap-1 rounded px-2 py-1 text-xs transition"
        >
          <ArrowLeft className="h-3 w-3" />
          返回
        </button>
        <span className="text-ink-light font-serif-cn text-xs">选择主题</span>
      </div>
      <Command.Input
        placeholder="搜索主题..."
        className="font-serif-cn text-ink-heavy border-ink-light/15 w-full border-b bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[color:var(--ink-light)]"
        autoFocus
      />
      <Command.List className="max-h-[50vh] overflow-y-auto px-2 py-2">
        <Command.Empty className="text-ink-light py-8 text-center text-sm">
          未找到匹配主题
        </Command.Empty>
        <Command.Group heading={locale === 'en-US' ? 'All themes' : '全部主题'}>
          {themes.map((theme) => {
            const name = theme.name[locale === 'en-US' ? 'en-US' : 'zh-CN']
            const desc = theme.description[locale === 'en-US' ? 'en-US' : 'zh-CN']
            const isActive = theme.id === themeId
            return (
              <PaletteItem
                key={theme.id}
                value={`theme ${theme.id} ${name} ${desc}`}
                onSelect={() => {
                  apply(theme.id)
                  onClose()
                }}
              >
                <div className="flex h-5 w-9 shrink-0 overflow-hidden rounded-sm border border-white/40">
                  <span className="flex-1" style={{ background: theme.preview.paper }} />
                  <span className="flex-1" style={{ background: theme.preview.ink }} />
                  <span className="flex-1" style={{ background: theme.preview.accent }} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm">{name}</span>
                  <span className="text-ink-light truncate text-[10px]">{desc}</span>
                </div>
                {isActive && (
                  <span className="text-celadon ml-auto text-[10px] tracking-wider uppercase">
                    当前
                  </span>
                )}
              </PaletteItem>
            )
          })}
        </Command.Group>
      </Command.List>
    </Command>
  )
}

/* ────── 单项 Item ────── */

function PaletteItem({
  value,
  onSelect,
  children,
}: {
  value: string
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className={cn(
        'text-ink-medium flex cursor-pointer items-center gap-3 rounded px-3 py-2 text-sm transition',
        'data-[selected=true]:bg-paper-rice/70 data-[selected=true]:text-ink-heavy',
        'dark:data-[selected=true]:bg-white/5',
      )}
    >
      {children}
    </Command.Item>
  )
}
