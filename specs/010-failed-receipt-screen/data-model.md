# Data Model

Sem dados novos. Campos de `ApiInvoice` usados (`lib/api/types.ts`):

| Campo | Uso |
|-------|-----|
| `status` (`queued`, `processing`, `done`, `failed`, `needs_review`) | decide recuperação e visibilidade de "Despesa" |
| `expenseId` | mantém "Despesa" visível numa falha já vinculada |
| `errorMessage` | só passa por `invoiceErrorMessage`; nunca exibido cru |

## Regras (puras, em `lib/invoices.ts`)

- `canLinkInvoice(invoice)`: `isInvoiceRead(status) || expenseId !== null`.
- Recuperação: exibida quando `status === "failed"` e o grupo não está arquivado.
