import { z } from 'zod'

export const createIdeaSchema = z.object({
  rawContent: z.string().trim().min(1, '说点什么再落笔').max(10_000, '超过 10000 字了'),
  title: z.string().trim().max(200).optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(10).optional(),
})

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>

export const ideaStatusEnum = z.enum([
  'raw',
  'refining',
  'planned',
  'executing',
  'done',
  'archived',
])

export type IdeaStatus = z.infer<typeof ideaStatusEnum>

export const updateIdeaSchema = z.object({
  title: z.string().trim().max(200).optional(),
  refinedSummary: z.string().max(5_000).optional(),
  status: ideaStatusEnum.optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(10).optional(),
})

export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>
