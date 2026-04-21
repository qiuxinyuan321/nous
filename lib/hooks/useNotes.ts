'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NoteDTO } from '@/lib/types/note'

interface NotesResponse {
  notes: NoteDTO[]
  nextCursor: string | null
}

async function fetchNotes(params?: Record<string, string>): Promise<NotesResponse> {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`/api/notes${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error(`GET /api/notes failed: ${res.status}`)
  return res.json()
}

async function fetchNote(
  id: string,
): Promise<NoteDTO & { outLinks?: unknown[]; inLinks?: unknown[]; folder?: unknown; idea?: { id: string; title: string | null; status: string } | null }> {
  const res = await fetch(`/api/notes/${id}`)
  if (!res.ok) throw new Error(`GET /api/notes/${id} failed: ${res.status}`)
  return res.json()
}

export function useNotes(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['notes', params],
    queryFn: () => fetchNotes(params),
  })
}

export function useNote(id: string | null) {
  return useQuery({
    queryKey: ['note', id],
    queryFn: () => fetchNote(id!),
    enabled: !!id,
  })
}

async function createNoteReq(data: {
  title?: string
  content?: string
  folderId?: string
  tags?: string[]
}): Promise<NoteDTO> {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`POST /api/notes failed: ${res.status}`)
  return res.json()
}

async function updateNoteReq({
  id,
  ...data
}: { id: string } & Record<string, unknown>): Promise<NoteDTO> {
  const res = await fetch(`/api/notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`PATCH /api/notes/${id} failed: ${res.status}`)
  return res.json()
}

async function deleteNoteReq(id: string): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE /api/notes/${id} failed: ${res.status}`)
}

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createNoteReq,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useUpdateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateNoteReq,
    onSuccess: (note) => {
      qc.setQueryData(['note', note.id], note)
      qc.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteNoteReq,
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ['note', id] })
      qc.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
