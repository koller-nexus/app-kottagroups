# Quickstart: Notas dentro do grupo

## Prerequisites

- Backend running with the endpoints in [contracts/backend-api.md](contracts/backend-api.md) (check `/api/v1/groups/{id}/invoices` in the backend swagger).
- `API_ORIGIN` pointing to it; `pnpm install`.
- Two test users in the same group, one user outside it, a group with at least one expense, and a JPG of a receipt (e.g. `tests/fixtures`).

## Automated

```sh
pnpm test        # lib/invoices.test.mjs: difference, linkable expenses, unlinked invoices, delete permission
pnpm lint
pnpm test:e2e e2e/notes-notifications.spec.ts
```

## Manual validation

| # | Steps | Expected |
|---|-------|----------|
| 1 | Open `/grupos/{id}` → "Enviar nota" → pick photo → send | Lands on note detail, status "Na fila"/"Lendo a nota", updates by itself (US1, SC-001) |
| 2 | Second member opens `/grupos/{id}/notas` | Sees the note and who sent it (US1-3) |
| 3 | Outsider opens `/grupos/{id}/notas` and the note URL | 404 page (FR-005) |
| 4 | On the note, choose expense "Mercado" → Vincular | Note shows the link; expense page shows the note; difference warning if totals differ (US2, FR-009/010) |
| 5 | Link the note to another expense, then Desvincular | Only one link at a time; then none (US2-2/3, FR-007) |
| 6 | Second note → try to link to the same expense | Expense not offered in the selector; forced via API returns friendly "já tem nota" error |
| 7 | Expense without note → "Enviar nota" | New note created already linked (US3) |
| 8 | Delete the linked expense | Note stays in the group, no link |
| 9 | Archive the group | Notes visible; upload/link controls hidden (FR-013) |
| 10 | Open `/notas` and `/notas/abc` | Redirect to `/grupos`; no "Notas" in main nav (FR-015/016) |
| 11 | Shopping list receipt in the group | Appears in group notes labeled as from the list (FR-012) |
