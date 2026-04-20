<div align="center">

<img src="./docs/og-banner.png" alt="Nous · Turn thoughts into action" width="100%" />

<br />

<h3>让想法，落地</h3>
<h4>Turn thoughts into action, the INTP way</h4>

<p>
  <em>AI-powered thought-to-action translator for deep thinkers who think too much and do too little.</em>
</p>

<p>
  <a href="#nous-快速开始"><img alt="Quickstart" src="https://img.shields.io/badge/▶_Quickstart-1C1B19?style=for-the-badge&labelColor=FAF7EF"></a>
  <a href="./docs/SELF_HOSTING.md"><img alt="Self Hosting" src="https://img.shields.io/badge/Self_Host-B8372F?style=for-the-badge&logo=docker&logoColor=white"></a>
  <a href="./docs/AI_PROVIDERS.md"><img alt="AI Providers" src="https://img.shields.io/badge/BYOK-6B8E7A?style=for-the-badge"></a>
  <a href="./LICENSE"><img alt="MIT" src="https://img.shields.io/badge/License-MIT-1C1B19?style=for-the-badge&labelColor=FAF7EF"></a>
</p>

<p>
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000">
  <img alt="TypeScript 5" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Prisma 6" src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white">
  <img alt="PostgreSQL 16" src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white">
  <img alt="Redis 7" src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white">
  <img alt="Tailwind v4" src="https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white">
  <img alt="Framer Motion" src="https://img.shields.io/badge/Framer-Motion-0055FF?logo=framer&logoColor=white">
  <img alt="Playwright" src="https://img.shields.io/badge/Playwright-e2e-45ba4b?logo=playwright&logoColor=white">
</p>

<sub>
  <a href="#nous-核心特性">核心特性</a> ·
  <a href="#nous-功能一览">功能一览</a> ·
  <a href="#nous-架构">架构</a> ·
  <a href="#nous-技术栈">技术栈</a> ·
  <a href="#nous-快速开始">快速开始</a> ·
  <a href="#nous-路线图">路线图</a> ·
  <a href="#english">English</a>
</sub>

</div>

---

<h2 id="nous-核心特性">这是什么</h2>

**Nous**（/nuːs/，古希腊语「纯粹智性」）不是另一个待办清单——
它是一个**「思维 → 行动」的 AI 翻译器**，
用苏格拉底式追问把模糊的想法变成今晚就能动手的第一步。

<table>
  <tr>
    <td width="48%" valign="top">
      <h4>🎯 给深度思考者</h4>
      <p>INTP 不缺想法，缺的是把想法挤出第一步的摩擦系数。Nous 的每一处交互都是为深度思考者设计：一次只问一个、讨厌鸡汤、需要被理性说服。</p>
    </td>
    <td width="52%" valign="top">
      <h4>🎨 水墨 Ink 设计语言</h4>
      <p>宣纸白底 · 浓墨主字 · 朱砂印落决断 · 青釉与泥金点缀——整个界面是一幅会呼吸的水墨卷。拒绝 SaaS 千篇一律的 UI 流水线。</p>
    </td>
  </tr>
  <tr>
    <td valign="top">
      <h4>🔑 BYOK + Demo 混合</h4>
      <p>新用户开箱即用（内置 Demo Key，20 次/日），进阶用户带自己的 API Key 无限使用。AES-256-GCM 加密存储，主密钥只在服务器环境变量里。</p>
    </td>
    <td valign="top">
      <h4>📦 5 分钟自托管</h4>
      <p>一份 docker-compose，一个 .env.prod，你的 ECS、你的域名、你的 Key，<strong>零外部依赖</strong>。MIT 协议，永久免费，可商用。</p>
    </td>
  </tr>
</table>

<div align="center">
  <img src="./docs/flow.svg" alt="捕获 → 对话 → 规划 → 执行 → 复盘" width="100%" />
</div>

---

<h2 id="nous-功能一览">功能一览</h2>

<table>
<tr>
<td width="50%" valign="top">

### 1 · ⌘K 零摩擦捕获

<img src="./docs/screens/capture.svg" alt="⌘K CommandPalette" width="100%" />

全局 **`⌘K`** 唤起，水墨晕染入场的捕获面板。按 **Enter** 落笔，按麦克风说话（Whisper 自动转写）。

**不用取名、不用分类、不用打标签**。想法先进仓库，再决定要不要深究。

