# 参与贡献 / Contributing

感谢你对 Nous 的兴趣！以下是参与贡献的指南。

Thanks for your interest in Nous! Here's how to contribute.

## 开发环境

```bash
# 1. Fork + Clone
git clone https://github.com/<you>/nous.git && cd nous

# 2. 安装依赖
pnpm install

# 3. 本地服务
cp .env.example .env.local
pnpm docker:dev       # 启动 Postgres + Redis
pnpm prisma:migrate   # 初始化数据库
pnpm dev              # http://localhost:3000
```

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: 新功能
fix: 修复
docs: 文档
style: 格式 (不影响代码运行)
refactor: 重构
test: 测试
chore: 构建/工具
```

示例：`feat: add voice capture via Whisper API`

## Pull Request 流程

1. 从 `main` 新建分支：`git checkout -b feat/your-feature`
2. 确保通过：`pnpm typecheck && pnpm lint && pnpm test`
3. 提交 PR，描述清楚改了什么、为什么
4. 等待 CI 通过 + Review

## 代码风格

- TypeScript 严格模式
- ESLint + Prettier（`pnpm lint` 自动修复）
- 组件使用函数式 + React Server Components 优先
- 国际化：所有用户可见文本放 `messages/zh-CN.json` + `messages/en-US.json`

## Issue

- Bug：提供复现步骤、浏览器/环境信息
- Feature：描述使用场景和预期行为
- 中英文均可

## 行为准则

请参阅 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。
