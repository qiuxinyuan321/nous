# Security Policy · Nous

Thanks for helping keep Nous and its users safe.

## Supported Versions

Nous is pre-1.0 and moves fast. Only `main` (latest release) receives security updates.

| Version | Supported |
|---|---|
| `main` (latest) | ✅ |
| Older tags | ❌ (please rebase) |

## Reporting a Vulnerability

**Please do NOT open a public issue for security problems.**

Email the maintainer via the address on the GitHub profile, or use
[GitHub private vulnerability reporting](https://github.com/qiuxinyuan321/nous/security/advisories/new).

Include:

- Vulnerable path / API / config
- Proof-of-concept (steps to reproduce)
- Impact assessment (who / what / how bad)
- Your contact for follow-up

**What to expect**:

| Phase | Timeline |
|---|---|
| First ack from maintainer | within **48 hours** |
| Triage + patch plan | within **7 days** |
| Fix release | within **30 days** (faster if severe) |
| Public disclosure | coordinated with reporter |

If we accept the report, we'll credit you in the release notes (unless you prefer to stay anonymous).

---

## Threat Model Highlights

For transparency, the following are **in scope** and we care about them:

- **API Key leakage** — BYOK tokens (OpenAI / Anthropic / Notion / ...) MUST never leave the server untrusted, MUST be stored encrypted (AES-256-GCM with server-side master key), and MUST never appear in logs.
- **Auth bypass** — NextAuth session hijacking, CSRF on auth callbacks, password brute-force on the Credentials provider.
- **Injection** — Prisma is parameterized; but any raw SQL / shell exec / system prompt injection that leaks user data across accounts is high severity.
- **Path traversal / arbitrary read** — file-like APIs (Obsidian import, audio upload) must constrain size + mime and refuse paths outside expected scope.
- **Prompt injection that exfiltrates memory** — user B should never be able to craft input that makes the AI reveal user A's memories.

Out of scope (for now):

- Self-XSS by pasting code into one's own notes
- Rate-limit bypass on Demo Key (cost absorbed by hoster)
- DoS by uploading giant text to your own Inbox — covered by size caps, but not a security issue
- Social-engineering the hoster into granting access

## Hardening Checklist for Self-Hosters

If you self-host, please verify:

- [ ] `CRYPTO_KEY` is 64-char hex and never committed
- [ ] `NEXTAUTH_SECRET` is randomly generated per deployment
- [ ] `DATABASE_URL` uses SSL (`sslmode=require` on managed Postgres)
- [ ] Nginx / reverse proxy terminates TLS (Certbot or Cloudflare)
- [ ] `.env.prod` is `chmod 600` and not committed
- [ ] Redis is NOT exposed on public interface
- [ ] Postgres is NOT exposed on public interface (Docker network only)
- [ ] Regular backups of Postgres data volume

## License

Security policy is CC0 / public domain — copy freely.
