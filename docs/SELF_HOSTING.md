# 自托管 Nous

在自己的服务器上把 Nous 完整跑起来,5 分钟上线。

## 目录

- [硬件要求](#硬件要求)
- [5 分钟上线](#5-分钟上线)
- [环境变量详解](#环境变量详解)
- [HTTPS 证书](#https-证书)
- [备份与恢复](#备份与恢复)
- [升级](#升级)
- [故障排查](#故障排查)

---

## 硬件要求

| 资源 | 最低 | 推荐 |
|---|---|---|
| CPU | 2 核 | 2 核 |
| 内存 | 2 GB | 4 GB |
| 硬盘 | 20 GB SSD | 40 GB SSD |
| 带宽 | 3 Mbps | 5 Mbps |
| 系统 | Ubuntu 22.04 / Debian 12 / AlmaLinux 9 | Ubuntu 22.04 LTS |

阿里云、腾讯云、DigitalOcean 的最小规格都够用。

---

## 5 分钟上线

### 1. 装 Docker

```bash
curl -fsSL https://get.docker.com | bash
systemctl enable --now docker
# 验证
docker compose version
```

### 2. 克隆 + 配置

```bash
git clone https://github.com/<you>/nous.git
cd nous
cp .env.example .env.prod
```

编辑 `.env.prod`,至少填好这几个:

```bash
# 必填
DATABASE_URL="postgresql://nous:$(openssl rand -hex 8)@postgres:5432/nous"
POSTGRES_USER=nous
POSTGRES_PASSWORD=<上面 DATABASE_URL 里相同的密码>
POSTGRES_DB=nous

NEXTAUTH_URL="https://nous.yourdomain.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
CRYPTO_KEY="$(openssl rand -hex 32)"

REDIS_URL="redis://redis:6379"

# 可选:内置 Demo Key 让新用户开箱可用
# DEMO_BASE_URL=https://api.openai.com/v1
# DEMO_API_KEY=sk-xxx
# DEMO_MODEL=gpt-4o-mini
```

> ⚠️ `CRYPTO_KEY` 是所有用户 BYOK Key 的解密主密钥,**一旦设置不要修改**,否则已有的 Key 无法再使用。

### 3. 一键启动

```bash
bash scripts/deploy.sh
```

脚本会:
1. 预检 Docker 和关键环境变量
2. 构建 Nous 镜像(首次 2-3 分钟)
3. 启动 Postgres + Redis + App + Nginx
4. 等待 app 健康检查通过
5. 打印访问地址

首次访问 `http://<服务器 IP>` 可见落地页。

### 4. 绑定域名 + HTTPS

配置域名 A 记录指向服务器 IP 后:

```bash
bash scripts/setup-ssl.sh nous.yourdomain.com your@email.com
```

脚本会通过 Let's Encrypt 签发证书,切换 nginx 到 HTTPS 配置,并安装每日 3am 自动续签 cron。

---

## 环境变量详解

### 必填

| 变量 | 说明 |
|---|---|
| `DATABASE_URL` | Postgres 连接串。自托管指向容器内 `postgres:5432`,用 RDS 则指向云库 |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | 自托管 Postgres 凭证,compose 据此拼 `DATABASE_URL`(用 RDS 时仍需占位) |
| `REDIS_URL` | 配额计数 + 限流,自托管指向容器内 `redis:6379` |
| `NEXTAUTH_URL` | 实际访问地址,含 `https://` |
| `NEXTAUTH_SECRET` | NextAuth.js 会话密钥,`openssl rand -base64 32` |
| `CRYPTO_KEY` | BYOK 加密主密钥,64 位 hex,`openssl rand -hex 32` |

### 可选 · Demo Key

没配的话,用户必须先自己加 BYOK 才能用 AI。

| 变量 | 说明 |
|---|---|
| `DEMO_BASE_URL` | OpenAI 兼容 base url(官方/浮生云算/OneAPI 等) |
| `DEMO_API_KEY` | 后台 key |
| `DEMO_MODEL` | 默认模型,如 `gpt-4o-mini` |
| `DEMO_DAILY_LIMIT` | 每用户每日调用上限,默认 20 |
| `DEMO_MAX_TOKENS` | 单次最大输出 token,默认 2000 |

### 可选 · 登录方式

| 变量 | 说明 |
|---|---|
| `GITHUB_ID` / `GITHUB_SECRET` | GitHub OAuth 应用(https://github.com/settings/developers) |
| `EMAIL_SERVER` | Magic link SMTP `smtp://user:pass@host:port` |
| `EMAIL_FROM` | 发信地址 |

全都留空时,登录页会打印 magic link 到 `docker logs nous-app`(仅适合个人用途)。

---

## HTTPS 证书

`setup-ssl.sh` 使用 certbot 的 webroot challenge 方式签证。每日 3am 自动尝试续签(证书到期前 30 天内才会真实续签)。

手动测试续签:

```bash
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot renew --dry-run
```

---

## 备份与恢复

### 备份

```bash
bash scripts/backup-db.sh  # 写入 ~/backups/nous/nous-YYYYMMDD-HHMMSS.sql.gz,保留 14 天
```

加到 crontab:

```cron
0 3 * * * /opt/nous/scripts/backup-db.sh
```

配合 OSS/S3 还可以再做一次异地备份:

```bash
ossutil cp ~/backups/nous/nous-*.sql.gz oss://your-bucket/nous/
```

### 恢复

```bash
gunzip -c nous-20260419-030000.sql.gz | \
  docker exec -i nous-postgres psql -U nous -d nous
```

---

## 升级

```bash
cd /opt/nous
git pull
docker compose --env-file .env.prod -f docker/docker-compose.prod.yml build app
docker compose --env-file .env.prod -f docker/docker-compose.prod.yml up -d
```

entrypoint 会自动跑 `prisma migrate deploy`,不需要手动迁移。

---

## 故障排查

### 容器起不来

```bash
docker compose --env-file .env.prod -f docker/docker-compose.prod.yml ps
docker logs nous-app --tail 100
docker logs nous-postgres --tail 50
docker logs nous-nginx --tail 30
```

### AI 调用报错 `PROVIDER_UNAVAILABLE`

没配 Demo Key,而且用户也没配 BYOK。去 `/settings/api-keys` 添加。

### 登录收不到邮件

- 检查 `EMAIL_SERVER` SMTP 可用性
- 看 `docker logs nous-app` 是否直接打印了 magic link(开发兜底)
- 看你邮箱的垃圾箱

### 忘记 CRYPTO_KEY 改了

所有 BYOK Key 会解密失败,只能让用户重新配置。已创建的 Demo 使用记录不受影响。

### 性能差

- 确认机器有 2GB 以上内存(Node 进程稳态 ~400MB)
- 阿里云带宽若只买了 1Mbps,流式 AI 会卡顿,至少 3Mbps
- 看 `docker stats` 找瓶颈

---

## 相关文档

- [AI Providers 配置](./AI_PROVIDERS.md)
- [README · 快速上手](../README.md)
