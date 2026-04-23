/**
 * regeneratePlanAction 单测 · 覆盖 9 条关键分支
 *
 * 策略：vi.mock 所有外部副作用（auth / db / redis / AI / cache revalidate）
 * · 只验证 action 在各种失败 / 成功场景下返回正确错误码和调用正确副作用。
 *
 * 覆盖分支：
 *   1. UNAUTHORIZED        · 无 session
 *   2. RATE_LIMITED        · consumeToken 抛 RateLimitError
 *   3. NOT_FOUND           · idea 不存在 / 不属于用户
 *   4. NO_EXISTING_PLAN    · idea 有但没 plan
 *   5. PROVIDER_UNAVAILABLE· resolveProvider 抛
 *   6. QUOTA_EXCEEDED      · consumeDemoQuota 抛（demo 路径）
 *   7. AI_GENERATION_FAILED· generatePlan 抛
 *   8. PERSIST_FAILED      · $transaction 抛
 *   9. success             · 调 tx.plan.delete + create · revalidatePath 被触发 · 返回 ok
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QuotaExceededError, RateLimitError } from '@/lib/ai/types'

// ─── Mocks ───────────────────────────────────────
const authMock = vi.fn()
const consumeTokenMock = vi.fn()
const consumeDemoQuotaMock = vi.fn()
const resolveProviderMock = vi.fn()
const generatePlanMock = vi.fn()
const revalidatePathMock = vi.fn()

const findFirstMock = vi.fn()
const txPlanDeleteMock = vi.fn()
const txPlanCreateMock = vi.fn()
const txMilestoneCreateMock = vi.fn()
const txTaskCreateMock = vi.fn()
const transactionMock = vi.fn()

vi.mock('@/lib/auth', () => ({ auth: () => authMock() }))
vi.mock('@/lib/ai/ratelimit', () => ({
  consumeToken: (...args: unknown[]) => consumeTokenMock(...args),
}))
vi.mock('@/lib/ai/quota', () => ({
  consumeDemoQuota: (...args: unknown[]) => consumeDemoQuotaMock(...args),
}))
vi.mock('@/lib/ai/providers', () => ({
  resolveProvider: (...args: unknown[]) => resolveProviderMock(...args),
}))
vi.mock('@/lib/ai/planner', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/planner')>('@/lib/ai/planner')
  return {
    ...actual,
    generatePlan: (...args: unknown[]) => generatePlanMock(...args),
  }
})
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

vi.mock('@/lib/db', () => ({
  prisma: {
    idea: { findFirst: (...args: unknown[]) => findFirstMock(...args) },
    $transaction: (cb: (tx: unknown) => Promise<unknown>) => transactionMock(cb),
  },
}))

// ─── import target AFTER mocks ──────────────────
const { regeneratePlanAction } = await import('@/app/[locale]/(app)/refine/[id]/actions')

// ─── fixtures ───────────────────────────────────
function okSession(userId = 'u1') {
  return { user: { id: userId } }
}

function okIdea(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'idea1',
    title: 'T',
    rawContent: 'C',
    messages: [{ role: 'user', content: 'hi' }],
    plan: { id: 'plan-old' },
    ...overrides,
  }
}

const okDraft = {
  goal: 'G',
  successCriteria: ['A'],
  risks: [],
  firstAction: 'do',
  milestones: [
    {
      title: 'm1',
      deadline: null,
      tasks: [{ title: 't1', description: null, priority: 'must', estimatedMin: 10 }],
    },
  ],
}

function buildTxStub() {
  return {
    plan: {
      delete: (...a: unknown[]) => txPlanDeleteMock(...a),
      create: (...a: unknown[]) => txPlanCreateMock(...a),
    },
    milestone: { create: (...a: unknown[]) => txMilestoneCreateMock(...a) },
    task: { create: (...a: unknown[]) => txTaskCreateMock(...a) },
  }
}

// 默认 happy-path 走事务 · 让它真正执行 callback
transactionMock.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
  const tx = buildTxStub()
  return cb(tx)
})

// ─── tests ──────────────────────────────────────
beforeEach(() => {
  authMock.mockReset()
  consumeTokenMock.mockReset()
  consumeDemoQuotaMock.mockReset()
  resolveProviderMock.mockReset()
  generatePlanMock.mockReset()
  revalidatePathMock.mockReset()
  findFirstMock.mockReset()
  txPlanDeleteMock.mockReset().mockResolvedValue({})
  txPlanCreateMock.mockReset().mockResolvedValue({ id: 'plan-new' })
  txMilestoneCreateMock.mockReset().mockResolvedValue({ id: 'm-new' })
  txTaskCreateMock.mockReset().mockResolvedValue({ id: 't-new' })
  transactionMock.mockClear()
  transactionMock.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
    const tx = buildTxStub()
    return cb(tx)
  })
})

describe('regeneratePlanAction · branches', () => {
  it('UNAUTHORIZED · 无 session', async () => {
    authMock.mockResolvedValue(null)
    const r = await regeneratePlanAction('idea1', 'zh-CN', 'zhuge')
    expect(r).toEqual({ ok: false, error: 'UNAUTHORIZED' })
    expect(consumeTokenMock).not.toHaveBeenCalled()
  })

  it('RATE_LIMITED · consumeToken 抛 RateLimitError', async () => {
    authMock.mockResolvedValue(okSession())
    consumeTokenMock.mockRejectedValue(new RateLimitError(60))
    const r = await regeneratePlanAction('idea1', 'zh-CN', 'zhuge')
    expect(r).toEqual({ ok: false, error: 'RATE_LIMITED' })
    expect(findFirstMock).not.toHaveBeenCalled()
  })

  it('NOT_FOUND · idea 不存在', async () => {
    authMock.mockResolvedValue(okSession())
    consumeTokenMock.mockResolvedValue(undefined)
    findFirstMock.mockResolvedValue(null)
    const r = await regeneratePlanAction('missing', 'zh-CN', 'zhuge')
    expect(r).toEqual({ ok: false, error: 'NOT_FOUND' })
  })

  it('NO_EXISTING_PLAN · idea 存在但无 plan', async () => {
    authMock.mockResolvedValue(okSession())
    consumeTokenMock.mockResolvedValue(undefined)
    findFirstMock.mockResolvedValue(okIdea({ plan: null }))
    const r = await regeneratePlanAction('idea1', 'zh-CN', 'zhuge')
    expect(r).toEqual({ ok: false, error: 'NO_EXISTING_PLAN' })
  })

  it('PROVIDER_UNAVAILABLE · resolveProvider 抛', async () => {
    authMock.mockResolvedValue(okSession())
    consumeTokenMock.mockResolvedValue(undefined)
    findFirstMock.mockResolvedValue(okIdea())
    resolveProviderMock.mockRejectedValue(new Error('no-key'))
    const r = await regeneratePlanAction('idea1', 'zh-CN', 'zhuge')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/^PROVIDER_UNAVAILABLE:/)
  })

  it('QUOTA_EXCEEDED · demo 路径 · consumeDemoQuota 抛', async () => {
    authMock.mockResolvedValue(okSession())
    consumeTokenMock.mockResolvedValue(undefined)
    findFirstMock.mockResolvedValue(okIdea())
    resolveProviderMock.mockResolvedValue({ source: 'demo', model: 'x', maxOutputTokens: 1024 })
    consumeDemoQuotaMock.mockRejectedValue(new QuotaExceededError(1))
    const r = await regeneratePlanAction('idea1', 'zh-CN', 'zhuge')
    expect(r).toEqual({ ok: false, error: 'QUOTA_EXCEEDED' })
    expect(generatePlanMock).not.toHaveBeenCalled()
  })

  it('AI_GENERATION_FAILED · generatePlan 抛', async () => {
    authMock.mockResolvedValue(okSession())
    consumeTokenMock.mockResolvedValue(undefined)
    findFirstMock.mockResolvedValue(okIdea())
    resolveProviderMock.mockResolvedValue({ source: 'byok', model: 'x', maxOutputTokens: 1024 })
    generatePlanMock.mockRejectedValue(new Error('ai-down'))
    const r = await regeneratePlanAction('idea1', 'zh-CN', 'zhuge')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/^AI_GENERATION_FAILED:/)
  })

  it('PERSIST_FAILED · 事务抛', async () => {
    authMock.mockResolvedValue(okSession())
    consumeTokenMock.mockResolvedValue(undefined)
    findFirstMock.mockResolvedValue(okIdea())
    resolveProviderMock.mockResolvedValue({ source: 'byok', model: 'x', maxOutputTokens: 1024 })
    generatePlanMock.mockResolvedValue(okDraft)
    transactionMock.mockRejectedValueOnce(new Error('db-down'))
    const r = await regeneratePlanAction('idea1', 'zh-CN', 'zhuge')
    expect(r).toEqual({ ok: false, error: 'PERSIST_FAILED' })
  })

  it('success · cascade delete 旧 plan + create 新 · revalidate · persona 透传', async () => {
    authMock.mockResolvedValue(okSession())
    consumeTokenMock.mockResolvedValue(undefined)
    findFirstMock.mockResolvedValue(okIdea())
    resolveProviderMock.mockResolvedValue({ source: 'byok', model: 'x', maxOutputTokens: 1024 })
    generatePlanMock.mockResolvedValue(okDraft)
    const r = await regeneratePlanAction('idea1', 'zh-CN', 'zhuge')
    expect(r).toEqual({ ok: true })
    // 旧 plan 被级联删
    expect(txPlanDeleteMock).toHaveBeenCalledWith({ where: { id: 'plan-old' } })
    // 新 plan 带 persona
    expect(txPlanCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ generatedByPersonaId: 'zhuge', goal: 'G' }),
      }),
    )
    // 新 milestone + task 也落库
    expect(txMilestoneCreateMock).toHaveBeenCalledTimes(1)
    expect(txTaskCreateMock).toHaveBeenCalledTimes(1)
    // 刷新页面
    expect(revalidatePathMock).toHaveBeenCalledWith('/zh-CN/plan/idea1')
    // generatePlan 收到了 locale + persona
    expect(generatePlanMock).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'zh-CN', personaId: 'zhuge' }),
    )
  })

  it('success · 无效 personaHint 降级为 auto', async () => {
    authMock.mockResolvedValue(okSession())
    consumeTokenMock.mockResolvedValue(undefined)
    findFirstMock.mockResolvedValue(okIdea())
    resolveProviderMock.mockResolvedValue({ source: 'byok', model: 'x', maxOutputTokens: 1024 })
    generatePlanMock.mockResolvedValue(okDraft)
    const r = await regeneratePlanAction('idea1', 'zh-CN', 'not-a-persona')
    expect(r).toEqual({ ok: true })
    expect(generatePlanMock).toHaveBeenCalledWith(expect.objectContaining({ personaId: 'auto' }))
    expect(txPlanCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ generatedByPersonaId: 'auto' }),
      }),
    )
  })
})
