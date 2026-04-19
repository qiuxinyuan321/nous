import { describe, expect, it } from 'vitest'

describe('smoke', () => {
  it('runtime is alive', () => {
    expect(1 + 1).toBe(2)
  })

  it('can import path alias (placeholder)', () => {
    expect(typeof process).toBe('object')
  })
})
