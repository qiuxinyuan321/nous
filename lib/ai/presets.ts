/**
 * 提供商预设 —— 前端选择器 + BYOK 表单的快捷填充数据
 * 这里只放元信息,真实请求路由在 lib/ai/providers.ts
 */

export interface ProviderPreset {
  id: string
  label: string
  description: string
  defaultBaseUrl?: string
  defaultModel: string
  modelOptions: string[]
  kind: 'openai-compatible' | 'anthropic'
  /** 官网链接,引导用户去拿 Key */
  getKeyUrl: string
  /** Key 大致长什么样(提示) */
  keyPrefix?: string
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    description: '官方 GPT 系列',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    modelOptions: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1', 'o4-mini'],
    kind: 'openai-compatible',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    keyPrefix: 'sk-',
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    description: 'Claude 家族',
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-6',
    modelOptions: [
      'claude-opus-4-7',
      'claude-sonnet-4-6',
      'claude-haiku-4-5-20251001',
      'claude-3-5-sonnet-latest',
    ],
    kind: 'anthropic',
    getKeyUrl: 'https://console.anthropic.com/settings/keys',
    keyPrefix: 'sk-ant-',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    description: '深度求索,性价比高',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    modelOptions: ['deepseek-chat', 'deepseek-reasoner'],
    kind: 'openai-compatible',
    getKeyUrl: 'https://platform.deepseek.com/api_keys',
    keyPrefix: 'sk-',
  },
  {
    id: 'kimi',
    label: 'Kimi',
    description: '月之暗面,长上下文',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    modelOptions: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    kind: 'openai-compatible',
    getKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
    keyPrefix: 'sk-',
  },
  {
    id: 'doubao',
    label: '豆包',
    description: '字节火山方舟',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'doubao-seed-1-6-250615',
    modelOptions: ['doubao-seed-1-6-250615', 'doubao-1-5-pro-32k-250115'],
    kind: 'openai-compatible',
    getKeyUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
    keyPrefix: '',
  },
  {
    id: 'openai-compatible',
    label: '自定义 (OpenAI 兼容)',
    description: '浮生云算、OneAPI、NewAPI 等中转',
    defaultBaseUrl: '',
    defaultModel: 'gpt-4o-mini',
    modelOptions: [],
    kind: 'openai-compatible',
    getKeyUrl: '',
    keyPrefix: '',
  },
]

export function findPreset(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.id === id)
}
