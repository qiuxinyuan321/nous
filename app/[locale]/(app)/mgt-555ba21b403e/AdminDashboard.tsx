'use client'

import { useEffect, useState } from 'react'

type UserInfo = {
  id: string
  email: string
  name: string | null
  image: string | null
  createdAt: string
  updatedAt: string
  todayUsed: number
  totalUsed: number
  totalMessages: number
  _count: {
    ideas: number
    apiKeys: number
    reflections: number
  }
}

type AdminData = {
  total: number
  dailyLimit: number
  totalTodayUsed: number
  users: UserInfo[]
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/mgt-555ba21b403e/users')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-ink-light text-sm">加载中…</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-cinnabar text-sm">加载失败</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-serif-cn text-ink-heavy text-2xl">管理后台</h1>

      {/* 概览卡片 */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="总用户" value={data.total} />
        <StatCard label="每日免费额度" value={data.dailyLimit} unit="条/人" />
        <StatCard label="今日全站用量" value={data.totalTodayUsed} unit="条" />
        <StatCard
          label="今日额度使用率"
          value={data.total > 0 ? Math.round((data.totalTodayUsed / (data.total * data.dailyLimit)) * 100) : 0}
          unit="%"
        />
      </div>

      {/* 用户列表 */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-ink-light/30 border-b">
              <th className="text-ink-medium px-3 py-3 font-medium">邮箱</th>
              <th className="text-ink-medium px-3 py-3 font-medium">昵称</th>
              <th className="text-ink-medium px-3 py-3 font-medium">注册时间</th>
              <th className="text-ink-medium px-3 py-3 font-medium text-center">今日用量</th>
              <th className="text-ink-medium px-3 py-3 font-medium text-center">历史总用量</th>
              <th className="text-ink-medium px-3 py-3 font-medium text-center">总对话数</th>
              <th className="text-ink-medium px-3 py-3 font-medium text-center">想法数</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user) => (
              <tr
                key={user.id}
                className="border-ink-light/20 hover:bg-paper-rice/80 border-b transition"
              >
                <td className="text-ink-heavy px-3 py-3 font-mono text-xs">{user.email}</td>
                <td className="text-ink-heavy px-3 py-3">{user.name || '—'}</td>
                <td className="text-ink-medium px-3 py-3 text-xs">
                  {new Date(user.createdAt).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={user.todayUsed >= data.dailyLimit ? 'text-cinnabar font-medium' : 'text-ink-heavy'}>
                    {user.todayUsed}
                  </span>
                  <span className="text-ink-light">/{data.dailyLimit}</span>
                </td>
                <td className="text-ink-heavy px-3 py-3 text-center">{user.totalUsed}</td>
                <td className="text-ink-heavy px-3 py-3 text-center">{user.totalMessages}</td>
                <td className="text-ink-heavy px-3 py-3 text-center">{user._count.ideas}</td>
              </tr>
            ))}
            {data.users.length === 0 && (
              <tr>
                <td colSpan={7} className="text-ink-light py-8 text-center">
                  暂无用户
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-ink-light mt-8 text-xs">
        * 为保护用户隐私，后台不展示笔记/想法的具体内容
      </p>
    </div>
  )
}

function StatCard({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="border-ink-light/30 rounded-sm border px-4 py-3">
      <p className="text-ink-light text-xs">{label}</p>
      <p className="text-ink-heavy mt-1 text-xl font-medium">
        {value}
        {unit && <span className="text-ink-light ml-1 text-xs font-normal">{unit}</span>}
      </p>
    </div>
  )
}
