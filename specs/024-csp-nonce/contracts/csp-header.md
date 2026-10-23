# Contrato: cabeçalhos de política por tipo de resposta

Substitui a linha `Content-Security-Policy` de
[023/contracts/security-headers.md](../../023-reaudit-run2-hardening/contracts/security-headers.md)
para as páginas. Os outros quatro cabeçalhos do 023 (`X-Frame-Options`,
`Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`) não mudam e continuam em
todas as respostas.

## Política completa (produção)

Uma linha, diretivas nesta ordem, separadas por `; `:

```text
default-src 'self'
script-src 'self' 'nonce-<N>' 'strict-dynamic'
style-src 'self' 'nonce-<N>'
style-src-attr 'unsafe-inline'
img-src 'self' blob: <API>
font-src 'self'
connect-src 'self'
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
```

- `<N>`: nonce da requisição (24 caracteres base64).
- `<API>`: `apiOrigin()`; em loopback, `<API> http://localhost:* http://127.0.0.1:*`.
- Desenvolvimento: `script-src` termina com `'unsafe-eval'`; `style-src` vira
  `'self' 'nonce-<N>' 'unsafe-inline'`.

## Cabeçalhos por resposta

| Resposta | Bloqueio (padrão) | Só relatar (`CSP_REPORT_ONLY=1`) |
|----------|-------------------|-----------------------------------|
| Página, erro, 404, `/sair` (passam pelo proxy) | `Content-Security-Policy: <completa>` (uma só) | `Content-Security-Policy: frame-ancestors 'none'` + `Content-Security-Policy-Report-Only: <completa>` |
| Redirecionamento feito pelo proxy | `Content-Security-Policy: frame-ancestors 'none'` | igual |
| Arquivo de `/public` (`.png`, `.svg`, `.ico`), `/_next/*` | `Content-Security-Policy: frame-ancestors 'none'` | igual |
| Redirecionamento de `next.config.ts` (`/painel`, `/notas`…) | nenhum cabeçalho de segurança: o Next aplica `redirects()` antes de `headers()`, como já era no 023. É um 307 sem corpo, sem nada para exibir em frame; o destino traz a política | igual |
| `/api/v1/*` | cabeçalhos da API (fora deste contrato, como no 023) | igual |

## HTML

- Toda `<script>` que o Next gera numa página leva `nonce="<N>"`, o mesmo do cabeçalho daquela
  resposta.
- Duas requisições à mesma página nunca repetem `<N>`.
