import { describe, expect, it } from 'vitest'
import { parseQuery } from '@/lib/search/parse'
import { extractHighlight } from '@/lib/search/fulltext'

describe('parseQuery', () => {
  it('returns empty filters when no prefix', () => {
    const r = parseQuery('产品灵感')
    expect(r.query).toBe('产品灵感')
    expect(r.filters.types).toBeUndefined()
    expect(r.filters.tag).toBeUndefined()
  })

  it('extracts single type prefix', () => {
    const r = parseQuery('idea: 写作')
    expect(r.query).toBe('写作')
    expect(r.filters.types).toEqual(['idea'])
  })

  it('accepts aliases like msg / ref / mem', () => {
    expect(parseQuery('msg: 讨论').filters.types).toEqual(['message'])
    expect(parseQuery('ref: 回顾').filters.types).toEqual(['reflection'])
    expect(parseQuery('mem: 偏好').filters.types).toEqual(['memory'])
  })

  it('accumulates multiple type prefixes', () => {
    const r = parseQuery('msg: ref: 回顾')
    expect(r.query).toBe('回顾')
    expect(r.filters.types).toEqual(expect.arrayContaining(['message', 'reflection']))
    expect(r.filters.types?.length).toBe(2)
  })

  it('extracts tag prefix', () => {
    const r = parseQuery('tag:写作 产品')
    expect(r.query).toBe('产品')
    expect(r.filters.tag).toBe('写作')
  })

  it('combines type + tag prefixes', () => {
    const r = parseQuery('idea: tag:写作 产品')
    expect(r.query).toBe('产品')
    expect(r.filters.types).toEqual(['idea'])
    expect(r.filters.tag).toBe('写作')
  })

  it('is case-insensitive for type keywords', () => {
    const r = parseQuery('IDEA: 写作')
    expect(r.filters.types).toEqual(['idea'])
  })

  it('ignores prefix when no query follows', () => {
    const r = parseQuery('idea:')
    expect(r.query).toBe('')
    expect(r.filters.types).toEqual(['idea'])
  })

  it('handles extra whitespace in prefix', () => {
    const r = parseQuery('idea   :   写作')
    expect(r.query).toBe('写作')
    expect(r.filters.types).toEqual(['idea'])
  })
})

describe('extractHighlight', () => {
  it('returns first 120 chars when query not found', () => {
    const long = 'x'.repeat(200)
    const r = extractHighlight(long, 'z')
    expect(r).toBe('x'.repeat(120))
  })

  it('returns snippet around query match', () => {
    const text = 'aaaa bbbb 产品 cccc dddd'
    const r = extractHighlight(text, '产品')
    expect(r).toContain('产品')
  })

  it('adds ellipsis when truncated', () => {
    const text = 'z'.repeat(100) + '产品' + 'y'.repeat(100)
    const r = extractHighlight(text, '产品')
    expect(r?.startsWith('…')).toBe(true)
    expect(r?.endsWith('…')).toBe(true)
  })

  it('is case-insensitive', () => {
    const r = extractHighlight('hello World', 'WORLD')
    expect(r?.toLowerCase()).toContain('world')
  })

  it('returns undefined for empty source', () => {
    expect(extractHighlight('', 'x')).toBeUndefined()
    expect(extractHighlight(null, 'x')).toBeUndefined()
  })
})
