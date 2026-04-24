import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { ApiKeysManager } from '@/components/features/settings/ApiKeysManager'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

describe('ApiKeysManager UX', () => {
  test('prefills recommended OpenAI base URL and model', () => {
    render(<ApiKeysManager initial={[]} />)

    expect(screen.getByDisplayValue('https://api.openai.com/v1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('gpt-4o-mini')).toBeInTheDocument()
    expect(screen.getByText('已为你填入推荐地址，可按需替换。')).toBeInTheDocument()
  })

  test('shows field-level validation for custom compatible provider', async () => {
    const user = userEvent.setup()
    render(<ApiKeysManager initial={[]} />)

    await user.click(screen.getByRole('button', { name: /自定义/ }))
    await user.clear(screen.getByDisplayValue('gpt-4o-mini'))
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(screen.getByText('请先填入 API Key')).toBeInTheDocument()
    expect(screen.getByText('请选择或输入模型名')).toBeInTheDocument()
    expect(screen.getByText('自定义兼容服务需要 Base URL')).toBeInTheDocument()
  })

  test('promotes save action after connectivity test succeeds', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<ApiKeysManager initial={[]} />)

    await user.type(screen.getByPlaceholderText('sk-...'), 'sk-test')
    await user.click(screen.getByRole('button', { name: '测试连通' }))

    expect(await screen.findByText('✓ 已连通')).toBeInTheDocument()
    expect(screen.getByText('连通成功，可以直接保存并设为默认。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存并设为默认' })).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
