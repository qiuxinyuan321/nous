import { z } from 'zod'

export const ideaSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  rawContent: z.string(),
  refinedSummary: z.string().nullable(),
  status: z.string(),
  tags: z.array(z.string()),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type Idea = z.infer<typeof ideaSchema>

export const ideaListSchema = z.object({
  ideas: z.array(ideaSchema),
})
