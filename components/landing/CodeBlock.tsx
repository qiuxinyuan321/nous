'use client'

import { useState } from 'react'

interface CodeBlockProps {
  code: string
  copyLabel: string
  copiedLabel: string
}

export function CodeBlock({ code, copyLabel, copiedLabel }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // 剪贴板权限被拒，静默忽略
    }
  }

  return (
    <div className="overflow-hidden rounded-md">
      <div className="bg-ink-heavy flex items-center justify-between px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="bg-cinnabar h-2.5 w-2.5 rounded-full" />
          <span className="bg-gold-leaf h-2.5 w-2.5 rounded-full" />
          <span className="bg-celadon h-2.5 w-2.5 rounded-full" />
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="text-paper-rice/70 hover:text-paper-rice font-serif-en text-xs tracking-wide transition"
          aria-label={copied ? copiedLabel : copyLabel}
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <pre className="bg-ink-heavy/95 text-paper-rice overflow-x-auto p-5 font-mono text-xs leading-relaxed">
        {code}
      </pre>
    </div>
  )
}
