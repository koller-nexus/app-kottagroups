# Data Model: Cookie de sessão preso ao host

Sem banco nem mudança na API. O "dado" é o cookie no navegador.

## Cookie de sessão (novo)

| Campo | Valor | Origem |
|-------|-------|--------|
| nome | `__Host-kotta_session` | FR-001 |
| valor | JWT da API, sem alteração | igual a hoje |
| `Secure` | sempre | FR-001, FR-002 |
| `HttpOnly` | sim | igual a hoje |
| `SameSite` | `Lax` | igual a hoje |
| `Path` | `/` | FR-001 (exigido pelo prefixo) |
| `Domain` | ausente | FR-001 (exigido pelo prefixo) |
| vencimento | `Expires` = `exp` do JWT; sem `exp`, `Max-Age` 86400 | FR-003, igual a hoje |

## Cookie de sessão (antigo, temporário)

| Campo | Valor |
|-------|-------|
| nome | `kotta_session` |
| uso | só lido (quando o novo falta) e apagado; nunca gravado |
| vida | até a remoção prevista no R7 do `research.md` |

## Estados da requisição e ação sobre os cookies

Entrada: valor do novo (`atual`), valor do antigo (`antigo`). `token = atual || antigo`.

| Estado | Condição | Ação na resposta |
|--------|----------|------------------|
| sem sessão | nenhum dos dois com valor; antigo ausente | nenhuma |
| antigo vazio | `atual` vazio/ausente, `antigo` presente e vazio | apagar antigo |
| vencida | `token` vencido ou ilegível (`isSessionExpired`) | apagar os dois |
| só antiga, válida | `atual` vazio/ausente, `antigo` válido | gravar novo com `antigo` e apagar antigo |
| nova + antiga | `atual` válido, `antigo` presente | apagar antigo |
| só nova | `atual` válido, `antigo` ausente | nenhuma |

Precedência: se os dois têm valor, vale `atual` (FR-004).
