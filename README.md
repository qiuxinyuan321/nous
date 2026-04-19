<div align="center">

# Nous

**让想法，落地。** · _Turn thoughts into action, the INTP way._

专为「想得多、做得少」的深度思考者设计的 AI 执行力工具。

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## ✨ 这是什么

Nous 是一个开源的 Web 应用，把一段潦草的想法在 **20 分钟内**变成今晚就能动手的第一步：

1. **⌘K 捕获** · 零摩擦记录原始想法
2. **苏格拉底对话** · AI 温和追问，帮你把意图、边界理清楚
3. **一键规划** · 生成可视化里程碑与任务树（含优先级、时间、首要行动）
4. **番茄钟执行** · 阻塞时一键求助 AI
5. **周期复盘** · 自动总结你的执行模式

### 为什么叫 Nous

Nous（/nuːs/）来自古希腊语，意为「纯粹智性 / 直观之思」，对应东方的「思」字。界面采用**禅意纸墨风格**——宣纸、浓墨、朱砂，留白为意境，印章为决断。

---

## 🚀 快速开始

```bash
pnpm install
cp .env.example .env.local
pnpm docker:dev       # 启动本地 Postgres + Redis
pnpm prisma:migrate   # 初始化数据库
pnpm dev
```

访问 <http://localhost:3000>。

详细自托管指南见 [docs/SELF_HOSTING.md](./docs/SELF_HOSTING.md)（WIP）。

---

## 🤖 AI 提供商

Nous 采用**混合模式**：

- **新用户开箱即用** · 内置 Demo Key（OpenAI 兼容，默认每日 20 次）
- **进阶 BYOK** · 在设置里配置自己的 OpenAI / Anthropic / DeepSeek / Kimi / 豆包 / 自建中转

详见 [docs/AI_PROVIDERS.md](./docs/AI_PROVIDERS.md)（WIP）。

---

## 🛠️ 技术栈

- **前端**：Next.js 16 · React 19 · Tailwind CSS 4 · shadcn/ui · Framer Motion
- **后端**：Next.js API Routes · Prisma · PostgreSQL · Redis
- **认证**：NextAuth.js v5（邮箱 / GitHub / Google）
- **AI**：Vercel AI SDK（OpenAI 兼容 + Anthropic）
- **国际化**：next-intl（zh-CN / en-US 开箱）
- **测试**：Vitest · Playwright
- **部署**：Docker Compose · Nginx · Let's Encrypt

---

## 🗺️ Roadmap

- [x] v0.1 MVP · 捕获 / 对话 / 规划 / 执行 / 复盘（开发中）
- [ ] v0.2 · 想法图谱 · 语音捕获 · PWA
- [ ] v0.3 · Obsidian / Notion 同步
- [ ] v1.0 · 长期记忆 · 主题市场

---

## 📄 License

MIT © Nous contributors

[中文](./README.md) · [English](./README_EN.md)（WIP）
