import { z } from 'zod'
import type { ResolvedProvider } from './types'

/** 里程碑中的任务 */
const taskSchema = z.object({
  title: z.string().min(2).max(100).describe('用动词开头，如"写"、"画"、"读"、"测"、"发"、"问"'),
  description: z.string().max(500).nullable(),
  priority: z.enum(['must', 'should', 'could', 'wont']),
  estimatedMin: z.number().int().min(5).max(480).describe('预计分钟数 5-480'),
})

/** 里程碑 */
const milestoneSchema = z.object({
  title: z.string().min(2).max(100),
  deadline: z.string().nullable().describe('YYYY-MM-DD 格式或 null；不确定时用 null'),
  tasks: z.array(taskSchema).min(1).max(5),
})

/** 完整 Plan schema */
export const planSchema = z.object({
  goal: z.string().min(3).max(200).describe('一句话目标，≤ 30 字最佳'),
  successCriteria: z
    .array(z.string().min(2).max(200))
    .min(2)
    .max(4)
    .describe('2-4 条可验证的成功标准'),
  firstAction: z.string().min(3).max(200).describe('今天 15 分钟内可做的具体动作，动词开头'),
  milestones: z.array(milestoneSchema).min(1).max(3),
  risks: z.array(z.string().min(2).max(200)).max(5),
})

export type PlanDraft = z.infer<typeof planSchema>

interface GeneratePlanInput {
  provider: ResolvedProvider
  ideaTitle: string
  ideaContent: string
  recentMessages: { role: 'user' | 'assistant'; content: string }[]
  locale: 'zh-CN' | 'en-US'
}

const ZH_SYSTEM = `你是「Nous」的规划助手，把 INTP 型思考者的想法转为结构化、低门槛、可立刻启动的执行方案。

## 硬性原则
1. firstAction 必须是**今天 15 分钟内能完成**的具体动作（降低启动阻力，不是"开始规划"这种空话）
2. 里程碑 ≤ 3 个
3. 每个里程碑任务 ≤ 5 个
4. 任务标题用动词开头：写、画、读、测、发、问、搭、画、列…
5. MoSCoW 分布：must 占 40-60%、should 30%、could 10-20%、wont 记录但不占用精力
6. successCriteria 2-4 条，**可验证**（有/无、能/不能，不是"做得好"这种模糊词）
7. risks 最多 5 条，只写真实风险，不要模板化套话
8. deadline 不确定就填 null，不要硬编日期

## 语气
- 不鼓励，不鸡汤
- 理性、简洁、具体
- 不使用 emoji、不使用 Markdown

## 输出格式
**只输出一个 JSON 对象，不要任何前言、后语、解释或代码块包裹。**
JSON 结构必须严格遵守：

{
  "goal": "string (≤30字)",
  "successCriteria": ["string", ...],          // 2-4 条
  "firstAction": "string (15分钟内可做)",
  "milestones": [
    {
      "title": "string",
      "deadline": "YYYY-MM-DD" | null,
      "tasks": [
        {
          "title": "动词开头",
          "description": "string" | null,
          "priority": "must" | "should" | "could" | "wont",
          "estimatedMin": number  // 5-480
        }
      ]
    }
  ],                                            // 1-3 个里程碑
  "risks": ["string", ...]                      // 0-5 条
}`

const EN_SYSTEM = `You are "Nous" planner. Turn an INTP thinker's idea into a concrete, low-friction, immediately-actionable plan.

## Hard rules
1. firstAction must be a specific action completable in 15 minutes today
2. ≤ 3 milestones
3. ≤ 5 tasks per milestone
4. Task titles start with a verb
5. MoSCoW distribution: must 40-60%, should 30%, could 10-20%, wont recorded but not scheduled
6. 2-4 successCriteria, each verifiable
7. risks max 5, real only
8. deadline null when unsure

## Voice
- No cheerleading, no fluff
- Rational, terse, concrete
- No emoji, no Markdown

## Output
**Output one JSON object only. No preface, no explanation, no code fences.**
Strict shape:

{
  "goal": "string (<=30 chars)",
  "successCriteria": ["string", ...],
  "firstAction": "string (<=15 min)",
  "milestones": [
    {
      "title": "string",
      "deadline": "YYYY-MM-DD" | null,
      "tasks": [
        {
          "title": "verb-first",
          "description": "string" | null,
          "priority": "must" | "should" | "could" | "wont",
          "estimatedMin": number
        }
      ]
    }
  ],
  "risks": ["string", ...]
}`

/** 从文本里尽力抽出 JSON 对象（容忍 ```json 围栏、前后说明文字）。 */
function extractJson(text: string): string {
  let s = text.trim()

  // 去掉 ```json ... ``` 或 ``` ... ``` 围栏
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) s = fenceMatch[1]!.trim()

  // 找第一个 { 和最后一个 }
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1)
  }
  return s
}

export async function generatePlan({
  provider,
  ideaTitle,
  ideaContent,
  recentMessages,
  locale,
}: GeneratePlanInput): Promise<PlanDraft> {
  const recent = recentMessages
    .slice(-12)
    .map((m) => `${m.role === 'user' ? 'USER' : 'AI'}: ${m.content}`)
    .join('\n')

  const prompt =
    locale === 'en-US'
      ? `## Idea
Title: ${ideaTitle || '(untitled)'}
Raw:
"""
${ideaContent}
"""

## Recent conversation
${recent || '(none)'}
`
      : `## 原始想法
标题：${ideaTitle || '（无题）'}
原文：
"""
${ideaContent}
"""

## 最近对话
${recent || '（无）'}
`

  // 流式 fetch /v1/chat/completions —— 实测浮生云算等部分 reasoning 网关
  // 在非流式模式下返回 content: null（completion_tokens > 0 但内容丢失），
  // 流式模式下 delta.content 正常。这里自己拼接所有 delta.content 作为文本。
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
        { role: 'user', content: prompt },
      ],
      max_tokens: Math.max(provider.maxOutputTokens, 4000),
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
        // 忽略格式不对的 chunk（有些网关会混入 keep-alive 或注释行）
      }
    }
  }

  if (!text || !text.trim()) {
    throw new Error('AI returned empty stream')
  }

  const cleaned = extractJson(text)
  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    throw new Error(
      `AI returned non-JSON: ${(e as Error).message}\n--- raw ---\n${text.slice(0, 500)}`,
    )
  }

  const result = planSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(
      `AI JSON failed schema: ${result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}\n--- raw ---\n${text.slice(0, 500)}`,
    )
  }

  return result.data
}
