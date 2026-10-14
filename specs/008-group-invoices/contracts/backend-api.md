# Contract (proposed): backend API for group invoices

Status: **implemented** in `api-kottagroups` branch `feature/058-group-invoices` (spec `specs/058-group-invoices`), not merged or deployed yet. The app depends on it (spec → Dependencies). Envelope, auth, pagination and error format follow the existing API (`{ data }`, `ErrorEnvelope`, bearer token, `limit`/`cursor`).

## Schema changes

`Invoice` gains:

| Field | Type | Notes |
|-------|------|-------|
| `groupId` | string, nullable | Null only for legacy personal invoices. |
| `uploadedByUserId` | string | Who sent it. |
| `expenseId` | string, nullable | Linked expense, same group. |
| `shoppingListId` | string, nullable | Set for shopping-list receipts. |

`ExpenseSummary` (and therefore `ExpenseDetail`) gains `invoiceId: string | null`.

## Endpoints

| Method | Path | Body | Success | Errors |
|--------|------|------|---------|--------|
| POST | `/api/v1/groups/{id}/invoices` | multipart `file`, optional `expenseId` | 202 `DataInvoice` | 400 `VALIDATION_FAILED`/`INVALID_RECEIPT_TYPE`/`RECEIPT_TOO_LARGE`; 403 `FORBIDDEN` (not member); 404; 409 `GROUP_ARCHIVED`, `EXPENSE_HAS_INVOICE`; 429 |
| GET | `/api/v1/groups/{id}/invoices` | `limit` (1–100, default 20), `cursor` | 200 `DataInvoicePage`, newest first, includes list receipts | 403; 404 |
| GET | `/api/v1/invoices/{id}` | — | 200 `DataInvoice` | 404 for non-members of the invoice group (and for other users' legacy invoices) |
| PUT | `/api/v1/invoices/{id}/expense` | `{ "expenseId": string }` | 200 `DataInvoice` | 400 `VALIDATION_FAILED` (expense missing or in another group, invoice without group); 404; 409 `GROUP_ARCHIVED`, `EXPENSE_HAS_INVOICE` |
| DELETE | `/api/v1/invoices/{id}/expense` | — | 200 `DataInvoice` (`expenseId: null`) | 404; 409 `GROUP_ARCHIVED` |
| DELETE | `/api/v1/invoices/{id}` | — | 204 | 400 (shopping-list receipt, or still `queued`/`processing`); 403 (not uploader nor group owner/admin); 404; 409 `GROUP_ARCHIVED` |

## Rules the backend enforces

- Only members of the invoice group read or write it.
- Linked expense must belong to the same group; one invoice ↔ at most one expense (unique on both sides). PUT replaces the previous link.
- Deleting an expense clears `expenseId` on its invoice. The link is stored as `expenses.invoice_id` (unique), so expense reads carry `invoiceId` directly.
- Archived group: reads allowed, writes return 409 `GROUP_ARCHIVED`.
- `POST /api/v1/invoices` (personal upload) can be removed or kept; the app stops calling it.
