# Contracts: 004-receipt-scan-matching

Two kinds of interface: the backend HTTP routes this feature **consumes** (owned by
api-kottagroups, not redefined here) and the server actions and components this feature
**exposes** inside the app.

## Consumed HTTP API

Source of truth: `api-kottagroups/specs/053-nfce-shopping-match/contracts/http-api.md`.

| Route | Used by | Notes |
|---|---|---|
| `GET /shopping-lists/{id}` | list page | items carry `match`; `receipt` is the summary |
| `GET /shopping-lists/{id}/receipt` | list page (parallel with the list) | 404 → no receipt |
| `POST /shopping-lists/{id}/receipt` JSON `{ qrUrl }` or `{ accessKey }` | `submitReceiptCodeAction` | 202 |
| `POST /shopping-lists/{id}/receipt` multipart `file` | `uploadReceiptAction` (existing) | now 202 |
| `DELETE /shopping-lists/{id}/receipt` | `deleteReceiptAction` (existing) | unchanged |
| `PATCH /shopping-item-matches/{id}` `{ status }` | `decideMatchAction` | 200 |

Error codes to map in `friendlyMessage` (`lib/api/errors.ts`):

| Code | Message (pt-BR) |
|---|---|
| `RECEIPT_ALREADY_IMPORTED` | "Essa nota já foi usada neste grupo." |
| `NFCE_UNSUPPORTED` | "Ainda não lemos notas desse estado. Envie uma foto da nota." |
| `NFCE_UNAVAILABLE` | "A leitura pelo QR code está fora do ar. Envie uma foto da nota." |
| `VALIDATION_FAILED` | existing generic message |

## Server actions (app/actions/shopping.ts)

All follow the existing pattern: `"use server"`, validate input first, `apiRequest` (which carries
the session and lets the API enforce group membership, FR-019), `failure()` for API errors,
`revalidatePath("/", "layout")` on success.

```ts
// QR or typed key. Exactly one of the two fields is present.
submitReceiptCodeAction(prev: FormState, formData: FormData): Promise<FormState>
//   fields: listId, and qrUrl | accessKey
//   invalid input → { error } without calling the API:
//     qrUrl without a valid key → "Esse QR não parece de nota fiscal."
//     accessKey invalid        → accessKeyProblem(...)
//   accessKey is sent normalized (44 digits).

// Existing; unchanged signature. Response type becomes ApiReceiptAccepted.
uploadReceiptAction(prev: FormState, formData: FormData): Promise<FormState>

// Sim / Não on a "Confere?" row.
decideMatchAction(prev: FormState, formData: FormData): Promise<FormState>
//   fields: matchId, status ∈ { "confirmed", "rejected" } (from the clicked submit button)
//   anything else → { error: "Não foi possível conferir este item." }
```

## Components

| Component | Kind | Props | Responsibility |
|---|---|---|---|
| `components/receipt/receipt-capture.tsx` `ReceiptCapture` | client | `listId`, `failedMessage?: string` | **Escanear QR code** (primary), **Enviar foto** (secondary, wraps the compressing upload form), **Digitar a chave de acesso** disclosure; opens the key field automatically when the scanner reports no camera |
| `components/receipt/qr-scanner.tsx` `QrScanner` | client, loaded via `next/dynamic` `{ ssr: false }` | `onDetected(qrUrl)`, `onUnavailable()`, `onClose()` | `<dialog>` with live camera, BarcodeDetector → `jsqr` fallback, invalid-QR message, releases the camera on every close path |
| `components/receipt/receipt-status.tsx` `ReceiptStatus` | client | `status: ApiReceiptStatus` | status text in `role="status"`; backoff polling with `router.refresh()` while pending; timeout + **Verificar de novo** |
| `components/receipt/receipt-summary.tsx` `ReceiptSummary` | server | `receipt: ApiShoppingReceipt`, `listId`, `readOnly` | establishment, date, total (`Price`), method label, `<details>` "Também na nota (N)", **Remover nota fiscal** |
| `components/receipt/item-match.tsx` `ItemMatchLine`, `MatchDecision` | client | `state`, `invoiceItem?`, `matchId?`, `itemName`, `readOnly` | icon + word + invoice line; Sim/Não form for `review` |
| `components/forms/shopping-forms.tsx` `ShoppingItemRow` | client (existing) | adds `matchState`, `invoiceItem?` | row background by state; renders `ItemMatchLine`; manual checkbox unchanged |

### Row presentation contract (FR-013, SC-005)

| State | Background | Icon | Word | Secondary line |
|---|---|---|---|---|
| `found` | `kotta-light-green` | check | "Encontrado" | `invoiceLineLabel` |
| `review` | `kotta-review-bg` | question mark | "Confere?" | invoice line + **Sim** / **Não** |
| `missing` | `kotta-surface` | dash | "Não encontrado" | — |
| `none` | `kotta-surface` | — | — | today's "Quantidade: N" |

Read-only (archived group): states render, Sim/Não and capture are hidden.

### Status presentation contract (FR-008, FR-011)

| Receipt status | Shown |
|---|---|
| none | `ReceiptCapture` |
| `queued` / `processing` | `ReceiptStatus` "Lendo sua nota…" (polling) |
| `done` | `ReceiptSummary` |
| `needs_review` | `ReceiptStatus` "Confira alguns itens" + `ReceiptSummary` |
| `failed` | `ReceiptCapture` with `invoiceErrorMessage(errorMessage)` above it |
| `null` (legacy/PDF) | existing file preview + remove link |
