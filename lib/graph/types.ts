import type { SimulationNodeDatum } from 'd3-force'

export type IdeaStatus = 'raw' | 'refining' | 'planned' | 'executing' | 'done' | 'archived'

export interface IdeaGraphNode extends SimulationNodeDatum {
  kind: 'idea'
  id: string
  title: string
  excerpt: string
  status: IdeaStatus
  tagCount: number
  messageCount: number
  hasPlan: boolean
  createdAt: string
}

export interface TagGraphNode extends SimulationNodeDatum {
  kind: 'tag'
  id: string
  name: string
  count: number
}

export type GraphNode = IdeaGraphNode | TagGraphNode

export interface GraphEdge {
  source: string
  target: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  meta: {
    ideaCount: number
    tagCount: number
    untaggedIdeaCount: number
  }
}
