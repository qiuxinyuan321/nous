import { cn } from '@/lib/utils'

export function MessageBubble({
  role,
  content,
  streaming,
}: {
  role: 'user' | 'assistant' | 'system'
  content: string
  streaming?: boolean
}) {
  if (role === 'system') return null

  const isUser = role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'font-serif-cn max-w-[82%] rounded-sm px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-ink-heavy text-[color:var(--paper-rice)]'
            : 'border-ink-light/30 bg-paper-aged/60 text-ink-heavy border',
        )}
      >
        {content}
        {streaming && (
          <span className="text-ink-light ml-1 inline-block h-3 w-1 animate-pulse bg-current align-middle" />
        )}
      </div>
    </div>
  )
}
