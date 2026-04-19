'use client'

import { useQuery } from '@tanstack/react-query'

export interface QuotaState {
  source: 'byok' | 'demo'
  limit: number | null
  count: number
  remaining: number | null
}

async function fetchQuota(): Promise<QuotaState> {
  const res = await fetch('/api/quota')
  if (!res.ok) throw new Error(`GET /api/quota failed: ${res.status}`)
  return res.json()
}

export function useQuota() {
  return useQuery({
    queryKey: ['quota'],
    queryFn: fetchQuota,
    staleTime: 10_000,
  })
}
