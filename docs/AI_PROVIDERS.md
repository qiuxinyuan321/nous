# AI Providers 配置

Nous 混合了 **内置 Demo Key** 和 **用户 BYOK (Bring Your Own Key)** 两种 AI 来源。

```
用户发起 AI 请求
      │
      ▼
┌───────────────────────────┐
│ 用户是否有 BYOK default?   │
└───────────────────────────┘
  是│                    │否
  ▼                       ▼
走用户自己的 Key   查今日额度
(无额度限制)           │
                   ┌────┴─────┐
                   │ 够       │ 用尽
                   ▼           ▼
             走 Demo Key    引导用户配 BYOK
             (记 DemoUsage)
```

## 运维侧:Demo Key

在 `.env.prod` 里配置,给所有新用户开箱体验用。

### 官方 OpenAI

```bash
DEMO_BASE_URL=https://api.openai.com/v1
DEMO_API_KEY=sk-xxx
DEMO_MODEL=gpt-4o-mini
DEMO_DAILY_LIMIT=20
DEMO_MAX_TOKENS=2000
```

### 浮生云算(国内 OpenAI 中转)

```bash
DEMO_BASE_URL=https://fushengyunsuan.cn/v1
DEMO_API_KEY=sk-xxx
DEMO_MODEL=gpt-4o-mini
```

> ⚠️ **已知坑**:部分 reasoning 模型(如 gpt-5.4)在非流式模式下 `content` 字段返回 `null`,但流式模式下 `delta.content` 正常。Nous 的规划和周复盘生成都用 `stream: true` 自拼接 delta 规避了这个问题。

### DeepSeek

```bash
DEMO_BASE_URL=https://api.deepseek.com/v1
DEMO_API_KEY=sk-xxx
DEMO_MODEL=deepseek-chat
```

### Kimi(月之暗面)

```bash
DEMO_BASE_URL=https://api.moonshot.cn/v1
DEMO_API_KEY=sk-xxx
DEMO_MODEL=moonshot-v1-8k
```

### 豆包(字节火山方舟)

```bash
DEMO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DEMO_API_KEY=<volc-api-key>
DEMO_MODEL=doubao-seed-1-6-250615
```

### OneAPI / NewAPI 聚合

```bash
DEMO_BASE_URL=https://<your-oneapi>/v1
DEMO_API_KEY=sk-xxx
DEMO_MODEL=<上游模型名>
```

---

## 用户侧:BYOK 配置

登录后进 `/settings/api-keys`,选一个提供商,贴 Key,点「测试连通」→「保存」。勾选「设为默认」后所有 AI 调用走自己的 Key,不消耗 Demo 额度。

### 支持的提供商

| 提供商 | 类型 | 默认 Base URL |
|---|---|---|
| OpenAI | openai-compatible | `https://api.openai.com/v1` |
| Anthropic | anthropic(走 /v1/messages) | `https://api.anthropic.com` |
| DeepSeek | openai-compatible | `https://api.deepseek.com/v1` |
| Kimi | openai-compatible | `https://api.moonshot.cn/v1` |
| 豆包 | openai-compatible | `https://ark.cn-beijing.volces.com/api/v3` |
| 自定义 | openai-compatible | 自填 |

### 安全

- Key 以 **AES-256-GCM** 加密存储(详见 [lib/crypto.ts](../lib/crypto.ts))
- 主密钥只在服务器环境变量 `CRYPTO_KEY` 里,数据库里看不到明文
- 传输走 HTTPS

---

## 自建 OneAPI 托管

如果你想给团队/社区部署,推荐搭个 OneAPI 在前面做聚合,这样:

- Demo Key 只填 OneAPI 一个 URL
- 可以在 OneAPI 里挂多家上游,故障自动切换
- 统一扣费和审计

```bash
# 参考 OneAPI 官方部署
docker run -d --name one-api \
  -p 3001:3000 \
  -v $(pwd)/oneapi:/data \
  justsong/one-api
```

拿到 OneAPI 的令牌填进 Nous 的 `DEMO_API_KEY`,`DEMO_BASE_URL` 填 `http://<your-server>:3001/v1`。

---

## 限流与配额

Nous 内置两层限流(`lib/ai/ratelimit.ts` + `lib/ai/quota.ts`):

| 限制 | 窗口 | 上限 | 作用 |
|---|---|---|---|
| IP + userId 令牌桶(chat) | 60s | 20 | 防快速轰炸 |
| userId 令牌桶(journal) | 300s | 3 | 周复盘不需要高频 |
| Demo 每日配额 | 按 UTC 日 | `DEMO_DAILY_LIMIT`(默认 20) | Demo Key 滥用防护 |

调整限额不需要改代码,改环境变量即可(配额)或改 `lib/ai/ratelimit.ts` 的调用参数(限流)。
