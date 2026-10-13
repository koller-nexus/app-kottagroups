# Implementation Plan: Escanear NFC-e e marcar itens da lista encontrados na nota

**Branch**: `feature/004-receipt-scan-matching` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-receipt-scan-matching/spec.md`

## Summary

On the shopping list page, the user scans the NFC-e QR code (or types the access key, or sends a
compressed photo). The page polls the receipt status until the backend finishes, then each list
item renders as found / "Confere?" / not found, with one-tap Sim/Não for the uncertain ones and a
receipt summary card below the list. The backend (api-kottagroups 053, merged) does the reading
and matching; this feature is web UI, three server actions, typed API shapes, and pure helpers in
`lib/receipt.ts`. QR decoding uses the native `BarcodeDetector`, falling back to `jsqr` loaded on
demand, all inside a dynamically loaded client component.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.3 (App Router, Turbopack)

**Primary Dependencies**: existing `next`, `react`, `server-only`; **new** `jsqr@1.4.0` (QR decode
fallback for browsers without `BarcodeDetector`, loaded on demand — see research R2)

**Storage**: N/A (backend owns all data)

**Testing**: `node --test` via `pnpm test` (`lib/*.test.mjs`); new `lib/receipt.test.mjs`

**Target Platform**: mobile browsers first (Chrome Android, Safari iOS), desktop browsers second

**Project Type**: web application (front end only; API is a separate repo)

**Performance Goals**: list colored ≤ 30 s after scan with a healthy backend (SC-002); match
decision reflected ≤ 1 s (SC-003); no scanner code in the list page's initial load (SC-007)

**Constraints**: camera needs a secure context; photo ≤ 1600 px longest side; polling 2 s → 5 s,
stop at 120 s; color never the only signal; follow `DESIGN.md` (no saturated yellow)

**Scale/Scope**: 1 page changed, 5 small new components, 3 actions (1 changed, 2 new), 1 pure lib
module + test, 1 color token pair

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Simplicity | Reuses `isInvoicePending`, `invoiceErrorMessage`, `formatBRL`, `Price`, `failure`, `apiRequest`, the `useActionState` wrapper pattern, native `<dialog>`, `<details>`, `BarcodeDetector`, canvas. One action for Sim/Não (two submit buttons). `AutoRefresh` left as is. | Pass |
| I. Dependency gate | `jsqr` added: QR decoding is far over 20 lines and iOS Safari lacks `BarcodeDetector`. Justify in the PR. | Pass (justified) |
| II. Clean code | `shopping-forms.tsx` is already > 200 lines; match UI goes in a new `components/receipt/item-match.tsx` instead of growing it. Domain numbers are named constants (`MAX_PHOTO_SIDE_PX`, `RECEIPT_POLL_TIMEOUT_MS`, `ACCESS_KEY_LENGTH`). Identifiers in English, UI copy in Portuguese. | Pass |
| III. Structure | Receipt UI grouped in `components/receipt/`; rules in `lib/receipt.ts`; actions stay in `app/actions/shopping.ts`. No barrels. | Pass |
| IV. Best practices | Page stays a Server Component; `"use client"` only on capture, scanner, status, match line. Actions validate before calling the API; API enforces membership. List + receipt fetched in parallel. Tokens only (new `kotta-review*` added to `globals.css`/`theme.ts`/`DESIGN.md`). A11y: dialog focus, Esc, `role="status"`, icon + word per state, 44 px targets. Next 16 docs read: `lazy-loading.md`, `server-actions.md`. | Pass |
| IV. VERSION file | No `VERSION` file exists (known follow-up in the constitution). | N/A |
| V. Testable | Key/QR parsing, check digit, formatting, resize math, poll schedule, summary and extra-item derivation are pure and tested in `lib/receipt.test.mjs`. Camera and canvas code is thin and verified manually (quickstart). | Pass |

**Post-design re-check**: Pass. No violations, Complexity Tracking left empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-receipt-scan-matching/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-and-actions.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── (conta)/grupos/[id]/listas/[listId]/page.tsx   # changed: parallel receipt fetch, new layout
├── actions/shopping.ts                            # + submitReceiptCodeAction, decideMatchAction
└── globals.css                                    # + kotta-review-bg, kotta-review

components/
├── forms/shopping-forms.tsx                       # ShoppingItemRow takes match state; upload form compresses, images only
└── receipt/
    ├── receipt-capture.tsx                        # client: scan / photo / key
    ├── qr-scanner.tsx                             # client, next/dynamic ssr:false: <dialog> + camera
    ├── compress-photo.ts                          # client: canvas resize + JPEG encode
    ├── receipt-status.tsx                         # client: status text + backoff polling
    ├── receipt-summary.tsx                        # server: card + "Também na nota"
    └── item-match.tsx                             # client: state line + Sim/Não

lib/
├── api/types.ts                                   # match + receipt types (data-model.md)
├── api/kotta.ts                                   # + getReceiptOrNull
├── api/errors.ts                                  # + 3 error codes
├── receipt.ts                                     # pure rules (data-model.md table)
├── receipt.test.mjs
└── theme.ts                                       # + review tokens

DESIGN.md                                          # + review tokens row
```

**Structure Decision**: Single Next.js app, existing layout. New receipt UI lives together in
`components/receipt/`; everything else edits files that already own the concern.

## Delivery order

1. Types, `lib/receipt.ts` + tests, tokens, error messages (foundation).
2. US1: item rows + Sim/Não + summary line (testable against any list already processed by the
   backend).
3. US2: capture with scanner, `submitReceiptCodeAction`, status polling, new page layout.
4. US3: key entry + photo compression.
5. US4: summary card + "Também na nota".
6. Quickstart pass on a phone; `pnpm lint`, `pnpm test`, `pnpm build`.

## Complexity Tracking

No violations.
