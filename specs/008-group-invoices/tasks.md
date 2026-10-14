---
description: "Task list for 008-group-invoices"
---

# Tasks: Notas dentro do grupo

**Input**: Design documents from `/specs/008-group-invoices/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/backend-api.md, contracts/routes.md, quickstart.md

**Tests**: Included where research.md R6 plans them: pure rules in `lib/invoices.test.mjs` and the e2e flow in `e2e/notes-notifications.spec.ts`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (blocker check)

- [X] T001 Confirm the backend ships every endpoint and field in `specs/008-group-invoices/contracts/backend-api.md` by checking `../api-kottagroups/api/openapi.yaml` (`/api/v1/groups/{id}/invoices`, `PUT`/`DELETE /api/v1/invoices/{id}/expense`, `DELETE /api/v1/invoices/{id}`, `Invoice.groupId|uploadedByUserId|expenseId|shoppingListId`, `ExpenseSummary.invoiceId`); if any is missing, stop and record the gap in `specs/008-group-invoices/research.md` under R1

---

## Phase 2: Foundational (blocks all stories)

- [X] T002 Add to `ApiInvoice` in `lib/api/types.ts`: `groupId: string | null`, `uploadedByUserId: string`, `expenseId: string | null`, `shoppingListId: string | null`; add `invoiceId: string | null` to `ApiExpense` in the same file
- [X] T003 In `lib/api/kotta.ts` replace `listInvoicesPage` with `listGroupInvoicesPage = cache((groupId: string, cursor?: string, limit = 20) => apiRequest<CursorPage<ApiInvoice>>(withQuery(`/groups/${encodeURIComponent(groupId)}/invoices`, { limit, cursor })))`; keep `getInvoice`
- [X] T004 Remove the personal area: delete `app/(conta)/notas/page.tsx` and `app/(conta)/notas/[id]/page.tsx` (their markup moves in T008/T009), and remove the `/notas` entry from `components/app/nav-items.ts`
- [X] T005 Add non-permanent redirects `/notas` → `/grupos` and `/notas/:id` → `/grupos` next to the `/painel` redirect in `next.config.ts` (FR-015/FR-016)

**Checkpoint**: `pnpm lint` passes except for references to the removed pages, fixed in US1.

---

## Phase 3: User Story 1 - Enviar nota dentro do grupo (Priority: P1) 🎯 MVP

**Goal**: A member uploads a receipt photo inside a group; every member sees it in the group's notes; outsiders get 404.

**Independent Test**: quickstart.md rows 1, 2, 3, 9, 10, 11.

- [X] T006 [US1] Change `uploadInvoiceAction` in `app/actions/invoices.ts`: read `groupId` (required non-empty string, else `{ error: "Grupo não encontrado." }`) and optional `expenseId` (non-empty string or omitted); POST the multipart body (`file`, plus `expenseId` when present) to `/groups/${encodeURIComponent(groupId)}/invoices`; map `GROUP_ARCHIVED` and `EXPENSE_HAS_INVOICE` to pt-BR messages, keep the `INVALID_RECEIPT_TYPE` mapping; revalidate `/grupos/${groupId}`, `/grupos/${groupId}/notas` and, when `expenseId`, `/despesas/${expenseId}`; redirect to `/grupos/${groupId}/notas/${invoice.id}`
- [X] T007 [US1] Change `InvoiceUploadForm` in `components/forms/invoice-upload-form.tsx` to take `{ groupId: string; expenseId?: string }` and render them as hidden inputs
- [X] T008 [US1] Create `app/(conta)/grupos/[id]/notas/page.tsx` from the deleted `/notas` page: `Promise.all([getMe(), getGroup(id), listGroupInvoicesPage(id, cursor)])` (404/403 → `notFound()`), `back` to `/grupos/{id}`, upload card with `<InvoiceUploadForm groupId={id} />` only when `!group.archived`, list rows linking to `/grupos/{id}/notas/{invoice.id}` showing store/originalName, date, total when ready, status, uploader via `displayName(peopleById([group]), invoice.uploadedByUserId, me.id)`, "Comprovante da lista" when `shoppingListId`, and `AutoRefresh` while any `isInvoicePending`; pagination links use `/grupos/{id}/notas?cursor=`
- [X] T009 [US1] Create `app/(conta)/grupos/[id]/notas/[notaId]/page.tsx` from the deleted `/notas/[id]` page: fetch `getMe()`, `getGroup(id)`, `getInvoice(notaId)` in parallel; `notFound()` on API 404/403 or when `invoice.groupId !== id`; `back` to `/grupos/{id}/notas`; show uploader and "Comprovante da lista" link to `/grupos/{id}/listas/{shoppingListId}` when set
- [X] T010 [P] [US1] Create `components/app/group-invoices-card.tsx` (`GroupInvoicesCard({ groupId, archived })`, same structure and isolated error handling as `components/app/shopping-lists-card.tsx`): section "Notas", 3 most recent via `listGroupInvoicesPage(groupId, undefined, 3)`, empty state "Nenhuma nota enviada ainda.", links "Ver notas" and (when not archived) "Enviar nota" to `/grupos/{groupId}/notas`
- [X] T011 [US1] Render `<GroupInvoicesCard groupId={group.id} archived={group.archived} />` right after `<ShoppingListsCard …/>` in `app/(conta)/grupos/[id]/page.tsx`
- [X] T012 [US1] In `e2e/notes-notifications.spec.ts` replace the `/notas` test with: open a group, upload `tests/fixtures/receipts/` image via the notes page, land on the detail; assert `/notas` redirects to `/grupos` and the main nav has no "Notas" link

**Checkpoint**: US1 works alone (notes live in groups, old area gone).

---

## Phase 4: User Story 2 - Vincular nota a uma despesa (Priority: P2)

**Goal**: From a note, link it to one expense of the same group, replace, or unlink; both pages show the link; difference shown as a non-blocking warning.

**Independent Test**: quickstart.md rows 4, 5, 6, 8.

- [X] T013 [P] [US2] Add to `lib/invoices.ts` (rules from data-model.md): `invoiceDifferenceCents(invoice, expense)` = `reaisToCents(invoice.estimatedTotal) - expense.amountCents`, returning `null` unless status is `done`/`needs_review`; `linkableExpenses(expenses, invoice)` = expenses with `invoiceId === null` or `=== invoice.id`; `unlinkedInvoices(invoices)` = invoices with `expenseId === null`
- [X] T014 [P] [US2] Add `canDeleteInvoice(meId, uploadedByUserId, role)` (uploader or group admin, same shape as `canEditExpense`) to `lib/permissions.ts`
- [X] T015 [US2] Add cases for T013/T014 to `lib/invoices.test.mjs` and `lib/permissions.test.mjs` (difference positive/negative/zero/pending → null; linkable keeps own expense and drops others' linked; unlinked filter; delete allowed for uploader and admin, denied for other member)
- [X] T016 [US2] Add `linkInvoiceAction`, `unlinkInvoiceAction`, `deleteInvoiceAction` to `app/actions/invoices.ts` per `contracts/routes.md`: validate non-empty `invoiceId`/`groupId`/`expenseId`; sanitize `returnTo` with `lib/safe-next.ts` (fallback `/grupos/{groupId}/notas/{invoiceId}`); call `PUT /invoices/{id}/expense` `{ expenseId }`, `DELETE /invoices/{id}/expense`, `DELETE /invoices/{id}`; on `ApiError` redirect to `returnTo?erro={code}`; revalidate the group, its notes page, and the old/new expense pages; delete redirects to `/grupos/{groupId}/notas`
- [X] T017 [P] [US2] Create `components/forms/invoice-link-form.tsx` (server component, no client JS): `<form action={linkInvoiceAction}>` with hidden `invoiceId`, `groupId`, `returnTo`, a labeled native `<select name="expenseId">` of `{ id, label }` options, submit "Vincular" (or "Trocar despesa" when already linked), and a separate unlink form with button "Desvincular"
- [X] T018 [US2] In `app/(conta)/grupos/[id]/notas/[notaId]/page.tsx` add section "Despesa": fetch `listExpensesPage(id)` in the same `Promise.all`; show linked expense link `/despesas/{expenseId}` and, when `invoiceDifferenceCents` ≠ 0/null, warning "O total da nota difere da despesa em {Price}"; when not archived render `InvoiceLinkForm` with `linkableExpenses(...)`; render `?erro=` with `FormError` + `friendlyMessage`; when `canDeleteInvoice` and not archived, "Excluir nota" via `ConfirmDelete` + `deleteInvoiceAction`
- [X] T019 [US2] In `app/(conta)/despesas/[id]/page.tsx` add section "Nota": when `expense.invoiceId`, link to `/grupos/{group.id}/notas/{expense.invoiceId}` (FR-010)
- [X] T020 [US2] Map `EXPENSE_HAS_INVOICE` to "Esta despesa já tem uma nota." in `lib/api/errors.ts` and cover it in `lib/api/errors.test.mjs`
- [X] T021 [US2] Extend `e2e/notes-notifications.spec.ts`: link the uploaded note to a group expense, assert the expense page links back, then unlink

**Checkpoint**: US1 + US2 work together; linking is reachable from the note.

---

## Phase 5: User Story 3 - Anexar nota a partir da despesa (Priority: P3)

**Goal**: From an expense without a note, upload a photo already linked, or pick an unlinked group note.

**Independent Test**: quickstart.md row 7.

- [X] T022 [US3] In the "Nota" section of `app/(conta)/despesas/[id]/page.tsx`, when `!expense.invoiceId && !group.archived`: render `<InvoiceUploadForm groupId={group.id} expenseId={expense.id} />` and, if `unlinkedInvoices(listGroupInvoicesPage(group.id).items)` is non-empty, a picker form posting to `linkInvoiceAction` with `returnTo=/despesas/{id}` (reuse `InvoiceLinkForm` with notes as options; label each by establishment/originalName + date); when linked and not archived, show "Desvincular" with `returnTo=/despesas/{id}`; render `?erro=` as on the note page
- [X] T023 [US3] Extend `e2e/notes-notifications.spec.ts`: on an expense without a note, upload a photo and assert the resulting note detail shows that expense as linked

**Checkpoint**: All stories independently functional.

---

## Phase 6: Polish & Cross-Cutting

- [X] T024 [P] Grep for leftover `/notas` links and `listInvoicesPage` usages (`components/`, `app/`, `lib/`, `e2e/`) and point them to group routes or remove them
- [X] T025 Run `pnpm test`, `pnpm lint`, `pnpm build`, then `pnpm test:e2e e2e/notes-notifications.spec.ts`; walk through every row of `specs/008-group-invoices/quickstart.md`, including archived group (row 9) and expense deletion (row 8)

---

## Dependencies & Execution Order

- **T001** gates everything (backend contract).
- **Phase 2** (T002–T005) blocks all stories; T004 leaves the build broken until T008/T009 land, so do Phase 2 and US1 in one go.
- **US1** (T006–T012) → MVP. **US2** depends on US1 (note detail page T009). **US3** depends on US2 (T013, T016, T017, T019).
- Polish after the stories you ship.

## Parallel Opportunities

- US1: T010 alongside T006–T009 (different files).
- US2: T013, T014, T017 in parallel; then T015, T016; then T018–T021.
- Polish: T024 alongside T025's test runs.

## Implementation Strategy

1. T001; if the backend is not ready, stop.
2. Phase 2 + US1 → validate rows 1–3, 9–11 → shippable MVP (notes in groups, no linking).
3. US2 → validate rows 4–6, 8.
4. US3 → validate row 7.
5. Polish.
