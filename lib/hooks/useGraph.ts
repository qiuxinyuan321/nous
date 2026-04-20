'use client'

import { useQuery } from '@tanstack/react-query'
import type { GraphData } from '@/lib/graph/types'

async function fetchGraph(): Promise<GraphData> {
  const res = await fetch('/api/graph')
  if (!res.ok) throw new Error(`GET /api/graph failed: ${res.status}`)
  return (await res.json()) as GraphData
}

export function useGraph() {
  return useQuery({ queryKey: ['graph'], queryFn: fetchGraph })
}
