import { Link } from '@/lib/i18n/navigation'
import { Seal } from '@/components/ink/Seal'
import { InkStroke } from '@/components/ink/InkStroke'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
      <Seal variant="pending" size="lg">
        空
      </Seal>
      <h1 className="font-serif-cn text-ink-heavy mt-8 text-2xl">此处空无一物</h1>
      <div className="mt-4 w-16 opacity-60">
        <InkStroke variant="thin" />
      </div>
      <p className="text-ink-medium mt-6 text-sm">页面或资源不存在，也许已被归档。</p>
      <Link
        href="/inbox"
        className="text-indigo-stone hover:text-ink-heavy mt-10 text-sm underline-offset-4 transition hover:underline"
      >
        ← 回到想法收件箱
      </Link>
    </main>
  )
}
