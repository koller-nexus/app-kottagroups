# Contrato: regras puras (FR-007, FR-014, FR-015, FR-016)

Cada tabela vira um teste em `pnpm test`.

## `redactAnalyticsUrl(url: string): string` — `lib/invites.ts` (substitui `redactInviteUrl`)

| Entrada | Saída |
|---------|-------|
| `https://x.com/convite/abc?y=1` | `https://x.com/convite/[token]` |
| `https://x.com/entrar?next=%2Fconvite%2F<TOKEN>` | `https://x.com/entrar` |
| `https://x.com/cadastrar?next=%2Fconvite%2F<TOKEN>` | `https://x.com/cadastrar` |
| `https://x.com/redefinir-senha?token=X` | `https://x.com/redefinir-senha` |
| `https://x.com/confirmar-email?token=X#a` | `https://x.com/confirmar-email` |
| `https://x.com/grupos/1?aba=saldos` | `https://x.com/grupos/1` |
| `https://x.com/` | `https://x.com/` |

## `friendlyMessage(code, fallback?)` — `lib/api/errors.ts`, caso padrão

`ERROR_CODE_PATTERN = /^[A-Z0-9_]{1,64}$/`

| `code` | Saída |
|--------|-------|
| `INVALID_TOKEN` (conhecido) | mensagem do código, como hoje |
| `HTTP_418` | `${fallback} (HTTP_418)` |
| `"A".repeat(64)` | `${fallback} (AAAA…)` |
| `"A".repeat(65)` | `fallback` |
| `Sua conta foi bloqueada, ligue 0800` | `fallback` |
| `invalid_token` (minúsculas) | `fallback` |
| `""` | `fallback` |

## `httpsUrl(value): string | undefined` — `lib/https-url.ts`

| `value` | Saída |
|---------|-------|
| `https://cdn.x/a.jpg` | o mesmo valor |
| `HTTPS://cdn.x/a.jpg` | o mesmo valor (`URL` normaliza o protocolo) |
| `http://cdn.x/a.jpg` | `undefined` |
| `http://localhost:8085/api/v1/avatars/a.png` | o mesmo valor (loopback) |
| `http://127.0.0.1/a.jpg` | o mesmo valor (loopback) |
| `http://[::1]:8085/a.jpg` | o mesmo valor (loopback) |
| `http://localhost.evil.com/a.jpg` | `undefined` |
| `ftp://localhost/a.jpg` | `undefined` |
| `javascript:alert(1)` | `undefined` |
| `data:image/png;base64,AAAA` | `undefined` |
| `/relativo.jpg` | `undefined` |
| `não é url` | `undefined` |
| `null` / `undefined` / `""` | `undefined` |
