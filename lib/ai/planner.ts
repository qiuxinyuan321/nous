import { generateObject } from 'ai'
import { z } from 'zod'
import { buildModel } from './model'
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
- 不使用 emoji、不使用 Markdown`

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
- No emoji, no Markdown`

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

  const result = await generateObject({
    model: buildModel(provider),
    schema: planSchema,
    schemaName: 'plan',
    schemaDescription: 'Structured execution plan for an idea',
    system: locale === 'en-US' ? EN_SYSTEM : ZH_SYSTEM,
    prompt,
    maxOutputTokens: Math.max(provider.maxOutputTokens, 4000),
    maxRetries: 2,
  })

  return result.object
}
