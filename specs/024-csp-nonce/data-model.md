# Data Model: CSP completa com nonce (024)

Nada é persistido. As duas "entidades" vivem só durante uma requisição.

## Nonce

| Campo | Tipo | Regra |
|-------|------|-------|
| valor | string base64 | 16 bytes de `crypto.getRandomValues` (128 bits); novo a cada requisição interceptada pelo proxy |

- Aparece em `'nonce-<valor>'` no `script-src` e no `style-src`, e no atributo `nonce` das tags
  que o Next gera. Em nenhum outro lugar (não vai para log, cookie nem cache).

## Política de segurança de conteúdo

Entrada de `contentSecurityPolicy(input)` em `lib/csp.ts`:

| Campo | Tipo | Origem |
|-------|------|--------|
| `nonce` | string | `createNonce()` |
| `apiOrigin` | string | `apiOrigin()` de `lib/api/origin.ts` (`API_ORIGIN`, padrão `https://api.kottagroups.com.br`) |
| `isDev` | boolean | `process.env.NODE_ENV === "development"` |

Saída: uma string `diretiva valor; diretiva valor; …` com as diretivas de
[contracts/csp-header.md](contracts/csp-header.md).

Regras:

- `isDev = false` ⇒ sem `'unsafe-eval'` e sem `'unsafe-inline'` em `script-src` e `style-src`.
- `apiOrigin` em loopback (`localhost`, `127.0.0.1`) ⇒ `img-src` ganha `http://localhost:*` e
  `http://127.0.0.1:*`. Fora do loopback, só a própria `apiOrigin`.

## Modo

| Valor de `CSP_REPORT_ONLY` | Cabeçalho que o proxy usa |
|----------------------------|---------------------------|
| `"1"` | `Content-Security-Policy-Report-Only` |
| ausente ou outro valor | `Content-Security-Policy` |

A troca de modo não altera a string da política (FR-010).
