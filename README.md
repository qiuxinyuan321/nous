<div align="center">

# Nous

### 让想法，落地

*Turn thoughts into action, the INTP way*

专为「想得多、做得少」的深度思考者设计的 AI 执行力工具。

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)](./docs/SELF_HOSTING.md)

[English](#english) · [部署文档](docs/SELF_HOSTING.md) · [AI 配置](docs/AI_PROVIDERS.md)

</div>

---

## 这是什么

**Nous**（/nuːs/，古希腊语「纯粹智性」）不是另一个待办清单——它是一个**「思维 → 行动」的 AI 翻译器**，用苏格拉底式追问把模糊的想法变成今晚就能动手的第一步。

```
捕获 ──→ 精炼 ──→ 规划 ──→ 执行 ──→ 复盘
 ⌘K      AI 追问   AI 生成   番茄钟    AI 洞察
零摩擦    ≤5 轮     里程碑树   聚焦     周报告
```

### 捕获 · Inbox

`⌘K` 全局快捷键，零摩擦记录闪念。

### 精炼 · Refine

AI 以苏格拉底方式追问（一次一问，温和不催促），自动推进 3 个阶段：
- **意图**：为什么要做？不做会怎样？
- **细节**：第一版长什么样？谁会用？
- **边界**：不做什么？最多投入多少？

### 规划 · Plan

AI 生成结构化方案：里程碑 → 任务树 → MoSCoW 优先级 → **15 分钟内可完成的第一步**。

### 执行 · Focus

今日 3 件事 + 番茄钟。卡住时点「我卡住了」，AI 给 3 个突破选项。

### 复盘 · Journal

周复盘：完成了什么、卡点共性、一句话洞察、下周聚焦。

---

## AI 策略

**混合模式**：新用户开箱即用（内置 Demo Key + 每日 20 次配额），进阶用户 BYOK 无限使用。

支持 OpenAI / DeepSeek / Kimi / 豆包 / Anthropic / 任意 OpenAI 兼容网关。

详见 [AI Providers 配置](docs/AI_PROVIDERS.md)。

---

## 设计语言 · Ink（墨）

Nous 的界面借用宣纸、浓墨、朱砂三元素——**纸为空间，墨为思绪，印为决断**。

| 元素 | 色值 | 用途 |
|---|---|---|
| 宣纸白 `--paper-rice` | `#FAF7EF` | 背景 |
| 浓墨黑 `--ink-heavy` | `#1C1B19` | 主文本 |
| 朱砂红 `--cinnabar` | `#B8372F` | 印章、强调 |
| 青釉绿 `--celadon` | `#6B8E7A` | 成功 |
| 泥金 `--gold-leaf` | `#B8955A` | 高亮 |

支持亮色（宣纸）与暗色（深墨 `#1A1814`）主题。

---

## 自托管 · 5 分钟上线

```bash
git clone https://github.com/<you>/nous.git && cd nous
cp .env.example .env.prod && vim .env.prod
bash scripts/deploy.sh
```

脚本自动完成：预检 → 构建镜像 → 启动 Postgres + Redis + App + Nginx → 健康检查。

最低配置：2 核 2G ECS + Docker。详见 [自托管文档](docs/SELF_HOSTING.md)。

---

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 15 · App Router · React 19 |
| 样式 | Tailwind CSS v4 + shadcn/ui + Framer Motion |
| 数据库 | PostgreSQL 16 + Prisma 6 |
| 认证 | NextAuth.js v5（邮箱 / GitHub / Google） |
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
```

---

## 路线图

- [x] 想法捕获 + ⌘K
- [x] AI 苏格拉底对话（流式 SSE）
- [x] 结构化规划生成（JSON Schema）
- [x] 番茄钟执行面板
- [x] 周复盘
- [x] BYOK + Demo Key 混合
- [x] 中英双语 UI + Prompt
- [x] Docker 一键部署 + Nginx + SSL
- [ ] 想法图谱（关系可视化）
- [ ] 语音捕获（Whisper）
- [ ] PWA 离线
- [ ] Obsidian / Notion 双向同步
- [ ] 长期记忆（AI 越用越懂你）
- [ ] 主题市场

---

## 参与贡献

欢迎 Issue 和 PR！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可

[MIT](LICENSE) © Nous contributors

---

<a name="english"></a>

<div align="center">

# Nous

### Turn thoughts into action

*The INTP way*

An AI-powered execution tool for deep thinkers who think too much and do too little.

[中文](#) · [Self-hosting](docs/SELF_HOSTING.md) · [AI Providers](docs/AI_PROVIDERS.md)

</div>

---

## What is this

**Nous** (Greek for "pure intellect") is not another to-do list — it's a **thought-to-action translator** that uses Socratic questioning to turn vague ideas into actionable first steps you can start tonight.

```
Capture ──→ Refine ──→ Plan ──→ Focus ──→ Review
  ⌘K       AI asks    AI generates  Pomodoro   AI insights
zero       ≤5 rounds  milestone     timer      weekly
friction               tree                    report
```

- **Capture**: `⌘K` global shortcut. Zero-friction idea capture.
- **Refine**: AI asks one question at a time (gentle, never pushy) through Intent → Detail → Boundary phases.
- **Plan**: AI generates milestones → task tree → MoSCoW priorities → **a first action completable in 15 minutes**.
- **Focus**: Today's top 3 tasks + Pomodoro timer. Stuck? Click "I'm blocked" for AI-suggested breakthroughs.
- **Journal**: Weekly review with completion stats, stuck patterns, one insight, next week's focus.

## AI Strategy

**Hybrid mode**: New users get instant access (built-in Demo Key, 20 calls/day). Power users BYOK for unlimited use.

Supports OpenAI / DeepSeek / Kimi / Doubao / Anthropic / any OpenAI-compatible gateway.

## Self-Hosting

```bash
git clone https://github.com/<you>/nous.git && cd nous
cp .env.example .env.prod && vim .env.prod
bash scripts/deploy.sh
```

Minimum: 2-core 2GB server + Docker. See [Self-Hosting Guide](docs/SELF_HOSTING.md).

## Development

```bash
pnpm install && cp .env.example .env.local
pnpm docker:dev && pnpm prisma:migrate && pnpm dev
```

## License

[MIT](LICENSE) © Nous contributors
