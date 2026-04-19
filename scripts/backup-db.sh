#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Nous · 数据库每日备份
#
# 建议 crontab 配置:
#   0 3 * * * /opt/nous/scripts/backup-db.sh
#
# 保留最近 14 天的备份在 ~/backups/nous/
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/nous}"
mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y%m%d-%H%M%S)
FILE="$BACKUP_DIR/nous-$DATE.sql.gz"

# 从 .env.prod 读出数据库凭证
set -o allexport
# shellcheck disable=SC1091
. ./.env.prod
set +o allexport

docker exec nous-postgres pg_dump \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-owner --clean --if-exists \
  | gzip > "$FILE"

echo "[backup] $FILE ($(du -h "$FILE" | cut -f1))"

# 清理 14 天前的备份
find "$BACKUP_DIR" -name 'nous-*.sql.gz' -mtime +14 -delete 2>/dev/null || true