</td>
<td width="50%" valign="top">

### 2 · 苏格拉底式对话

<img src="./docs/screens/refine.svg" alt="Socratic Dialogue" width="100%" />

AI 按 **意图 → 细节 → 边界 → 就绪** 四阶段温和追问，**一次只问一个**，检测到分析瘫痪时直接给 2–3 个选项让你挑。

基于长期记忆自动调整提问角度——越用越懂你。

</td>
</tr>
<tr>
<td valign="top">

### 3 · 结构化规划

<img src="./docs/screens/plan.svg" alt="Plan Tree" width="100%" />

AI 用 JSON Schema 把对话结果生成 **目标 → 里程碑 → 任务树 → MoSCoW 优先级 → 15 分钟内可启动的第一步**。

每条任务带 `must/should/could/wont` 色标，番茄钟一按即开工。

</td>
<td valign="top">

### 4 · 想法图谱

<img src="./docs/screens/graph.svg" alt="Idea Graph" width="100%" />

力导向 bipartite 图谱：**Idea 按 status 着色 + Tag 作朱砂中枢印章**。

拖动节点、滚轮缩放、点击高亮邻居——让你看到思维中的隐性联系。

</td>
</tr>
<tr>
<td valign="top">

### 5 · 长期记忆

<blockquote>
  <b>AI 越用越懂你</b>。对话结束时后台抽取<em>稳定事实</em>(偏好/习惯/目标/盲点)写入画像；下轮对话前用余弦相似度检索 top-K 注入 system prompt。
</blockquote>

- 🪶 **fail-soft** embedding：API 不可用时降级 importance 排序
- 👀 **完全透明**：`/memory` 页面可查看、编辑、删除每一条
- 🔐 本地画像只存你自己账号下，永不共享

</td>
<td valign="top">

### 6 · 主题市场

<img src="./docs/screens/themes.svg" alt="Theme Market" width="100%" />

5 款内置主题：**宣纸 / 深墨 / 青瓷 / 朱金 / 烟竹**。

CSS 变量动态切换，inline script 防 FOUC，跨设备通过 UserSettings 同步。自定义主题上传在路上。

</td>
</tr>
</table>

### 其他能力

- 🎙 **语音捕获**（Whisper）· 按住麦克风说话，自动入 Inbox
- 📱 **PWA 离线** · 安装到桌面/手机，离线也能读已打开过的页面
- 🔄 **Obsidian 双向同步** · zip 导出（frontmatter + plan + 对话）· `.md` 导入去重
- 📝 **Notion push** · 绑定 Integration Token 一键推送 Idea → Notion Database
- 🈂 **中英双语** · UI + Prompt + Whisper · next-intl 路由前缀模式
- 📅 **周复盘** · 完成率 · 卡点共性 · 一句话洞察 · 下周聚焦

---

<h2 id="nous-架构">架构</h2>

<div align="center">
  <img src="./docs/architecture.svg" alt="Nous Architecture" width="100%" />
</div>

**五层设计**：Client（PWA）→ Edge（中间件 + Nginx）→ App（API Routes + Auth + BYOK）→ AI/Integrations（Socratic/Planner/Memory/Whisper/Sync）→ Data（Postgres + Redis + 外部模型）。

详细模块职责、数据流、部署拓扑见 [**ARCHITECTURE.md**](./ARCHITECTURE.md)。

---

<h2 id="nous-技术栈">技术栈</h2>

<table>
<tr><th>层</th><th>选型</th><th>理由</th></tr>
<tr>
  <td><b>框架</b></td>
  <td>Next.js 16 · App Router · React 19</td>
  <td>Server Component 做数据编排，Client Component 处理动画</td>
</tr>
<tr>
  <td><b>样式</b></td>
  <td>Tailwind v4 + Framer Motion 12</td>
  <td>CSS 变量驱动主题切换，motion.* 动画独立抽离</td>
</tr>
<tr>
  <td><b>数据库</b></td>
  <td>PostgreSQL 16 + Prisma 6</td>
  <td>migration 驱动的 schema 演进,JSON 字段存 embedding</td>
</tr>
<tr>
  <td><b>认证</b></td>
  <td>NextAuth.js v5</td>
  <td>Email Magic Link / GitHub / Google / 密码 四种入口</td>
