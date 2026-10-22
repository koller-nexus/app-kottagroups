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

**Proxy da API (`/api/v1/*`) fica fora deste contrato**: é uma rewrite externa, e o Next devolve só
os cabeçalhos da resposta da API, sem aplicar os de `headers()`. Eles mudam com o ambiente da API.
A API local de 2026-10-21 mandava CSP `default-src 'none'; frame-ancestors 'none'; base-uri 'none'`,
HSTS de 180 dias e os outros três; a do CI (`APP_ENV=dev`) não manda HSTS. Esses cabeçalhos são
responsabilidade do repositório da API, e o e2e deste repo não os confere.

Páginas com `metadata.referrer = "no-referrer"` (`/convite/[token]`, `/redefinir-senha`,
`/confirmar-email`) continuam sem Referer, porque a `<meta>` vale mais que o cabeçalho no
documento.
