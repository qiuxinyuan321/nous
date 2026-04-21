'use client'

import { useRouter } from 'next/navigation'
import { NoteGraph } from './NoteGraph'
import { InkStroke } from '@/components/ink/InkStroke'

export function NoteGraphView() {
  const router = useRouter()

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-4 px-6 py-6">
      <div>
        <h1 className="font-serif-cn text-ink-heavy text-3xl">笔记图谱</h1>
        <div className="mt-3 w-16 opacity-70">
          <InkStroke variant="thin" />
        </div>
        <p className="text-ink-light mt-2 text-xs">
          笔记之间的 [[双向链接]] 关系可视化。点击节点跳转到对应笔记。
        </p>
      </div>
      <div className="border-ink-light/30 flex-1 overflow-hidden rounded-lg border">
        <NoteGraph onSelect={(id) => router.push(`/notes?id=${id}`)} />
      </div>
    </div>
  )
}
