import { z } from 'zod'

export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  folderId: z.string().nullable(),
  tags: z.array(z.string()),
  pinned: z.boolean(),
  archived: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type NoteDTO = z.infer<typeof noteSchema>

export const noteFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  orderIdx: z.number(),
  icon: z.string().nullable(),
  noteCount: z.number().optional(),
})

export type NoteFolderDTO = z.infer<typeof noteFolderSchema>

export const createNoteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().optional(),
  folderId: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const updateNoteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().optional(),
  folderId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
})

export const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().nullable().optional(),
  icon: z.string().max(4).optional(),
})

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().nullable().optional(),
  icon: z.string().max(4).nullable().optional(),
  orderIdx: z.number().optional(),
})
