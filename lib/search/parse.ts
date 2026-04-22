/**
 * 查询串前缀解析
 * -----------------------------------------------------------
 * 例：
 *   "idea: 产品灵感"      → { types: ['idea'], query: '产品灵感' }
 *   "msg: ref: 回顾"      → { types: ['message','reflection'], query: '回顾' }
 *   "tag:写作 产品"       → { tag: '写作', query: '产品' }
 *
 * 保持简单 · 仅识别开头的连续 prefix token · 不支持嵌套或转义。
 */

import type { ParsedQuery, SearchEntityType } from './types'

const TYPE_ALIAS: Record<string, SearchEntityType> = {
  idea: 'idea',
  note: 'note',
  msg: 'message',
  message: 'message',
  ref: 'reflection',
  reflection: 'reflection',
  mem: 'memory',
  memory: 'memory',
}

const TYPE_PREFIX_RE = /^(idea|note|msg|message|ref|reflection|mem|memory)\s*:\s*/i
const TAG_PREFIX_RE = /^tag\s*:\s*([^\s]+)\s*/i

export function parseQuery(raw: string): ParsedQuery {
  let rest = raw.trim()
  const types = new Set<SearchEntityType>()
  let tag: string | undefined

  // 连续吃掉 prefix · 最多 6 次循环防死
  for (let i = 0; i < 6; i++) {
    const typeMatch = rest.match(TYPE_PREFIX_RE)
    if (typeMatch) {
      types.add(TYPE_ALIAS[typeMatch[1].toLowerCase()]!)
      rest = rest.slice(typeMatch[0].length)
      continue
    }
    const tagMatch = rest.match(TAG_PREFIX_RE)
    if (tagMatch && !tag) {
      tag = tagMatch[1]
      rest = rest.slice(tagMatch[0].length)
      continue
    }
    break
  }

  return {
    query: rest.trim(),
    filters: {
      types: types.size ? Array.from(types) : undefined,
      tag,
    },
  }
}
