#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Nous · Certbot 一次性申请 Let's Encrypt 证书
#
# 用法:  bash scripts/setup-ssl.sh nous.example.com admin@example.com
#
# 前置:
#   - 服务已通过 scripts/deploy.sh 起来(HTTP 80 已通)
#   - 域名 A 记录已指向本机
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

cd "$(dirname "$0")/.."

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "用法: $0 <domain> <email>"
  echo "例: $0 nous.example.com admin@example.com"
  exit 1
fi

echo "==> 域名: $DOMAIN"
echo "==> 联系邮箱: $EMAIL"

# ── 1. 通过 webroot 方式用一次性 certbot 容器签证 ───────────
mkdir -p /var/www/certbot
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --non-interactive

# ── 2. 把 nginx 切到 HTTPS 配置 ──────────────────────────────
sed "s/__DOMAIN__/$DOMAIN/g" \
  docker/nginx/conf.d/nous.conf.template > docker/nginx/conf.d/nous.conf

rm -f docker/nginx/conf.d/default.conf

echo "==> 重启 nginx 加载 SSL 配置..."
docker compose --env-file .env.prod -f docker/docker-compose.prod.yml restart nginx

# ── 3. 安装自动续签 cron ────────────────────────────────────
CRON_LINE="0 3 * * * docker run --rm -v /etc/letsencrypt:/etc/letsencrypt -v /var/www/certbot:/var/www/certbot certbot/certbot renew --quiet && docker exec nous-nginx nginx -s reload"

if ! crontab -l 2>/dev/null | grep -qF "certbot/certbot renew"; then
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "==> 已安装续签 cron(每日 3am)"
fi

echo "==> 完成: https://$DOMAIN"
