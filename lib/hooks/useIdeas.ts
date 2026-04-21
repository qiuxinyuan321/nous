'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Idea } from '@/lib/types/idea'

async function fetchIdeas(): Promise<Idea[]> {
  const res = await fetch('/api/ideas')
  if (!res.ok) throw new Error(`GET /api/ideas failed: ${res.status}`)
  const data = (await res.json()) as { ideas: Idea[] }
  return data.ideas
}

async function createIdeaRequest(input: { rawContent: string; title?: string }): Promise<Idea> {
  const res = await fetch('/api/ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `POST /api/ideas failed: ${res.status}`)
  }
  const { idea } = (await res.json()) as { idea: Idea }
  return idea
}

export function useIdeas() {
  return useQuery({ queryKey: ['ideas'], queryFn: fetchIdeas })
}

export function useCreateIdea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createIdeaRequest,
    onSuccess: (idea) => {
      qc.setQueryData<Idea[]>(['ideas'], (prev) => (prev ? [idea, ...prev] : [idea]))
    },
  })
}

async function deleteIdeaRequest(id: string): Promise<void> {
  const res = await fetch(`/api/ideas/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `DELETE /api/ideas/${id} failed: ${res.status}`)
  }
}

export function useDeleteIdea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteIdeaRequest,
    onSuccess: (_data, id) => {
      qc.setQueryData<Idea[]>(['ideas'], (prev) => prev?.filter((i) => i.id !== id) ?? [])
    },
  })
}
