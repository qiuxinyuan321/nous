/**
 * App 路由组统一骨架屏：在 SSR 数据请求期间先渲染轻量占位，避免白屏/突兀跳动。
 * 与 error.tsx 成对：DB/网络异常时 error.tsx 接管，正常加载时显示此骨架。
 */
export default function AppLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="animate-pulse space-y-8">
        {/* 标题占位 */}
        <div className="space-y-3">
          <div className="bg-ink-light/15 h-8 w-48 rounded-sm" />
          <div className="bg-ink-light/10 h-4 w-72 rounded-sm" />
        </div>
        {/* 内容块占位 */}
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-ink-light/15 bg-paper-rice/40 rounded-md border p-5">
              <div className="bg-ink-light/15 mb-3 h-4 w-3/4 rounded-sm" />
              <div className="bg-ink-light/10 mb-2 h-3 w-full rounded-sm" />
              <div className="bg-ink-light/10 h-3 w-5/6 rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
