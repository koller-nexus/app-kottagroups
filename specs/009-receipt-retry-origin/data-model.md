# Data Model: 009

Sem persistência no front. Só formas vindas da API (`lib/api/types.ts`).

## ApiShoppingReceipt (estendido)
| Campo | Tipo | Regra |
|-------|------|-------|
| `resolutionPath` | `ApiReceiptResolutionPath \| null` | Origem do resultado. Obrigatório no JSON (pode ser `null`). Valor fora da lista → tratado como sem selo. |
| `retry` | `ApiReceiptRetry` | Obrigatório no JSON. |
| `items`, `matches`, `establishment`, `totalCents` | como hoje | Vazios enquanto `queued`/`processing`. |

## ApiReceiptResolutionPath
`"qr_image" | "printed_key" | "qr_submitted" | "text"`

| Valor | Selo |
|-------|------|
| `qr_image` | Lido pelo QR code |
| `printed_key` | Lido pela chave de acesso |
| `qr_submitted` | QR code |
| `text` | Lido da foto — confira os itens |
| `null` / desconhecido | (sem selo) |

## ApiReceiptRetry
`{ allowed: boolean; remaining: number }`

- `remaining >= 0`. Texto: `1` → "1 tentativa restante"; `n` → "n tentativas restantes".

## Regra do botão
`canRetryReceipt(r) = r.retry.allowed && (r.status === "failed" || r.status === "needs_review")`

## ApiReceiptAccepted (reuso)
Resposta 202 de `POST .../receipt/retry`; o front não lê o corpo, só revalida.

## Transições de estado
`failed | needs_review` --retry(202)--> `queued` → `processing` → `done | needs_review | failed`.
