#!/bin/sh
# ─── Nous 容器启动脚本 ─────────────────────────────────
# 1. 等 Postgres 可连通
# 2. 跑 prisma migrate deploy(使用 standalone 内置的 prisma CLI)
# 3. 把控制权交给 CMD (node server.js)
set -e

echo "[entrypoint] waiting for database..."
MAX_RETRIES=30
RETRY=0
until node -e "const u=new URL(process.env.DATABASE_URL);require('net').createConnection(Number(u.port||5432),u.hostname).on('connect',()=>{process.exit(0)}).on('error',()=>{process.exit(1)})" 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "[entrypoint] database not reachable after $MAX_RETRIES tries, giving up"
    exit 1
  fi
  sleep 2
done
echo "[entrypoint] database reachable."

# prisma CLI 由 next.config.ts 的 outputFileTracingIncludes 带进 standalone
# 路径: ./node_modules/prisma/build/index.js
echo "[entrypoint] running prisma migrate deploy..."
# Prisma CLI 单独装在 /pcli/node_modules,避免 standalone 下 pnpm symlink 残缺
PRISMA_CLI="/pcli/node_modules/prisma/build/index.js"
if [ -f "$PRISMA_CLI" ]; then
  node "$PRISMA_CLI" migrate deploy --schema=./prisma/schema.prisma || {
    echo "[entrypoint] migrate failed"
    exit 1
  }
else
  echo "[entrypoint] WARN: prisma CLI not found at $PRISMA_CLI, falling back to npx"
  export HOME=/tmp
  npx --yes prisma@6.19.3 migrate deploy --schema=./prisma/schema.prisma
fi

echo "[entrypoint] starting server on port ${PORT:-3000}..."
exec "$@"
