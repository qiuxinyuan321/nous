# ═══════════════════════════════════════════════════════════════════
# Nous · Multi-stage Dockerfile
# - base   : 共享 node:20-alpine
# - deps   : 只装 package.json 里的依赖(pnpm, 带缓存层)
# - builder: prisma generate + next build (standalone output)
# - runner : 极小运行时(含独立 prisma CLI 用于 migrate deploy)
# ═══════════════════════════════════════════════════════════════════

# ─── base ───────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app


# ─── deps ───────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile


# ─── builder ────────────────────────────────────────────────────
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
# 构建时占位,真实值在容器启动时由 env 注入
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXTAUTH_SECRET="placeholder"
ENV CRYPTO_KEY="0000000000000000000000000000000000000000000000000000000000000000"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm exec prisma generate
RUN pnpm build


# ─── prisma-cli ─────────────────────────────────────────────────
# 独立装一份 prisma CLI 到标准 node_modules 布局,避免 standalone 里 pnpm
# symlink 结构不完整导致 require('@prisma/engines') 失败。
FROM base AS prisma-cli
WORKDIR /pcli
RUN echo '{"name":"prisma-cli","private":true,"dependencies":{"prisma":"6.19.3"}}' > package.json \
    && npm install --omit=dev --no-audit --no-fund --prefer-offline


# ─── runner ─────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 nextjs

# Next.js standalone 产物(含 @prisma/client 通过 outputFileTracingIncludes)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# 独立 prisma CLI(用于 entrypoint 里的 migrate deploy)
COPY --from=prisma-cli --chown=nextjs:nodejs /pcli/node_modules /pcli/node_modules

# 启动脚本
COPY --chown=nextjs:nodejs docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/quota || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "server.js"]
