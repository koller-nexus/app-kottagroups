# Contrato: cabeçalhos de segurança (#64, FR-010–FR-013)

Toda resposta do app (`source: "/:path*"` em `next.config.ts`) inclui exatamente:

| Cabeçalho | Valor |
|-----------|-------|
| `Content-Security-Policy` | `frame-ancestors 'none'` |
| `X-Frame-Options` | `DENY` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

Cobertura mínima conferida no e2e:

| Pedido | Exemplo |
|--------|---------|
| Página | `GET /entrar` |
| Arquivo de `/public` | `GET /kotta-icon.png` |
| Proxy da API | `GET /api/v1/users/me` (o status não importa, só os cabeçalhos) |

**Proxy da API**: os cabeçalhos da resposta da API sobrescrevem os do app. Em 2026-10-21 a API local
mandava `content-security-policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'`,
`strict-transport-security: max-age=15552000; includeSubDomains` e os outros três iguais. No
proxy, o e2e exige só que os cinco existam, `frame-ancestors 'none'` e `X-Frame-Options: DENY`.
Subir o HSTS da API para 2 anos é com o repositório da API.

Páginas com `metadata.referrer = "no-referrer"` (`/convite/[token]`, `/redefinir-senha`,
`/confirmar-email`) continuam sem Referer, porque a `<meta>` vale mais que o cabeçalho no
documento.
