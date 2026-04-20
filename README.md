<div align="center">

<img src="./docs/og-banner.png" alt="Nous · Turn thoughts into action" width="860" />

<br />

### 让想法，落地 · Turn thoughts into action, the INTP way

专为「想得多、做得少」的深度思考者设计的 AI 执行力工具。

[![MIT License](https://img.shields.io/badge/License-MIT-1C1B19?style=for-the-badge&labelColor=FAF7EF&color=1C1B19)](./LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](./docs/SELF_HOSTING.md)
[![BYOK](https://img.shields.io/badge/BYOK-OpenAI%20·%20Claude%20·%20DeepSeek%20·%20Kimi-B8372F?style=for-the-badge)](./docs/AI_PROVIDERS.md)

[中文](#) · [English](#english) · [自托管](docs/SELF_HOSTING.md) · [AI 配置](docs/AI_PROVIDERS.md)

</div>

---

## 这是什么

**Nous**（/nuːs/，古希腊语「纯粹智性」）不是另一个待办清单——
它是一个**「思维 → 行动」的 AI 翻译器**，
用苏格拉底式追问把模糊的想法变成今晚就能动手的第一步。

<div align="center">
  <img src="./docs/flow.svg" alt="捕获 → 对话 → 规划 → 执行 → 复盘" width="100%" />
</div>

<table align="center">
  <thead>
    <tr>
      <th align="center">1 · 捕获</th>
      <th align="center">2 · 对话</th>
      <th align="center">3 · 规划</th>
      <th align="center">4 · 执行</th>
      <th align="center">5 · 复盘</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><code>⌘K</code> 零摩擦</td>
      <td align="center">AI 苏格拉底</td>
      <td align="center">方案树 + 首步</td>
      <td align="center">番茄钟聚焦</td>
      <td align="center">周报 + 洞察</td>
    </tr>
    <tr>
      <td valign="top">想法不过夜，直接落入 Inbox。不用取名、分类、打标签。</td>
      <td valign="top">AI 按<em>意图 → 细节 → 边界</em>温和追问，一次一问，不连问不鸡汤。</td>
      <td valign="top">对话成果结构化为<em>目标 / 里程碑 / 任务树 / MoSCoW / 15 分钟内可启动的首步</em>。</td>
      <td valign="top">从任务树挑几件今天做的，番茄钟推进，卡住时 AI 给 3 个突破选项。</td>
      <td valign="top">周末一键生成：完成了什么、卡点共性、一句话洞察、下周聚焦。</td>
    </tr>
  </tbody>
</table>

---

## 设计语言 · Ink（墨）

界面借用宣纸、浓墨、朱砂三元素——**纸为空间，墨为思绪，印为决断**。

| 元素 | 色值 | 用途 |
|---|---|---|
| 宣纸白 `--paper-rice` | `#FAF7EF` | 背景 |
| 浓墨黑 `--ink-heavy` | `#1C1B19` | 主文本 |
| 朱砂红 `--cinnabar` | `#B8372F` | 印章、强调 |
| 青釉绿 `--celadon` | `#6B8E7A` | 成功 |
| 青石蓝 `--indigo-stone` | `#3E5871` | 链接 |
| 泥金 `--gold-leaf` | `#B8955A` | 高亮 |

支持亮色（宣纸）与暗色（深墨 `#1A1814`）主题，所有过渡遵循 `prefers-reduced-motion`。

---

## AI 策略

**混合模式**：新用户开箱即用（内置 Demo Key + 每日 20 次配额），进阶用户 BYOK 无限使用。

<table>
  <tr>
    <td><b>支持提供商</b></td>
    <td>
      OpenAI · Anthropic · DeepSeek · Kimi · 豆包 · GLM · 任意 OpenAI 兼容网关
    </td>
  </tr>
  <tr>
    <td><b>Key 加密</b></td>
    <td>AES-256-GCM 写入数据库前加密，主密钥只在服务器 env 中</td>
  </tr>
  <tr>
    <td><b>数据归属</b></td>
    <td>想法 / 对话 / 方案全部存你自己账号下，自托管即零外部依赖</td>
  </tr>
</table>

详见 [AI Providers 配置](docs/AI_PROVIDERS.md)。

---

## 自托管 · 5 分钟上线

```bash
git clone https://github.com/qiuxinyuan321/nous.git && cd nous
cp .env.example .env.prod && vim .env.prod
bash scripts/deploy.sh
```

脚本自动完成：预检 → 构建镜像 → 启动 **Postgres + Redis + App + Nginx** → 健康检查。

最低配置：2 核 2G ECS + Docker。详见 [自托管文档](docs/SELF_HOSTING.md)。

---

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 16 · App Router · React 19 |
| 样式 | Tailwind CSS v4 + shadcn/ui + **Framer Motion** |
| 数据库 | PostgreSQL 16 + Prisma 6 |
| 认证 | NextAuth.js v5（邮箱 / GitHub / Google / 密码） |
| AI | Vercel AI SDK · 多提供商统一接口 |
| 缓存 | Redis 7（配额 + 限流） |
| 国际化 | next-intl（zh-CN / en-US） |
| 部署 | Docker Compose + Nginx + Certbot |

---

## 开发

```bash
pnpm install
cp .env.example .env.local
pnpm docker:dev         # 本地 Postgres + Redis
pnpm prisma:migrate     # 初始化数据库
pnpm dev                # http://localhost:3000
```

```bash
pnpm typecheck          # 类型检查
pnpm lint               # ESLint
pnpm test               # Vitest 单元测试
pnpm test:e2e           # Playwright E2E
```

---

## 路线图

- [x] 想法捕获 + `⌘K`
- [x] AI 苏格拉底对话（流式 SSE）
- [x] 结构化规划生成（JSON Schema）
- [x] 番茄钟执行面板
- [x] 周复盘
- [x] BYOK + Demo Key 混合
- [x] 中英双语 UI + Prompt
- [x] Docker 一键部署 + Nginx + SSL
- [x] 水墨落地页 + Hero 主视觉
- [x] 语音捕获（Whisper）
- [x] PWA 离线
- [x] 想法图谱（关系可视化）
- [x] 长期记忆（AI 越用越懂你）
- [x] Obsidian / Notion 双向同步
- [x] 主题市场

---

## 参与贡献

欢迎 Issue 和 PR！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可

[MIT](LICENSE) © Nous contributors

---

<a name="english"></a>

<div align="center">

## Nous

**Turn thoughts into action · The INTP way**

*An AI-powered execution tool for deep thinkers who think too much and do too little.*

[中文](#) · [Self-hosting](docs/SELF_HOSTING.md) · [AI Providers](docs/AI_PROVIDERS.md)

</div>

### What is this

**Nous** (Greek for "pure intellect") is not another to-do list — it's a **thought-to-action translator** that uses Socratic questioning to turn vague ideas into actionable first steps you can start tonight.

| Stage | Action | Role |
|---|---|---|
| 1 · Capture | `⌘K`, drop a messy thought | Zero friction |
| 2 · Refine | AI asks one question at a time — intent → detail → boundary | Clarify |
| 3 · Plan | AI turns dialogue into goal → milestones → task tree → MoSCoW → **first 15-min step** | Structure |
| 4 · Focus | Pick today's few, run a pomodoro, click "I'm blocked" for 3 AI-suggested breakthroughs | Ship |
| 5 · Review | One-click weekly: what got done, where you stalled, one insight, next week's focus | Learn |

### AI Strategy

**Hybrid mode**: new users get instant access (built-in Demo Key, 20 calls/day). Power users BYOK for unlimited use. Supports OpenAI / Anthropic / DeepSeek / Kimi / Doubao / GLM / any OpenAI-compatible endpoint.

### Self-Hosting

```bash
git clone https://github.com/qiuxinyuan321/nous.git && cd nous
cp .env.example .env.prod && vim .env.prod
bash scripts/deploy.sh
```

Minimum: 2-core 2 GB server + Docker. See [Self-Hosting Guide](docs/SELF_HOSTING.md).

### Development

```bash
pnpm install && cp .env.example .env.local
pnpm docker:dev && pnpm prisma:migrate && pnpm dev
```

### License

[MIT](LICENSE) © Nous contributors