</tr>
<tr>
  <td><b>AI</b></td>
  <td>Vercel AI SDK · <code>streamText</code> + <code>generateObject</code></td>
  <td>Provider-agnostic（OpenAI / Anthropic / 任何兼容网关）</td>
</tr>
<tr>
  <td><b>缓存</b></td>
  <td>Redis 7 · ioredis</td>
  <td>配额原子计数 · token bucket 限流</td>
</tr>
<tr>
  <td><b>图可视化</b></td>
  <td>d3-force + 原生 SVG</td>
  <td>只装力引擎(~18KB)，drag/zoom 手写保证水墨美学</td>
</tr>
<tr>
  <td><b>国际化</b></td>
  <td>next-intl · localePrefix: always</td>
  <td>zh-CN / en-US，URL 即语种，SEO 友好</td>
</tr>
<tr>
  <td><b>同步</b></td>
  <td>jszip · @notionhq/client</td>
  <td>Obsidian zip 导出/YAML 导入 · Notion page.create</td>
</tr>
<tr>
  <td><b>部署</b></td>
  <td>Docker Compose · Nginx · Certbot · standalone output</td>
  <td>2C2G ECS 即可跑全栈,5 分钟上线</td>
</tr>
</table>

---

<h2 id="nous-快速开始">快速开始</h2>

### 💻 本地开发

```bash
git clone https://github.com/qiuxinyuan321/nous.git && cd nous
pnpm install
cp .env.example .env.local         # 填 DATABASE_URL / NEXTAUTH_SECRET / CRYPTO_KEY / DEMO_API_KEY
pnpm docker:dev                    # 启动本地 Postgres + Redis
pnpm prisma:migrate                # 应用 migrations
pnpm dev                           # http://localhost:3000
```

开发脚本：

```bash
pnpm typecheck         # 类型检查
pnpm lint              # ESLint
pnpm test              # Vitest 单元测试
pnpm test:e2e          # Playwright e2e
pnpm format            # Prettier
```

### 🚢 5 分钟自托管

```bash
git clone https://github.com/qiuxinyuan321/nous.git && cd nous
cp .env.example .env.prod && vim .env.prod
bash scripts/deploy.sh
```

脚本自动完成：**预检 → 构建镜像 → 启动 Postgres + Redis + App + Nginx → 健康检查**。最低配置 2C2G。

详见 [**自托管文档**](./docs/SELF_HOSTING.md) · [**AI Providers 配置**](./docs/AI_PROVIDERS.md)。

---

<h2 id="nous-设计语言">设计语言 · Ink（墨）</h2>

界面借用宣纸、浓墨、朱砂三元素——**纸为空间，墨为思绪，印为决断**。

| 元素 | 色值 | 用途 |
|---|---|---|
| 宣纸白 `--paper-rice` | `#FAF7EF` | 背景 |
| 陈纸黄 `--paper-aged` | `#F2EBD8` | 容器 |
| 浓墨黑 `--ink-heavy` | `#1C1B19` | 主文本 |
| 中墨 `--ink-medium` | `#4A4842` | 次要文本 |
| 浅墨 `--ink-light` | `#8B8880` | 辅助文本 |
| 朱砂红 `--cinnabar` | `#B8372F` | 印章 · 强调 |
| 青釉绿 `--celadon` | `#6B8E7A` | 完成 · 成功 |
| 青石蓝 `--indigo-stone` | `#3E5871` | 链接 · 进行中 |
| 泥金 `--gold-leaf` | `#B8955A` | 高亮 · 已规划 |

**5 款内置主题**可在 `/themes` 页面切换。所有 motion 遵循 `prefers-reduced-motion`。

---

<h2 id="nous-路线图">路线图</h2>

<table>
<tr>
<td width="50%" valign="top">

#### ✅ 已完成

- [x] 想法捕获 + ⌘K 命令面板
- [x] 苏格拉底对话（流式 SSE）
- [x] 结构化规划（JSON Schema）
- [x] 番茄钟执行面板 + 今日聚焦
- [x] 周复盘
- [x] BYOK + Demo Key 混合
- [x] 中英双语 UI + Prompt
- [x] Docker 一键部署 + Nginx + SSL
- [x] 水墨落地页 + Hero 主视觉
- [x] 语音捕获（Whisper）
- [x] PWA 离线
- [x] 想法图谱（力导向关系可视化）
- [x] 长期记忆（AI 越用越懂你）
- [x] Obsidian / Notion 同步（单向）
- [x] 主题市场（5 款内置）

