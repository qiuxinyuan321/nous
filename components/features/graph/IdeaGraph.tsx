'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
} from 'd3-force'
import type { GraphData, GraphNode, IdeaStatus } from '@/lib/graph/types'
import { cn } from '@/lib/utils'

interface IdeaGraphProps {
  data: GraphData
  width: number
  height: number
  selectedId: string | null
  onSelect: (id: string | null) => void
  statusFilter: IdeaStatus | 'all'
}

/** 按状态着色 (对齐 Ink 设计语言) */
const STATUS_COLOR: Record<IdeaStatus, string> = {
  raw: '#8B8880', // ink-light
  refining: '#3E5871', // indigo-stone
  planned: '#B8955A', // gold-leaf
  executing: '#6B8E7A', // celadon
  done: '#1C1B19', // ink-heavy
  archived: '#A8A59C',
}

interface SimEdge {
  source: GraphNode | string
  target: GraphNode | string
}

export function IdeaGraph({
  data,
  width,
  height,
  selectedId,
  onSelect,
  statusFilter,
}: IdeaGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<Simulation<GraphNode, SimEdge> | null>(null)

  // 缩放 / 平移
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const panRef = useRef<{ x: number; y: number } | null>(null)

  // force simulation tick 触发 re-render
  const [, setTick] = useState(0)

  // 过滤 + 深克隆 (force simulation mutate 节点坐标)
  const { nodes, edges, neighbors } = useMemo(() => {
    const keep = new Set<string>()
    const filteredIdeas = data.nodes.filter(
      (n) => n.kind === 'idea' && (statusFilter === 'all' || n.status === statusFilter),
    )
    for (const n of filteredIdeas) keep.add(n.id)

    const edgesFiltered = data.edges.filter((e) => keep.has(e.source))
    // 保留被连接的 tag
    for (const e of edgesFiltered) keep.add(e.target)

    const nodes = data.nodes.filter((n) => keep.has(n.id)).map((n) => ({ ...n })) // 克隆避免污染上层数据

    const neighbors = new Map<string, Set<string>>()
    for (const e of edgesFiltered) {
      if (!neighbors.has(e.source)) neighbors.set(e.source, new Set())
      if (!neighbors.has(e.target)) neighbors.set(e.target, new Set())
      neighbors.get(e.source)!.add(e.target)
      neighbors.get(e.target)!.add(e.source)
    }
    return { nodes, edges: edgesFiltered, neighbors }
  }, [data, statusFilter])

  // 力引擎 (挂载/数据变化时重建)
  useEffect(() => {
    if (nodes.length === 0) return
    simRef.current?.stop()

    const sim = forceSimulation<GraphNode, SimEdge>(nodes)
      .force(
        'link',
        forceLink<GraphNode, SimEdge>(edges.map((e) => ({ source: e.source, target: e.target })))
          .id((d) => d.id)
          .distance((l) => {
            const src = typeof l.source === 'string' ? null : l.source
            const tgt = typeof l.target === 'string' ? null : l.target
            // tag 连接短一些, 让 ideas 围着 tag 聚
            if (src?.kind === 'tag' || tgt?.kind === 'tag') return 60
            return 90
          })
          .strength(0.3),
      )
      .force('charge', forceManyBody<GraphNode>().strength(-180))
      .force('center', forceCenter(width / 2, height / 2).strength(0.06))
      .force('x', forceX<GraphNode>(width / 2).strength(0.02))
      .force('y', forceY<GraphNode>(height / 2).strength(0.04))
      .force(
        'collision',
        forceCollide<GraphNode>().radius((d) => {
          if (d.kind === 'tag') return 22 + Math.min(18, d.count * 2)
          return 14
        }),
      )
      .alpha(1)
      .alphaDecay(0.035)

    sim.on('tick', () => {
      // 触发 re-render (useState dummy)
      setTick((t) => t + 1)
    })

    simRef.current = sim
    return () => {
      sim.stop()
    }
  }, [nodes, edges, width, height])

  // —— 拖动节点 ——
  const draggingRef = useRef<GraphNode | null>(null)

  function onNodePointerDown(e: React.PointerEvent, node: GraphNode) {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    draggingRef.current = node
    // Pin
    node.fx = node.x
    node.fy = node.y
    simRef.current?.alphaTarget(0.3).restart()
  }

  function onNodePointerUp(e: React.PointerEvent, node: GraphNode) {
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
    draggingRef.current = null
    // 松开后解除 pin,让力引擎重新整理
    node.fx = null
    node.fy = null
    simRef.current?.alphaTarget(0)
  }

  // 统一的 SVG move: 先处理节点拖,否则处理平移
  function onSvgPointerMove(e: React.PointerEvent) {
    const svg = svgRef.current
    if (!svg) return

    if (draggingRef.current) {
      const pt = svg.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      const ctm = svg.getScreenCTM()
      if (!ctm) return
      const local = pt.matrixTransform(ctm.inverse())
      draggingRef.current.fx = (local.x - transform.x) / transform.k
      draggingRef.current.fy = (local.y - transform.y) / transform.k
      return
    }

    if (panRef.current) {
      setTransform((t) => ({
        ...t,
        x: e.clientX - panRef.current!.x,
        y: e.clientY - panRef.current!.y,
      }))
    }
  }

  // —— 缩放(wheel) + 平移(drag 空白) ——
  function onWheel(e: React.WheelEvent) {
    if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 10) return
    e.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    const nextK = Math.min(2.4, Math.max(0.4, transform.k * factor))
    // 以鼠标为中心缩放
    const nextX = mouseX - ((mouseX - transform.x) / transform.k) * nextK
    const nextY = mouseY - ((mouseY - transform.y) / transform.k) * nextK
    setTransform({ x: nextX, y: nextY, k: nextK })
  }

  function onBgPointerDown(e: React.PointerEvent) {
    // 仅背景 (即 svg 本身) 触发平移
    if (e.target !== e.currentTarget) return
    panRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y }
    setIsPanning(true)
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    onSelect(null)
  }

  function onBgPointerUp(e: React.PointerEvent) {
    panRef.current = null
    setIsPanning(false)
    ;(e.currentTarget as Element).releasePointerCapture?.(e.pointerId)
  }

  const highlightNeighbors = selectedId ? (neighbors.get(selectedId) ?? new Set()) : null
  const dim = (id: string) =>
    selectedId && selectedId !== id && !highlightNeighbors?.has(id) ? 0.22 : 1

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      onWheel={onWheel}
      onPointerDown={onBgPointerDown}
      onPointerMove={onSvgPointerMove}
      onPointerUp={onBgPointerUp}
      className={cn('cursor-grab touch-none select-none', isPanning && 'cursor-grabbing')}
      role="img"
      aria-label="想法图谱"
    >
      {/* 纸面雾化 */}
      <defs>
        <radialGradient id="graph-bg" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0%" stopColor="#FAF7EF" />
          <stop offset="100%" stopColor="#F2EBD8" />
        </radialGradient>
        <filter id="ink-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.4" />
        </filter>
      </defs>
      <rect width={width} height={height} fill="url(#graph-bg)" />

      <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
        {/* 边 */}
        {edges.map((e, i) => {
          const a =
            typeof e.source === 'string'
              ? nodes.find((n) => n.id === e.source)
              : (e.source as GraphNode)
          const b =
            typeof e.target === 'string'
              ? nodes.find((n) => n.id === e.target)
              : (e.target as GraphNode)
          if (!a || !b || a.x == null || b.x == null) return null
          const o = Math.min(dim(a.id), dim(b.id))
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#1C1B19"
              strokeWidth={0.8}
              opacity={0.28 * o}
              strokeLinecap="round"
            />
          )
        })}

        {/* 节点 */}
        {nodes.map((n) => {
          if (n.x == null || n.y == null) return null
          const isSelected = selectedId === n.id
          const o = dim(n.id)

          if (n.kind === 'tag') {
            const side = 26 + Math.min(16, n.count * 2)
            return (
              <g
                key={n.id}
                transform={`translate(${n.x},${n.y}) rotate(-6)`}
                opacity={o}
                style={{ cursor: 'grab' }}
                onPointerDown={(e) => onNodePointerDown(e, n)}
                onPointerUp={(e) => onNodePointerUp(e, n)}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(n.id === selectedId ? null : n.id)
                }}
              >
                <rect
                  x={-side / 2}
                  y={-side / 2}
                  width={side}
                  height={side}
                  rx={2.5}
                  fill="#B8372F"
                  stroke={isSelected ? '#1C1B19' : 'transparent'}
                  strokeWidth={1.6}
                  filter="url(#ink-soft)"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#FAF7EF"
                  fontSize={Math.max(9, Math.min(12, side / 3.2))}
                  fontFamily="Georgia, serif"
                  fontWeight={500}
                  style={{ pointerEvents: 'none' }}
                >
                  {n.name.length > 4 ? n.name.slice(0, 4) + '…' : n.name}
                </text>
              </g>
            )
          }

          const r = 6 + Math.min(8, n.messageCount * 0.6) + (n.hasPlan ? 2 : 0)
          const color = STATUS_COLOR[n.status]
          return (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              opacity={o}
              style={{ cursor: 'grab' }}
              onPointerDown={(e) => onNodePointerDown(e, n)}
              onPointerUp={(e) => onNodePointerUp(e, n)}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(n.id === selectedId ? null : n.id)
              }}
            >
              {/* 墨痕外晕 */}
              <circle r={r + 4} fill={color} opacity={0.12} />
              <circle
                r={r}
                fill={color}
                stroke={isSelected ? '#1C1B19' : 'transparent'}
                strokeWidth={2}
              />
              {n.hasPlan && (
                <circle r={r - 3} fill="none" stroke="#FAF7EF" strokeWidth={1} opacity={0.7} />
              )}
              {(isSelected || highlightNeighbors?.has(n.id)) && (
                <text
                  y={r + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#1C1B19"
                  fontFamily="serif"
                  style={{ pointerEvents: 'none' }}
                >
                  {n.title.length > 14 ? n.title.slice(0, 14) + '…' : n.title}
                </text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
