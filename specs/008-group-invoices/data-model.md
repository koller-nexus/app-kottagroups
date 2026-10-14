# Data Model: Notas dentro do grupo

The app stores nothing; these are the shapes it reads from the API ([contracts/backend-api.md](contracts/backend-api.md)) and the rules it shows.

## Nota (`ApiInvoice` in `lib/api/types.ts`)

Existing fields + new:

| Field | Type | Rule |
|-------|------|------|
| `groupId` | `string \| null` | Must match the route group, else 404 in the app. |
| `uploadedByUserId` | `string` | Shown with `displayName`; ex-members as in expenses. |
| `expenseId` | `string \| null` | At most one; same group. |
| `shoppingListId` | `string \| null` | Non-null → label "Comprovante da lista". |

States (`status`): `queued → processing → done | needs_review | failed`. Pending (`queued`/`processing`) → auto-refresh. Link allowed in any state.

## Despesa (`ApiExpense`)

| Field | Type | Rule |
|-------|------|------|
| `invoiceId` | `string \| null` | At most one note. |

## Derived values (`lib/invoices.ts`)

- `invoiceDifferenceCents(invoice, expense)`: `reaisToCents(invoice.estimatedTotal) - expense.amountCents`; only shown when invoice is `done`/`needs_review` and the result is non-zero.
- `linkableExpenses(expenses, invoice)`: expenses with `invoiceId === null` or `=== invoice.id`.
- `unlinkedInvoices(invoices)`: invoices with `expenseId === null` (shopping-list receipts included).
- `canDeleteInvoice(meId, uploadedByUserId, role)`: uploader or group admin (same shape as `canEditExpense`).

## Validation at the boundary (Server Actions)

- `groupId`, `invoiceId`, `expenseId`: non-empty strings; the API decides membership and same-group.
- File: existing `INVOICE_ACCEPT` / `INVOICE_MAX_BYTES`.
