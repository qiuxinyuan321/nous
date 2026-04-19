import { z } from 'zod'
import type { ResolvedProvider } from './types'

/** 周复盘 AI 输出 schema */
export const weeklyReviewSchema = z.object({
  completed: z
    .array(z.string().min(1).max(200))
    .max(10)
    .describe('本周完成的具体事（任务标题或里程碑,不要加形容词）'),
  stuckPatterns: z.string().min(2).max(400).describe('本周卡点的共性,诚实指出,不鸡汤'),
  insight: z.string().min(2).max(300).describe('INTP 风格的一句话洞察,理性、具体、非套话'),
  nextWeekFocus: z.string().min(2).max(200).describe('下周若只能做一件事,做什么'),
})

export type WeeklyReview = z.infer<typeof weeklyReviewSchema>

/** 聚合传给 AI 的素材 */
export interface WeeklyMetrics {
  rangeStart: string // YYYY-MM-DD
  rangeEnd: string
  ideasCreated: number
  ideasPlanned: number
  ideasDone: number
  tasksCompleted: number
  tasksSkipped: number
  tasksTotal: number
  blockedHints: number // 暂存字段,未来对接 BlockedHelp 再填
  completedTasks: { title: string; ideaTitle: string | null }[]
  skippedTasks: { title: string; ideaTitle: string | null }[]
  activeIdeaTitles: string[]
}

interface GenerateWeeklyInput {
  provider: ResolvedProvider
  metrics: WeeklyMetrics
  locale: 'zh-CN' | 'en-US'
}

const ZH_SYSTEM = `你是「Nous」的周复盘助手，面对一位 INTP 型思考者，基于过去 7 天的真实数据，输出一份理性、简洁的复盘。

## 原则
1. 不鼓励、不鸡汤、不套话
2. completed 列事实：用用户原来的任务标题，不加形容词
3. stuckPatterns 指出规律：如果有跳过/未完成的任务，找共性（例如「卡在需要外部协作的任务上」「深夜任务都没做」「could 优先级的都没动」）。没有明显规律就诚实说「本周数据不足以看出模式」
4. insight 一句话，INTP 欣赏的那种——揭示一个他自己可能没意识到的机制性事实，不是励志
5. nextWeekFocus 一件事，具体、可启动
6. 不要用 emoji、不要用 Markdown

## 输出格式
**只输出一个 JSON 对象，不要任何前言、后语、解释或代码块包裹。**
严格 schema：

{
  "completed": ["string", ...],       // 0-10 条，本周完成的事
  "stuckPatterns": "string",          // 卡点共性，2-400 字
  "insight": "string",                // 一句话洞察
  "nextWeekFocus": "string"           // 下周聚焦一件事
}`

const EN_SYSTEM = `You are "Nous" weekly-review assistant for an INTP. Based on last 7 days of data, produce a rational, terse recap.

## Rules
1. No cheerleading, no fluff
2. completed: list facts using original task titles, no adjectives
3. stuckPatterns: name the pattern across skipped/unfinished tasks (e.g. "stalled on tasks requiring external collab"). If no pattern, say so honestly.
4. insight: one sentence, mechanistic not motivational
5. nextWeekFocus: one specific, actionable thing
6. No emoji, no Markdown

## Output
**Output one JSON object only. No preface, no explanation, no code fences.**

{
  "completed": ["string", ...],
  "stuckPatterns": "string",
  "insight": "string",
  "nextWeekFocus": "string"
}`

function extractJson(text: string): string {
  let s = text.trim()
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) s = fenceMatch[1]!.trim()
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) s = s.slice(first, last + 1)
  return s
}

function buildPrompt(metrics: WeeklyMetrics, locale: 'zh-CN' | 'en-US'): string {
  const completedList = metrics.completedTasks
    .slice(0, 30)
    .map((t) => `- [${t.ideaTitle ?? '无题'}] ${t.title}`)
    .join('\n')
  const skippedList = metrics.skippedTasks
    .slice(0, 20)
    .map((t) => `- [${t.ideaTitle ?? '无题'}] ${t.title}`)
    .join('\n')

  if (locale === 'en-US') {
    return `## Range
${metrics.rangeStart} ~ ${metrics.rangeEnd}

## Counts
Ideas created: ${metrics.ideasCreated}
Ideas planned: ${metrics.ideasPlanned}
Ideas done: ${metrics.ideasDone}
Tasks completed: ${metrics.tasksCompleted} / ${metrics.tasksTotal}
Tasks skipped: ${metrics.tasksSkipped}

## Active idea titles
${metrics.activeIdeaTitles.join(', ') || '(none)'}

## Completed tasks
${completedList || '(none)'}

## Skipped / unfinished tasks
${skippedList || '(none)'}
`
  }
  return `## 时间范围
${metrics.rangeStart} ~ ${metrics.rangeEnd}

## 统计
新增想法：${metrics.ideasCreated}
已规划想法：${metrics.ideasPlanned}
已完成想法：${metrics.ideasDone}
任务完成：${metrics.tasksCompleted} / ${metrics.tasksTotal}
任务跳过：${metrics.tasksSkipped}

## 活跃想法
${metrics.activeIdeaTitles.join('、') || '（无）'}

## 已完成任务
${completedList || '（无）'}

## 跳过 / 未完成任务
${skippedList || '（无）'}
`
}

export async function generateWeeklyReview({
  provider,
  metrics,
  locale,
}: GenerateWeeklyInput): Promise<WeeklyReview> {
  const baseUrl = (provider.baseURL ?? 'https://api.openai.com/v1').replace(/\/+$/, '')
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: 'system', content: locale === 'en-US' ? EN_SYSTEM : ZH_SYSTEM },
        { role: 'user', content: buildPrompt(metrics, locale) },
      ],
      max_tokens: Math.max(provider.maxOutputTokens, 2000),
      reasoning_effort: 'low',
      stream: true,
    }),
  })

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      try {
        const chunk = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string | null } }>
        }
        const delta = chunk.choices?.[0]?.delta?.content
        if (typeof delta === 'string') text += delta
      } catch {
        /* ignore bad chunk */
      }
    }
  }

  if (!text.trim()) throw new Error('AI returned empty stream')
  const cleaned = extractJson(text)
  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    throw new Error(
      `AI returned non-JSON: ${(e as Error).message}\n--- raw ---\n${text.slice(0, 500)}`,
    )
  }
  const result = weeklyReviewSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(
      `Weekly JSON failed schema: ${result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}\n--- raw ---\n${text.slice(0, 500)}`,
    )
  }
  return result.data
}
