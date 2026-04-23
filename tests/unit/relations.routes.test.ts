import { describe, expect, it } from 'vitest'
import { pathForEntity, TYPE_ICONS, TYPE_LABELS_ZH } from '@/lib/relations/routes'
import type { EntityRef } from '@/lib/relations/types'

const NOW = new Date('2026-04-22T10:00:00Z')

function makeRef(partial: Partial<EntityRef> & { type: EntityRef['type']; id: string }): EntityRef {
  return {
    title: 'x',
    timestamp: NOW,
    ...partial,
  }
}

describe('pathForEntity', () => {
  it('routes idea to /refine/{id}', () => {
    expect(pathForEntity(makeRef({ type: 'idea', id: 'i1' }))).toBe('/refine/i1')
  })

  it('routes note with query id', () => {
    expect(pathForEntity(makeRef({ type: 'note', id: 'n1' }))).toBe('/notes?id=n1')
  })

  it('routes memory with query id', () => {
    expect(pathForEntity(makeRef({ type: 'memory', id: 'm1' }))).toBe('/memory?id=m1')
  })

  it('routes message with ideaId in meta', () => {
    const r = makeRef({ type: 'message', id: 'msg1', meta: { ideaId: 'i1' } })
    expect(pathForEntity(r)).toBe('/refine/i1#msg-msg1')
  })

  it('falls back to /inbox for message without ideaId', () => {
    expect(pathForEntity(makeRef({ type: 'message', id: 'msg1' }))).toBe('/inbox')
  })

  it('routes task to /focus by default', () => {
    expect(pathForEntity(makeRef({ type: 'task', id: 't1' }))).toBe('/focus')
  })

  it('routes reflection to /journal', () => {
    expect(pathForEntity(makeRef({ type: 'reflection', id: 'r1' }))).toBe('/journal')
  })

  it('routes plan fallback to /inbox', () => {
    expect(pathForEntity(makeRef({ type: 'plan', id: 'p1' }))).toBe('/inbox')
  })

  it('routes milestone to /focus', () => {
    expect(pathForEntity(makeRef({ type: 'milestone', id: 'mi1' }))).toBe('/focus')
  })
})

describe('TYPE_LABELS_ZH & TYPE_ICONS', () => {
  it('covers all 8 entity types', () => {
    const types: EntityRef['type'][] = [
      'idea',
      'note',
      'task',
      'message',
      'reflection',
      'memory',
      'plan',
      'milestone',
    ]
    for (const t of types) {
      expect(TYPE_LABELS_ZH[t]).toBeTruthy()
      expect(TYPE_ICONS[t]).toBeTruthy()
    }
  })
})
