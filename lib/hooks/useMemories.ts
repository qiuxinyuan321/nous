'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MemoryKind } from '@/lib/memory/store'

export interface MemoryDTO {
  id: string
  kind: MemoryKind
  content: string
  importance: number
  source: string
  sourceRef: string | null
  hasEmbedding: boolean
  lastUsedAt: string | null
  createdAt: string
}

async function fetchMemories(): Promise<MemoryDTO[]> {
  const res = await fetch('/api/memory')
  if (!res.ok) throw new Error(`GET /api/memory failed: ${res.status}`)
  const data = (await res.json()) as { memories: MemoryDTO[] }
  return data.memories
}

export function useMemories() {
  return useQuery({ queryKey: ['memories'], queryFn: fetchMemories })
}

export function useCreateMemory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      kind: MemoryKind
      content: string
      importance?: number
    }): Promise<MemoryDTO> => {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error(`POST /api/memory failed: ${res.status}`)
      const { memory } = (await res.json()) as { memory: MemoryDTO }
      return memory
    },
    onSuccess: (memory) => {
      qc.setQueryData<MemoryDTO[]>(['memories'], (prev) => (prev ? [memory, ...prev] : [memory]))
    },
  })
}

export function useDeleteMemory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/memory?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`DELETE /api/memory failed: ${res.status}`)
    },
    onSuccess: (_, id) => {
      qc.setQueryData<MemoryDTO[]>(['memories'], (prev) => prev?.filter((m) => m.id !== id))
    },
  })
}

export function useUpdateMemory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      kind?: MemoryKind
      content?: string
      importance?: number
    }): Promise<void> => {
      const res = await fetch('/api/memory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error(`PATCH /api/memory failed: ${res.status}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memories'] })
    },
  })
}
