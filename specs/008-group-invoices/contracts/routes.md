# Contract: app routes and actions

## Routes

| Route | Shows | Writes (when group not archived) |
|-------|-------|-------------------------------|
| `/grupos/[id]` | Card "Notas": 3 most recent + "Ver notas" / "Enviar nota" | — |
| `/grupos/[id]/notas` | Group invoices, newest first, paginated (`?cursor=`); auto-refresh while any is pending | Upload form |
| `/grupos/[id]/notas/[notaId]` | Invoice detail (status, store, date, items, total, uploader, origin list), linked expense + difference warning | Link/replace/unlink expense; delete (uploader or admin) |
| `/despesas/[id]` | Section "Nota": linked invoice link | Upload with `expenseId`; pick an unlinked group invoice; unlink |
| `/notas`, `/notas/:id` | Redirect to `/grupos` (non-permanent) | — |

Non-member or invoice from another group → `notFound()` (404/403 from API, or `invoice.groupId !== params.id`).

## Server Actions (`app/actions/invoices.ts`)

| Action | Fields | On success | On failure |
|--------|--------|-----------|------------|
| `uploadInvoiceAction` | `groupId`, `file`, optional `expenseId` | redirect `/grupos/{groupId}/notas/{invoiceId}` | `FormState.error` (type, size, archived, already has invoice) |
| `linkInvoiceAction` | `invoiceId`, `groupId`, `expenseId`, `returnTo` | redirect `returnTo` | redirect `returnTo?erro=CODE` |
| `unlinkInvoiceAction` | `invoiceId`, `groupId`, `returnTo` | redirect `returnTo` | redirect `returnTo?erro=CODE` |
| `deleteInvoiceAction` | `invoiceId`, `groupId` | redirect `/grupos/{groupId}/notas` | redirect detail `?erro=CODE` |

`returnTo` is validated with `lib/safe-next` (only same-origin app paths). Each action revalidates the group, its notes page, and the expense page involved.
