'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
} from 'd3-force'

interface GraphNode {
  id: string
  label: string
  tags: string[]
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface GraphEdge {
  source: string | GraphNode
  target: string | GraphNode
}

interface GraphData {
  nodes: GraphNode[]
  edges: Array<{ source: string; target: string }>
}

async function fetchGraph(): Promise<GraphData> {
  const res = await fetch('/api/notes/graph')
  if (!res.ok) throw new Error('Failed to fetch graph')
  return res.json()
}

interface NoteGraphProps {
  onSelect?: (id: string) => void
}

export function NoteGraph({ onSelect }: NoteGraphProps) {
  const { data, isLoading } = useQuery({ queryKey: ['note-graph'], queryFn: fetchGraph })
  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<Simulation<GraphNode, GraphEdge> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })
  const [, forceRender] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setSize({ w: Math.max(320, e.contentRect.width), h: Math.max(360, e.contentRect.height) })
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [] as GraphNode[], edges: [] as GraphEdge[] }
    const n = data.nodes.map((nd) => ({ ...nd }))
    const e: GraphEdge[] = data.edges.map((ed) => ({ ...ed }))
    return { nodes: n, edges: e }
  }, [data])

  useEffect(() => {
    if (nodes.length === 0) return

    const sim = forceSimulation<GraphNode, GraphEdge>(nodes)
      .force(
        'link',
        forceLink<GraphNode, GraphEdge>(edges)
          .id((d) => d.id)
          .distance(80),
      )
      .force('charge', forceManyBody().strength(-120))
      .force('center', forceCenter(size.w / 2, size.h / 2))
      .force('collide', forceCollide(20))
      .on('tick', () => forceRender((c) => c + 1))

    simRef.current = sim
    return () => {
      sim.stop()
    }
  }, [nodes, edges, size.w, size.h])

  // 节点链接数 → 半径
  const linkCount = useMemo(() => {
    const count = new Map<string, number>()
    for (const e of data?.edges ?? []) {
      count.set(e.source, (count.get(e.source) ?? 0) + 1)
      count.set(e.target, (count.get(e.target) ?? 0) + 1)
    }
    return count
  }, [data?.edges])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-ink-light text-sm">加载图谱…</p>
      </div>
    )
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-ink-light text-sm">暂无笔记或链接</p>
        <p className="text-ink-light/50 text-xs">在笔记中使用 [[标题]] 创建双向链接</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        className="cursor-grab active:cursor-grabbing"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="g" />
            <feMerge>
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* edges */}
        {edges.map((e, i) => {
          const src = typeof e.source === 'string' ? nodes.find((n) => n.id === e.source) : e.source
          const tgt = typeof e.target === 'string' ? nodes.find((n) => n.id === e.target) : e.target
          if (!src?.x || !tgt?.x) return null
          return (
            <line
              key={i}
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              stroke="#A8A59C"
              strokeWidth={1}
              strokeOpacity={0.4}
            />
          )
        })}
        {/* nodes */}
        {nodes.map((node) => {
          const lc = linkCount.get(node.id) ?? 0
          const r = Math.min(4 + lc * 2, 14)
          return (
            <g
              key={node.id}
              transform={`translate(${node.x ?? 0},${node.y ?? 0})`}
              onClick={() => onSelect?.(node.id)}
              className="cursor-pointer"
              style={{ transition: 'opacity 0.15s' }}
              onMouseEnter={(e) => {
                e.currentTarget.setAttribute('filter', 'url(#glow)')
              }}
              onMouseLeave={(e) => {
                e.currentTarget.removeAttribute('filter')
              }}
            >
              <circle r={r} fill="#3E5871" fillOpacity={0.8} stroke="#1C1B19" strokeWidth={1} />
              <text
                dy={-r - 4}
                textAnchor="middle"
                className="fill-[#1C1B19] text-[10px]"
                style={{ pointerEvents: 'none' }}
              >
                {node.label.length > 14 ? `${node.label.slice(0, 14)}…` : node.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
