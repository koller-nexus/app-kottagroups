# Contract: receipt API (consumida pelo front)

Base: `{API_ORIGIN}/api/v1`. Autenticação: Bearer da sessão (feita por `apiRequest`).

## GET /shopping-lists/{id}/receipt
Campos novos (obrigatórios): `resolutionPath` (`"qr_image"|"printed_key"|"qr_submitted"|"text"|null`) e `retry` (`{ allowed: boolean, remaining: number }`).
Enquanto `status` é `queued`/`processing`: `items`, `matches` vazios; `establishment` null; `totalCents` 0.

## POST /shopping-lists/{id}/receipt/retry
Sem corpo.

| Status | Código | Mensagem no front |
|--------|--------|-------------------|
| 202 | — | (revalida a página; status `queued`) |
| 409 | `RECEIPT_RETRY_NOT_ALLOWED` | Essa nota não pode ser lida de novo agora |
| 409 | `RECEIPT_NOT_RETRYABLE` | Essa nota já foi importada neste grupo |
| 409 | `RECEIPT_RETRY_LIMIT` | Você já usou todas as tentativas para esta nota |
| 404 | `NOT_FOUND` | Não encontramos o que você procurava. |
| 403 | `FORBIDDEN` | Você não tem permissão para fazer isso. |
| 429 | `RATE_LIMITED` | Muitas tentativas seguidas. Espere alguns minutos e tente de novo. |

`errorMessage` (inglês, genérico) nunca é exibido.

## Contrato interno da UI
- `retryReceiptAction(prev: FormState, formData)` — campo `listId`; devolve `{ ok: true }` ou `{ error }`.
- `ReceiptRetry({ listId, remaining })` — botão "Tentar de novo" + `"{n} tentativas restantes"`; desabilitado durante a ação; erro em `role="alert"`.
