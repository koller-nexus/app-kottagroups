# Data Model: 004-receipt-scan-matching

The web app stores nothing. These are the TypeScript shapes in `lib/api/types.ts` that mirror
the backend (`api-kottagroups/api/openapi.yaml`, 053), plus the derived view data computed in
`lib/receipt.ts`.

## API types (lib/api/types.ts)

```ts
type ApiReceiptStatus = ApiInvoiceStatus;            // queued | processing | done | failed | needs_review
type ApiExtractionMethod = "ocr" | "qrcode";
type ApiMatchStatus = "matched" | "needs_review" | "confirmed" | "rejected";

interface ApiItemMatch {                             // on each list item; null = no live match
  id: string;
  status: Exclude<ApiMatchStatus, "rejected">;
  confidence: number;                                // 0..1
}

interface ApiShoppingItem { /* existing fields */ match: ApiItemMatch | null }

interface ApiReceiptFile { contentType: string; sizeBytes: number; url?: string }

interface ApiReceiptSummary {                        // embedded in GET /shopping-lists/{id}
  invoiceId: string | null;                          // all three null = legacy/PDF receipt
  status: ApiReceiptStatus | null;
  extractionMethod: ApiExtractionMethod | null;
  file: ApiReceiptFile | null;                       // null on the QR path
  uploadedAt: string;
}
// replaces ApiReceipt; ApiShoppingListDetail.receipt: ApiReceiptSummary | null

interface ApiReceiptItem { index: number; description: string; quantity: number; unitCents: number; totalCents: number }

interface ApiReceiptMatch {
  id: string;
  shoppingItemId: string;
  status: ApiMatchStatus;
  confidence: number;
  invoiceItem: ApiReceiptItem | null;
}

interface ApiShoppingReceipt extends ApiReceiptSummary {   // GET /shopping-lists/{id}/receipt
  establishment: { cnpj: string | null; name: string; uf: string | null } | null;
  issuedOn: string | null;                           // YYYY-MM-DD
  totalCents: number;
  items: ApiReceiptItem[];                           // [] while pending
  matches: ApiReceiptMatch[];                        // [] while pending; rejected omitted
  errorMessage: string | null;
}

interface ApiReceiptAccepted {                       // 202 from POST .../receipt
  invoiceId: string | null;
  status: "queued" | null;
  extractionMethod: ApiExtractionMethod | null;
}
```

`PATCH /shopping-item-matches/{id}` returns `ApiReceiptMatch & { item: { id; completed } }`; the
action ignores the body (the page revalidates), so no type is added for it.

## Derived view data (lib/receipt.ts, pure, tested)

| Function | Input | Output | Rule |
|---|---|---|---|
| `accessKeyFromQrUrl` | decoded QR text | 44-digit key or `null` | `URL` parse, `p` param, part before first `\|`, must pass `normalizeAccessKey` |
| `normalizeAccessKey` | raw string | 44 digits or `null` | non-digits stripped; length 44; model `digits.slice(20, 22) === "65"`; mod-11 check digit |
| `accessKeyProblem` | raw string | Portuguese message or `null` | "A chave tem 44 números." / "Confira a chave: algum número não bate." |
| `formatAccessKey` | raw string | `"1234 5678 …"` | digits only, max 44, blocks of 4 |
| `fitWithin` | width, height, max (1600) | `{ width, height }` | scale down keeping ratio; never scale up |
| `nextPollDelay` | attempt (0-based) | ms | `min(2000 × 1.25^attempt, 5000)` |
| `itemMatchState` | `ApiShoppingItem`, receipt processed? | `"found" \| "review" \| "missing" \| "none"` | matched/confirmed → found; needs_review → review; null + processed receipt → missing; no processed receipt → none |
| `matchSummary` | items | `{ found, review, total }` | counts by `itemMatchState` |
| `matchSummaryLabel` | summary | "12 de 15 itens encontrados na nota · 2 para conferir" | omit "· N para conferir" when 0; singular "item" |
| `extraInvoiceItems` | receipt | `ApiReceiptItem[]` | `items` whose `index` is not the `invoiceItem.index` of any match |
| `invoiceLineLabel` | `ApiReceiptItem` | "2x LEITE INTEG 1L · R$ 10,98" | quantity with `pt-BR` locale + `formatBRL(totalCents)` |
| `extractionMethodLabel` | method | "via QR code" / "via foto" | |

"Processed receipt" = status `done` or `needs_review`.

## State transitions

Receipt (owned by the backend; the page only reflects it):

```text
(none) --scan/key/photo--> queued --> processing --> done
                                               \--> needs_review
                                               \--> failed --capture again--> queued
done/needs_review --Remover nota fiscal--> (none)
```

Item match (per row):

```text
null (no receipt)            -> grey, manual checkbox (today)
matched | confirmed          -> found (green)
needs_review --Sim--> confirmed (found)
needs_review --Não--> rejected  => item.match = null => missing (grey), completed cleared by backend
```

## Validation rules from requirements

- QR: decoded text must yield a valid key (FR-003) or the scanner shows "Esse QR não parece de
  nota fiscal" and sends nothing.
- Key field: submit disabled until `normalizeAccessKey` passes (FR-005, US3-2).
- Photo: images only, ≤ 10 MB after compression (existing `validateReceipt` limit), longest side
  ≤ 1600 px (FR-006).
- Match decision: `status ∈ { confirmed, rejected }`, `matchId` non-empty; anything else returns
  "Não foi possível conferir este item." without calling the API.
