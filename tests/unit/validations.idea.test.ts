import { describe, expect, it } from 'vitest'
import { createIdeaSchema, ideaStatusEnum, updateIdeaSchema } from '@/lib/validations/idea'

describe('createIdeaSchema', () => {
  it('accepts minimal input with only rawContent', () => {
    const result = createIdeaSchema.safeParse({ rawContent: '做一个 INTP 工具' })
    expect(result.success).toBe(true)
    expect(result.success && result.data.rawContent).toBe('做一个 INTP 工具')
  })

  it('rejects empty rawContent', () => {
    const result = createIdeaSchema.safeParse({ rawContent: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects rawContent exceeding 10000 chars', () => {
    const result = createIdeaSchema.safeParse({ rawContent: 'x'.repeat(10_001) })
    expect(result.success).toBe(false)
  })

  it('limits tags to 10', () => {
    const result = createIdeaSchema.safeParse({
      rawContent: 'hi',
      tags: Array.from({ length: 11 }, (_, i) => `t${i}`),
    })
    expect(result.success).toBe(false)
  })

  it('trims whitespace on content', () => {
    const result = createIdeaSchema.safeParse({ rawContent: '  想法  ' })
    expect(result.success && result.data.rawContent).toBe('想法')
  })
})

describe('ideaStatusEnum', () => {
  it('accepts known statuses', () => {
    expect(ideaStatusEnum.safeParse('raw').success).toBe(true)
    expect(ideaStatusEnum.safeParse('planned').success).toBe(true)
    expect(ideaStatusEnum.safeParse('done').success).toBe(true)
  })

  it('rejects unknown status', () => {
    expect(ideaStatusEnum.safeParse('unknown').success).toBe(false)
  })
})

describe('updateIdeaSchema', () => {
  it('allows partial update', () => {
    const result = updateIdeaSchema.safeParse({ status: 'refining' })
    expect(result.success).toBe(true)
  })

  it('allows empty object', () => {
    expect(updateIdeaSchema.safeParse({}).success).toBe(true)
  })
})
