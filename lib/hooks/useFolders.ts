'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NoteFolderDTO } from '@/lib/types/note'

async function fetchFolders(): Promise<NoteFolderDTO[]> {
  const res = await fetch('/api/notes/folders')
  if (!res.ok) throw new Error(`GET /api/notes/folders failed: ${res.status}`)
  return res.json()
}

export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: fetchFolders,
  })
}

export function useCreateFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; parentId?: string | null; icon?: string }) => {
      const res = await fetch('/api/notes/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`POST /api/notes/folders failed: ${res.status}`)
      return res.json() as Promise<NoteFolderDTO>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] })
    },
  })
}

export function useDeleteFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notes/folders/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`DELETE failed: ${res.status}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] })
      qc.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
