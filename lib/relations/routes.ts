/**
 * EntityRef → 站内跳转路由
 * -----------------------------------------------------------
 * 单一映射表 · RelationRail / Omni-Search / Chronicle 都复用。
 */

import type { EntityRef } from './types'

/**
 * 给一个 EntityRef 算出最适合的站内路径（不含 locale 前缀）。
 * 上层配合 `@/lib/i18n/navigation` 的 Link 自动补 locale。
 *
 * 命名用 pathForEntity 而非 routeForRef · 避开 react-hooks/refs 对
 * 含 “ref” 的标识符的误报。
 */
export function pathForEntity(entity: EntityRef): string {
  switch (entity.type) {
    case 'idea':
      return `/refine/${entity.id}`
    case 'note':
      return `/notes?id=${entity.id}`
    case 'task': {
      // Task 没独立详情页 · 跳到所属 milestone 的 plan 页
      // meta.milestoneId 已经在 toTaskRef 里填了，但拿不到 ideaId
      // 简单起见：跳 focus 页让用户在那里看 task（后续可优化）
      return '/focus'
    }
    case 'message': {
      const ideaId = (entity.meta?.ideaId as string | undefined) ?? ''
      return ideaId ? `/refine/${ideaId}#msg-${entity.id}` : '/inbox'
    }
    case 'reflection':
      return '/journal'
    case 'memory':
      return `/memory?id=${entity.id}`
    case 'plan': {
      return '/inbox'
    }
    case 'milestone': {
      return '/focus'
    }
    default:
      return '/workspace'
  }
}

/**
 * 每个 EntityType 对应的显示小标签 · UI 顶部徽章
 */
export const TYPE_LABELS_ZH: Record<EntityRef['type'], string> = {
  idea: '想法',
  note: '笔记',
  task: '任务',
  message: '对话',
  reflection: '复盘',
  memory: '记忆',
  plan: '方案',
  milestone: '里程碑',
}

/**
 * 每个 EntityType 对应的图标（单字符 emoji，保证 SSR 无异步）
 */
export const TYPE_ICONS: Record<EntityRef['type'], string> = {
  idea: '💡',
  note: '📝',
  task: '✓',
  message: '💬',
  reflection: '📖',
  memory: '🧠',
  plan: '🗺️',
  milestone: '🚩',
}
