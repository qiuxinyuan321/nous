import { describe, expect, it } from 'vitest'
import {
  toIdeaRef,
  toMemoryRef,
  toMessageRef,
  toNoteRef,
  toReflectionRef,
  toTaskRef,
} from '@/lib/relations/serialize'

const NOW = new Date('2026-04-22T10:00:00Z')

describe('serialize · toIdeaRef', () => {
  it('prefers explicit title', () => {
    const r = toIdeaRef({
      id: 'i1',
      title: '一个产品灵感',
      rawContent: '正文',
      refinedSummary: null,
      status: 'raw',
      tags: ['a'],
      createdAt: NOW,
      updatedAt: NOW,
    })
    expect(r.title).toBe('一个产品灵感')
    expect(r.type).toBe('idea')
    expect(r.meta?.status).toBe('raw')
    expect(r.meta?.tags).toEqual(['a'])
  })

  it('falls back to refinedSummary then rawContent', () => {
    const r = toIdeaRef({
      id: 'i1',
      title: null,
      rawContent: 'x'.repeat(200),
      refinedSummary: '  这是精炼总结  ',
      status: 'refining',
      tags: [],
      createdAt: NOW,
      updatedAt: NOW,
    })
    expect(r.title).toBe('这是精炼总结')
  })

  it('falls back to 无题想法 when everything empty', () => {
    const r = toIdeaRef({
      id: 'i1',
      title: '',
      rawContent: '',
      refinedSummary: null,
      status: 'raw',
      tags: [],
      createdAt: NOW,
      updatedAt: NOW,
    })
    expect(r.title).toBe('无题想法')
  })

  it('trims long snippet with ellipsis', () => {
    const long = 'a'.repeat(200)
    const r = toIdeaRef({
      id: 'i1',
      title: 'x',
      rawContent: long,
      refinedSummary: null,
      status: 'raw',
      tags: [],
      createdAt: NOW,
      updatedAt: NOW,
    })
    expect(r.snippet?.endsWith('…')).toBe(true)
    expect(r.snippet?.length).toBeLessThanOrEqual(121)
  })
})

describe('serialize · toNoteRef', () => {
  it('handles empty title with 无题', () => {
    const r = toNoteRef({
      id: 'n1',
      title: '',
      content: '正文',
      tags: [],
      ideaId: null,
      updatedAt: NOW,
    })
    expect(r.title).toBe('无题')
  })

  it('carries ideaId in meta when present', () => {
    const r = toNoteRef({
      id: 'n1',
      title: '标题',
      content: '正文',
      tags: ['x'],
      ideaId: 'i1',
      updatedAt: NOW,
    })
    expect(r.meta?.ideaId).toBe('i1')
  })
})

describe('serialize · toTaskRef', () => {
  it('uses completedAt when present', () => {
    const completed = new Date('2026-04-22T12:00:00Z')
    const r = toTaskRef({
      id: 't1',
      title: '写文档',
      description: null,
      priority: 'must',
      status: 'done',
      milestoneId: 'm1',
      completedAt: completed,
      focusedOn: null,
    })
    expect(r.timestamp.getTime()).toBe(completed.getTime())
  })

  it('falls back to focusedOn when not completed', () => {
    const focus = new Date('2026-04-22T00:00:00Z')
    const r = toTaskRef({
      id: 't1',
      title: '写文档',
      description: null,
      priority: 'should',
      status: 'doing',
      milestoneId: 'm1',
      completedAt: null,
      focusedOn: focus,
    })
    expect(r.timestamp.getTime()).toBe(focus.getTime())
  })
})

describe('serialize · toMessageRef', () => {
  it('labels user vs assistant', () => {
    const base = {
      id: 'msg1',
      content: '内容',
      phase: 'intent',
      ideaId: 'i1',
      createdAt: NOW,
    }
    expect(toMessageRef({ ...base, role: 'user' }).title).toBe('我说')
    expect(toMessageRef({ ...base, role: 'assistant' }).title).toBe('AI 回应')
  })
})

describe('serialize · toReflectionRef', () => {
  it('maps kind to zh label', () => {
    const base = {
      id: 'r1',
      content: '内容',
      aiInsight: null,
      ideaId: null,
      createdAt: NOW,
    }
    expect(toReflectionRef({ ...base, kind: 'daily' }).title).toBe('每日复盘')
    expect(toReflectionRef({ ...base, kind: 'weekly' }).title).toBe('每周复盘')
    expect(toReflectionRef({ ...base, kind: 'on-complete' }).title).toBe('完成复盘')
    expect(toReflectionRef({ ...base, kind: 'unknown' }).title).toBe('复盘')
  })
})

describe('serialize · toMemoryRef', () => {
  it('labels by kind', () => {
    const base = {
      id: 'mem1',
      content: '内容',
      importance: 3,
      source: 'manual',
      sourceRef: null,
      createdAt: NOW,
    }
    expect(toMemoryRef({ ...base, kind: 'preference' }).title).toBe('偏好')
    expect(toMemoryRef({ ...base, kind: 'habit' }).title).toBe('习惯')
    expect(toMemoryRef({ ...base, kind: 'goal' }).title).toBe('目标')
    expect(toMemoryRef({ ...base, kind: 'blindspot' }).title).toBe('盲点')
    expect(toMemoryRef({ ...base, kind: 'fact' }).title).toBe('事实')
  })
})
