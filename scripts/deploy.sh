#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Nous · 阿里云 ECS 一键部署脚本
#
# 用法(在 ECS 上):
#   git clone https://github.com/<you>/nous.git && cd nous
#   cp .env.example .env.prod && vim .env.prod
#   bash scripts/deploy.sh
#
# 本脚本幂等:重复执行不会破坏现有数据。
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# ── color ────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

say()  { echo -e "${BLUE}==>${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}!${NC} $*"; }
die()  { echo -e "${RED}✗${NC} $*" >&2; exit 1; }

# ── 1. 预检 ──────────────────────────────────────────────────
say "预检环境..."

command -v docker >/dev/null 2>&1 || die "未检测到 docker。先跑: curl -fsSL https://get.docker.com | bash"
docker compose version >/dev/null 2>&1 || die "未检测到 docker compose v2"
[ -f ".env.prod" ] || die "未找到 .env.prod。先跑: cp .env.example .env.prod && vim .env.prod"

# 校验关键变量存在
required_vars=(DATABASE_URL NEXTAUTH_URL NEXTAUTH_SECRET CRYPTO_KEY POSTGRES_PASSWORD)
for v in "${required_vars[@]}"; do
  if ! grep -E "^${v}=" .env.prod | grep -v 'REPLACE_WITH\|change-me\|""' >/dev/null; then
    die ".env.prod 中 $v 未配置或仍为占位值"
  fi
done

# CRYPTO_KEY 必须 64 位 hex
crypto_value=$(grep -E '^CRYPTO_KEY=' .env.prod | sed 's/.*="\?\([^"]*\)"\?/\1/')
if ! echo -n "$crypto_value" | grep -qE '^[0-9a-fA-F]{64}$'; then
  die "CRYPTO_KEY 必须是 64 位 hex 字符串。生成: openssl rand -hex 32"
fi

ok "环境就绪"

# ── 2. 构建 ──────────────────────────────────────────────────
# compose up -d 不会自动 rebuild 已有镜像,显式 build 一次确保 entrypoint/schema 变更生效
say "构建 Nous 镜像..."
docker compose --env-file .env.prod -f docker/docker-compose.prod.yml build app
ok "镜像构建完成"

# ── 3. 启动 ──────────────────────────────────────────────────
say "启动服务栈(postgres + redis + app + nginx)..."
docker compose --env-file .env.prod -f docker/docker-compose.prod.yml up -d --force-recreate
ok "服务已启动"

# ── 4. 等就绪 ────────────────────────────────────────────────
say "等待 app 健康检查..."
RETRY=0
MAX=30
while [ $RETRY -lt $MAX ]; do
  status=$(docker inspect -f '{{.State.Health.Status}}' nous-app 2>/dev/null || echo "none")
  if [ "$status" = "healthy" ]; then
    ok "app 健康"
    break
  fi
  RETRY=$((RETRY + 1))
  printf '.'
  sleep 3
done
echo

if [ $RETRY -ge $MAX ]; then
  warn "app 30 秒内未就绪。查看日志排查:"
  echo "   docker logs nous-app --tail 60"
fi

# ── 5. 提示 ──────────────────────────────────────────────────
say "部署完成"
NEXTAUTH_URL=$(grep -E '^NEXTAUTH_URL=' .env.prod | sed 's/.*="\?\([^"]*\)"\?/\1/')
echo "   访问: ${NEXTAUTH_URL}"
echo
echo "   ${YELLOW}下一步:${NC}"
echo "   1) 配置域名 A 记录指向本机 IP"
echo "   2) 申请 HTTPS 证书:   bash scripts/setup-ssl.sh <domain> <email>"
echo "   3) 查看日志:           docker logs -f nous-app"
echo "   4) 备份数据库:         bash scripts/backup-db.sh"
