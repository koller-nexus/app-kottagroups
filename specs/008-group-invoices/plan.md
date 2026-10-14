# Implementation Plan: Notas dentro do grupo

**Branch**: `008-group-invoices` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-group-invoices/spec.md`

## Summary

Move invoices ("notas") from the personal top-level area into each group and let members link a note to one expense of that group (1:1). The app adds `/grupos/[id]/notas` (list + upload) and `/grupos/[id]/notas/[notaId]` (detail + link), a "Notas" card on the group page, a "Nota" section on the expense page, and redirects the old `/notas` URLs to `/grupos`. All data and rules live in the backend, which must first ship the endpoints in [contracts/backend-api.md](contracts/backend-api.md) — they do not exist in the current swagger.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.3 (App Router, Server Components + Server Actions)

**Primary Dependencies**: none new (Tailwind 4 tokens, `server-only`)

**Storage**: N/A in the app; Kotta API (`api-kottagroups`, Go) owns invoices, expenses and the link

**Testing**: `node --test` for `lib/*.test.mjs`; Playwright e2e

**Target Platform**: Web (mobile-first), server rendered

**Project Type**: web app (frontend for an existing API)

**Performance Goals**: group page keeps its current parallel fetch; the notes card loads on its own and fails alone (as `ShoppingListsCard`)

**Constraints**: blocked on backend contract; no client JS beyond the existing `AutoRefresh` and upload form; official copy rules in `AGENTS.md` untouched

**Scale/Scope**: 2 new routes, 1 removed route tree, 2 edited pages, 1 card, 4 Server Actions; selector capped at 100 most recent expenses (R4)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Simplicity First | No new dependency; native `<select>` + Server Actions; redirects in `next.config.ts`; existing upload form and invoice helpers reused | PASS |
| II. Clean Code | English identifiers; group page (453 lines) not grown — notes go in a separate card component; new pure rules named (`linkableExpenses`, `invoiceDifferenceCents`) | PASS |
| III. Organized Structure | Routes under `app/(conta)/grupos/[id]/notas`; actions in existing `app/actions/invoices.ts`; rules in existing `lib/invoices.ts` | PASS |
| IV. Best Practices | Server Components by default; actions validate input and the API authorizes membership; `returnTo` through `lib/safe-next`; parallel fetches with `Promise.all`; design tokens only | PASS |

Post-design re-check: PASS — no violations, Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/008-group-invoices/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── backend-api.md   # proposed API the backend must ship
│   └── routes.md        # app routes and Server Actions
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
app/(conta)/
├── notas/                         # REMOVED (page.tsx, [id]/page.tsx)
├── grupos/[id]/
│   ├── page.tsx                   # add <GroupInvoicesCard>
│   └── notas/
│       ├── page.tsx               # NEW: list + upload (moved from /notas)
│       └── [notaId]/page.tsx      # NEW: detail + link/unlink/delete (moved from /notas/[id])
└── despesas/[id]/page.tsx         # add "Nota" section
app/actions/invoices.ts            # upload to group, link, unlink, delete
components/app/
├── group-invoices-card.tsx        # NEW: 3 recent notes + links
└── nav-items.ts                   # drop "Notas"
components/forms/
├── invoice-upload-form.tsx        # hidden groupId / optional expenseId
└── invoice-link-form.tsx          # NEW: <select> + submit (link) / unlink button
lib/
├── api/types.ts                   # ApiInvoice + ApiExpense new fields
├── api/kotta.ts                   # listGroupInvoicesPage
├── invoices.ts                    # derived rules (data-model.md)
└── invoices.test.mjs              # cases for the new rules
next.config.ts                     # /notas, /notas/:id → /grupos
e2e/notes-notifications.spec.ts    # group flow + link
```

**Structure Decision**: single Next.js app; follows the shopping-lists pattern (group card + nested routes).

## Complexity Tracking

None.