</td>
<td width="50%" valign="top">

#### 🚧 演进中

- [ ] Obsidian 双向实时同步（桌面代理）
- [ ] Notion 反向 pull（polling worker）
- [ ] 自定义主题上传 · 社区主题库
- [ ] 想法图谱语义边（非 tag 桥）
- [ ] 长期记忆衰减与合并策略
- [ ] 多设备实时协作（CRDT）
- [ ] 情绪快照（对话时的心态标签）
- [ ] 个人年度总结报告
- [ ] 移动端原生 App（Capacitor / RN）
- [ ] 浏览器插件：任意网页选中 → ⌘K 入 Inbox

</td>
</tr>
</table>

---

<h2 id="nous-参与">参与贡献</h2>

**欢迎所有形式的贡献**：issue、PR、设计稿、翻译、文档修订都很感激。

- 🐛 发现 bug → [提 issue](https://github.com/qiuxinyuan321/nous/issues/new/choose)
- 💡 有想法 → [Discussions](https://github.com/qiuxinyuan321/nous/discussions)
- 🛠 想动手 → 阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)
- 🛡 发现安全问题 → 见 [SECURITY.md](./.github/SECURITY.md)

提交信息规范：conventional commits（`feat:` / `fix:` / `docs:` / `chore:` / `refactor:`）。

---

<h2 id="nous-许可">许可与致谢</h2>

[**MIT**](./LICENSE) · © Nous contributors · 可商用,无需署名(但很欢迎你告诉我们)

**致谢**：
- **Vercel AI SDK** · 统一的 Provider 抽象
- **Prisma** · 让 TypeScript 与 SQL 和解
- **shadcn/ui** · 基础组件哲学借鉴
- **Noto Serif SC** / **Fraunces** / **JetBrains Mono** · 字体支持
- **Google Gemini** (Nano Banana Pro) · Hero / OG 主视觉生成
- 每一位深夜还在想「我到底要不要动手」的 INTP

---

<a name="english"></a>

<div align="center">

## Nous

<em>Turn thoughts into action, the INTP way.</em>

An AI-powered thought-to-action translator for deep thinkers who think too much and do too little.

</div>

### What is this

**Nous** (Greek for *"pure intellect"*) is not another to-do list — it's a **thought-to-action translator** that uses Socratic questioning to turn vague ideas into actionable first steps you can start tonight.

| Stage | Action | Role |
|---|---|---|
| 1 · Capture | `⌘K`, drop a messy thought — voice or text | Zero friction |
| 2 · Refine | AI asks one question at a time: intent → detail → boundary → ready | Clarify |
| 3 · Plan | AI turns dialogue into goal → milestones → task tree → MoSCoW → **first 15-min step** | Structure |
| 4 · Focus | Pick today's few, run a pomodoro, click "I'm blocked" for 3 AI-suggested breakthroughs | Ship |
| 5 · Review | One-click weekly: what got done, where you stalled, one insight, next week's focus | Learn |

### Highlights

- **BYOK** · OpenAI / Anthropic / DeepSeek / Kimi / Doubao / any OpenAI-compatible gateway
- **Long-term memory** · fail-soft embeddings, auto-extracted stable facts, fully user-editable
- **Idea graph** · force-directed bipartite layout, ink-wash aesthetic
- **Obsidian / Notion sync** · zip export with YAML frontmatter · Notion Integration push
- **Self-hosted** · Docker Compose + Nginx + Certbot, 2C2G enough, zero external deps
- **Ink design system** · 5 built-in themes, CSS-variable driven, dark + light

### Quickstart

```bash
git clone https://github.com/qiuxinyuan321/nous.git && cd nous
pnpm install && cp .env.example .env.local
pnpm docker:dev && pnpm prisma:migrate && pnpm dev
```

Self-hosting: see [Self-Hosting Guide](./docs/SELF_HOSTING.md) · AI: see [AI Providers](./docs/AI_PROVIDERS.md).

### License

[MIT](./LICENSE) © Nous contributors · commercial-friendly.

---

<div align="center">
  <sub>Built with ink, paper, and a quiet stubbornness against shipping another generic to-do app.</sub>
  <br />
  <sub>© 2026 Nous · 让想法，落地</sub>
</div>
