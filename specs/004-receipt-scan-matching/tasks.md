---

description: "Task list for 004-receipt-scan-matching"
---

# Tasks: Escanear NFC-e e marcar itens da lista encontrados na nota

**Input**: Design documents from `specs/004-receipt-scan-matching/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-and-actions.md, quickstart.md

**Tests**: Requested by the issue and SC-008: unit tests for QR/key parsing and the pure helpers in
`lib/receipt.test.mjs` (run by `pnpm test`). UI is verified with `quickstart.md`.

**Organization**: Tasks are grouped by user story so each story can be built and checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story from spec.md (US1–US4)
- Paths are from the repository root (single Next.js app).

---

## Phase 1: Setup

**Purpose**: Dependency and design tokens

- [X] T001 Add `jsqr@1.4.0` with `pnpm add jsqr@1.4.0` (updates `package.json` and `pnpm-lock.yaml`); it is only ever imported dynamically (research R2)
- [X] T002 [P] Add review tokens `--color-kotta-review-bg: #f3ecd8;` and `--color-kotta-review: #6b5317;` with a short comment to the `@theme inline` block in `app/globals.css`
- [X] T003 [P] Add `reviewBg: "#F3ECD8"` and `review: "#6B5317"` to `colors` in `lib/theme.ts`, matching the existing key style
- [X] T004 [P] Add rows for `kotta-review-bg` (`#F3ECD8` sand, background of "Confere?" rows) and `kotta-review` (`#6B5317`, text/icon on it, 6.2:1) to the color table in `DESIGN.md`, noting it is tonal and not a saturated yellow

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, pure rules, error messages, and data fetching every story uses

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Update `lib/api/types.ts` per data-model.md: add `ApiExtractionMethod = "ocr" | "qrcode"`, `ApiMatchStatus = "matched" | "needs_review" | "confirmed" | "rejected"`, `ApiItemMatch { id; status: Exclude<ApiMatchStatus, "rejected">; confidence }`, `match: ApiItemMatch | null` on `ApiShoppingItem`, `ApiReceiptFile`, `ApiReceiptSummary` (`invoiceId`, `status`, `extractionMethod` all nullable; `file: ApiReceiptFile | null`; `uploadedAt`) replacing `ApiReceipt` (set `ApiShoppingListDetail.receipt?: ApiReceiptSummary | null`), `ApiReceiptItem`, `ApiReceiptMatch` (`invoiceItem: ApiReceiptItem | null`), `ApiShoppingReceipt` (`establishment: { cnpj: string | null; name: string; uf: string | null } | null`, `issuedOn: string | null`, `totalCents`, `items`, `matches`, `errorMessage: string | null`), and `ApiReceiptAccepted`
- [X] T006 Update `lib/api/kotta.ts`: type `getReceipt` as `ApiShoppingReceipt` and add `getReceiptOrNull(listId)` that returns `null` when `getReceipt` throws an `ApiError` with status 404 and rethrows anything else
- [X] T007 Fix the remaining `ApiReceipt` users so the build compiles: `uploadReceiptAction` in `app/actions/shopping.ts` uses `apiRequest<ApiReceiptAccepted>`; `ReceiptPreview` in `app/(conta)/grupos/[id]/listas/[listId]/page.tsx` takes `ApiReceiptSummary` (an `ApiShoppingReceipt` from `getReceiptOrNull` also fits) and reads `contentType`/`sizeBytes`/`url` from `receipt.file` (render nothing for the file part when `file` is `null`)
- [X] T008 [P] Add to `friendlyMessage` in `lib/api/errors.ts`: `RECEIPT_ALREADY_IMPORTED` → "Essa nota já foi usada neste grupo.", `NFCE_UNSUPPORTED` → "Ainda não lemos notas desse estado. Envie uma foto da nota.", `NFCE_UNAVAILABLE` → "A leitura pelo QR code está fora do ar. Envie uma foto da nota."
- [X] T009 [P] Write `lib/receipt.test.mjs` (node:test + assert, same style as `lib/shopping.test.mjs`) covering: `accessKeyFromQrUrl` with a valid NFC-e URL (`?p=<44 digits>|2|1|1|<hash>`), a URL without `p`, non-URL text; `normalizeAccessKey` with spaces/dots, wrong length, wrong check digit, model 55; `accessKeyProblem` messages; `formatAccessKey` blocks of 4 and max 44 digits; `fitWithin` landscape, portrait, already-small (never upscales); `nextPollDelay` at 0, growth, and 5000 cap; `itemMatchState` for all four states; `matchSummary` + `matchSummaryLabel` (singular "item", "· N para conferir" omitted when 0); `extraInvoiceItems`; `invoiceLineLabel` ("2x LEITE INTEG 1L · R$ 10,98"); `extractionMethodLabel`. Build valid test keys with a helper that appends the mod-11 digit
- [X] T010 Implement `lib/receipt.ts` so T009 passes: constants `ACCESS_KEY_LENGTH = 44`, `NFCE_MODEL = "65"`, `MAX_PHOTO_SIDE_PX = 1600`, `PHOTO_JPEG_QUALITY = 0.8`, `RECEIPT_POLL_FIRST_MS = 2000`, `RECEIPT_POLL_MAX_MS = 5000`, `RECEIPT_POLL_TIMEOUT_MS = 120000`; functions exactly as the data-model.md table: `accessKeyFromQrUrl`, `normalizeAccessKey` (digits only; 44 long; `digits.slice(20, 22) === "65"`; mod-11 check digit with weights 2–9 from the right, result 0 when remainder < 2), `accessKeyProblem` ("A chave tem 44 números." / "Confira a chave: algum número não bate."), `formatAccessKey`, `fitWithin(width, height, max)`, `nextPollDelay(attempt) = min(2000 × 1.25^attempt, 5000)`, `isReceiptProcessed(status)` (done or needs_review), `itemMatchState(item, processed)` → `"found" | "review" | "missing" | "none"`, `matchSummary`, `matchSummaryLabel`, `extraInvoiceItems`, `invoiceLineLabel` (quantity via `toLocaleString("pt-BR")` + `formatBRL` from `lib/money.ts`), `extractionMethodLabel`. Reuse `isInvoicePending` from `lib/invoices.ts` rather than redefining it
- [X] T011 Add `lib/receipt.test.mjs` to the test run if the existing `lib/*.test.mjs` glob in `package.json` does not already pick it up, then run `pnpm test`

**Checkpoint**: `pnpm test` green; types compile; stories can start

---

## Phase 3: User Story 1 - Ver os itens da lista marcados conforme a nota (Priority: P1) 🎯 MVP

**Goal**: Each item shows found / "Confere?" / not found with icon + word + color; Sim/Não resolve a review in one tap; summary line on top.

**Independent Test**: Open a list the backend already processed (status done/needs_review) with rows in all three states; check each row's icon, word and background; tap Sim and Não and see the row change without a full reload (quickstart #5–7).

- [X] T012 [US1] Add `decideMatchAction(prev: FormState, formData: FormData)` to `app/actions/shopping.ts`: read `matchId` and `status`; if `matchId` is empty or `status` is not `"confirmed"` or `"rejected"` return `{ error: "Não foi possível conferir este item." }` without calling the API; otherwise `PATCH /shopping-item-matches/{matchId}` with `{ status }`, `failure()` on `ApiError`, `revalidatePath("/", "layout")`, return `{ ok: true }`
- [X] T013 [P] [US1] Create `components/receipt/item-match.tsx` (`"use client"`): `ItemMatchLine({ state, invoiceItem })` renders icon + word per the contract row table — found: check icon + "Encontrado" + `invoiceLineLabel`; review: question-mark icon + "Confere?" + invoice line; missing: dash icon + "Não encontrado"; none: nothing. Icons are inline SVG with `aria-hidden`, text in `kotta-review` for review and `kotta-primary` for found. `MatchDecision({ matchId, itemName })` is a `<form>` using `useActionState(decideMatchAction)` with a hidden `matchId` and two submit buttons `name="status"` values `confirmed` ("Sim") and `rejected` ("Não"), `aria-label`s that include the item name, min 44 px targets, disabled while pending; shows the action error below the buttons
- [X] T014 [US1] Update `ShoppingItemRow` in `components/forms/shopping-forms.tsx`: new props `matchState: "found" | "review" | "missing" | "none"` and `invoiceItem?: ApiReceiptItem | null`; row background `bg-kotta-light-green` for found, `bg-kotta-review-bg` for review, unchanged otherwise; replace the "Quantidade: N" line with `<ItemMatchLine>` when state is not `none` (keep quantity visible next to it); render `<MatchDecision>` for review when not `readOnly`; manual checkbox, edit and remove keep working for every state
- [X] T015 [US1] Update `app/(conta)/grupos/[id]/listas/[listId]/page.tsx`: fetch `getReceiptOrNull(listId)` in the same `Promise.all` as group and list and use that `receipt` for every receipt branch on the page (stop reading `list.receipt`); compute `processed = isReceiptProcessed(receipt?.status)`; build a `Map` from `receipt.matches` by `shoppingItemId` to `invoiceItem`; pass `matchState={itemMatchState(item, processed)}` and `invoiceItem` to each `ShoppingItemRow`; when processed, add the `matchSummaryLabel(matchSummary(list.items))` line under the existing progress text in the page description

**Checkpoint**: US1 works on any list already processed by the backend

---

## Phase 4: User Story 2 - Escanear o QR code da nota e acompanhar o processamento (Priority: P1)

**Goal**: Scan → auto-send → "Lendo sua nota…" with backoff polling → colored list; clear errors with a way forward.

**Independent Test**: On a phone, open a list with no receipt, tap Escanear QR code, scan a real NFC-e, and see the list color itself without typing (quickstart #1–4, #11–12).

- [X] T016 [US2] Add `submitReceiptCodeAction(prev: FormState, formData: FormData)` to `app/actions/shopping.ts`: read `listId`, `qrUrl`, `accessKey`; require `listId` and exactly one of the two; for `qrUrl` require `accessKeyFromQrUrl(qrUrl)` non-null else `{ error: "Esse QR não parece de nota fiscal." }`; for `accessKey` return `accessKeyProblem` if invalid and send the normalized 44 digits; `POST /shopping-lists/{listId}/receipt` with JSON `{ qrUrl }` or `{ accessKey }` typed `ApiReceiptAccepted`; `failure()` on `ApiError`; `revalidatePath("/", "layout")`; return `{ ok: true }`
- [X] T017 [P] [US2] Create `components/receipt/qr-scanner.tsx` (`"use client"`, default export `QrScanner({ onDetected, onUnavailable, onClose })`): native `<dialog>` opened with `showModal()` on mount, title "Escanear QR code da nota", visible close button, `cancel` event (Esc) → `onClose`; `getUserMedia({ video: { facingMode: "environment" }, audio: false })` into a muted `playsInline` `<video>`; on `NotAllowedError`/`NotFoundError`/missing `navigator.mediaDevices` call `onUnavailable()`; decode ~every 250 ms with `BarcodeDetector` when `"BarcodeDetector" in window` and `getSupportedFormats()` includes `qr_code`, else `await import("jsqr")` once and run it on canvas `ImageData` downscaled to 640 px wide; on decoded text call `accessKeyFromQrUrl` — valid → stop and `onDetected(text)`, invalid → show "Esse QR não parece de nota fiscal" in a `role="status"` line and keep scanning (ignore repeats of the same text); stop all tracks and cancel the loop on unmount, close, and `visibilitychange` to hidden; respect `prefers-reduced-motion` for any scan-frame animation
- [X] T018 [P] [US2] Create `components/receipt/receipt-status.tsx` (`"use client"`, `ReceiptStatus({ status })`): `role="status"` text — queued/processing "Lendo sua nota…", needs_review "Confira alguns itens", done renders nothing; while `isInvoicePending(status)` schedule `router.refresh()` with `setTimeout(nextPollDelay(attempt))`, stopping once elapsed ≥ `RECEIPT_POLL_TIMEOUT_MS` and then showing "Ainda estamos lendo sua nota." with a **Verificar de novo** button that calls `router.refresh()` and restarts the schedule; clear timers on unmount and when status leaves pending
- [X] T019 [US2] Create `components/receipt/receipt-capture.tsx` (`"use client"`, `ReceiptCapture({ listId, failedMessage })`): show `failedMessage` (if any) as an error line; primary button labelled **Escanear QR code**, or **Tentar de novo** when `failedMessage` is set (FR-011; **Enviar foto** stays as the secondary action in both cases), that mounts `const QrScanner = dynamic(() => import("./qr-scanner"), { ssr: false })` (declared at module top level, rendered only when open); `onDetected` submits `submitReceiptCodeAction` with `listId` + `qrUrl` via `useActionState` inside `startTransition` and shows "Enviando nota…" while pending and the action error otherwise; `onUnavailable` closes the scanner and opens the key disclosure with the note "Não conseguimos usar a câmera. Digite a chave ou envie uma foto."; secondary area renders the existing `ReceiptUploadForm` (US3 adds compression) and a `<details>` "Digitar a chave de acesso" placeholder container that US3 fills
- [X] T020 [US2] Restructure `app/(conta)/grupos/[id]/listas/[listId]/page.tsx` per research R10 and the status table in contracts: remove the side "Nota fiscal" section; at the top of the main column (above "Itens"), when not `readOnly`, render `ReceiptCapture` if there is no receipt or status is `failed` (pass `invoiceErrorMessage(receipt.errorMessage ?? undefined)` as `failedMessage` when failed), `ReceiptStatus` when status is queued/processing/needs_review; keep the legacy branch (status `null`) showing `ReceiptPreview` + the existing "Remover nota fiscal" form; side column keeps only the name form and "Excluir lista"; DOM order equals visual order

**Checkpoint**: US1 + US2 deliver the full scan-to-colored-list flow

---

## Phase 5: User Story 3 - Enviar foto ou digitar a chave quando o QR não dá (Priority: P2)

**Goal**: Key entry masked in blocks of 4; photos compressed to ≤ 1600 px JPEG before upload.

**Independent Test**: Deny camera, type a valid key and see processing start; on another list send a large photo and confirm in DevTools the upload is smaller and ≤ 1600 px (quickstart #8–9).

- [X] T021 [P] [US3] Create `components/receipt/compress-photo.ts` (client-only module, no `"use client"` needed as it exports no component): `compressPhoto(file: File): Promise<File>` — `createImageBitmap(file)`, size via `fitWithin(bitmap.width, bitmap.height, MAX_PHOTO_SIDE_PX)`, draw on a canvas, `canvas.toBlob(..., "image/jpeg", PHOTO_JPEG_QUALITY)`, return a `File` named `nota-fiscal.jpg`; if decoding or encoding fails, return the original file (the caller's `validateReceipt` still enforces 10 MB)
- [X] T022 [US3] Update `ReceiptUploadForm` in `components/forms/shopping-forms.tsx`: label "Enviar foto da nota", `accept="image/*"` (no PDF), hint "Foto da nota inteira, bem iluminada."; wrap the action in the `useActionState` reducer like `ShoppingItemRow` does: replace `file` in the `FormData` with `await compressPhoto(file)` before calling `uploadReceiptAction`; drop the `replacing` prop and its "Trocar" copy (capture is only shown without an active receipt); show "Enviando foto…" while pending
- [X] T023 [US3] Add the key entry to `components/receipt/receipt-capture.tsx` inside the "Digitar a chave de acesso" `<details>` (open it programmatically from `onUnavailable`): visible label "Chave de acesso (44 números)", controlled input with `inputMode="numeric"`, `autoComplete="off"`, `maxLength={54}`, value shown through `formatAccessKey`, hint/error from `accessKeyProblem` shown only after 44 digits or on blur, submit **Enviar chave** enabled only when `normalizeAccessKey` passes; submits `submitReceiptCodeAction` with `listId` + `accessKey`

**Checkpoint**: No user is blocked by camera or QR problems

---

## Phase 6: User Story 4 - Ver o resumo da nota (Priority: P3)

**Goal**: Card below the list with establishment, date, total, method, and collapsed extra items.

**Independent Test**: Open a processed list; check the card fields and the "Também na nota (N)" count; it is hidden when N = 0 (quickstart #10).

- [X] T024 [US4] Create `components/receipt/receipt-summary.tsx` (server component, `ReceiptSummary({ receipt, listId, readOnly })`): white card (`rounded-card border-kotta-border bg-kotta-surface`) with `establishment?.name` (fallback "Estabelecimento não identificado"), `issuedOn` via `formatShortDate` from `lib/dates.ts` (omit when null), total with `<Price cents={receipt.totalCents} />`, `extractionMethodLabel(receipt.extractionMethod)`; `<details>` "Também na nota (N)" listing `invoiceLineLabel` for each of `extraInvoiceItems(receipt)`, omitted when N = 0; when `!readOnly`, the existing `deleteReceiptAction` form with `ConfirmSubmit` "Remover nota fiscal" (message "Remover a nota fiscal? As marcações dos itens também saem.")
- [X] T025 [US4] Render `ReceiptSummary` below the item list (and the add-item form) in `app/(conta)/grupos/[id]/listas/[listId]/page.tsx` when `isReceiptProcessed(receipt?.status)`; add the total via `<Price>` next to the summary line from T015 when status is `done`

**Checkpoint**: All four stories work independently

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T026 [P] Review every new component in `components/receipt/` and the edited `components/forms/shopping-forms.tsx` for the constitution limits (components ≤ 200 lines, functions ≤ 40, nesting ≤ 3, no raw hex in components, English identifiers, Portuguese copy) and `"use client"` only where state/effects/browser APIs are used; split if over
- [X] T027 Run the `package.json` scripts `pnpm lint`, `pnpm test`, `pnpm build`; fix all issues; confirm in the build output that `qr-scanner` and `jsqr` are separate chunks not loaded by the list page initially (SC-007); write the PR description with the `jsqr` justification required by constitution I (replaces nothing; iOS Safari lacks `BarcodeDetector`; QR decoding is far over 20 lines; ~46 KB gzipped, loaded only on demand)
- [ ] T028 Walk `specs/004-receipt-scan-matching/quickstart.md` scenarios 1–13 on a phone viewport (and a real phone for the camera) and note any failure as a fix in the relevant file
- [X] T029 Update the copy in the spec assumptions of `specs/004-receipt-scan-matching/spec.md` that says the backend contract is unpublished: point to api-kottagroups 053 as merged

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none
- **Foundational (Phase 2)**: after Setup (T005 before T006/T007; T009 before T010)
- **US1 (Phase 3)**: after Foundational
- **US2 (Phase 4)**: after Foundational; T020 edits the same page as T015, so run after US1 when done by one person
- **US3 (Phase 5)**: after US2 (T022/T023 extend components created in T019)
- **US4 (Phase 6)**: after Foundational; T025 edits the page, so after T020
- **Polish (Phase 7)**: after the stories you ship

### User Story Dependencies

- US1: independent (works on lists processed through any client)
- US2: independent of US1 functionally; shares the page file
- US3: depends on US2's `ReceiptCapture`
- US4: independent functionally; shares the page file

### Parallel Opportunities

- T002, T003, T004 together; T008 and T009 together after T005
- US1: T013 alongside T012
- US2: T017 and T018 together (separate files), then T019, T020
- US3: T021 while US2's T020 is in progress
- US4: T024 can be written any time after Phase 2

## Parallel Example: User Story 2

```text
Task: "Create components/receipt/qr-scanner.tsx (T017)"
Task: "Create components/receipt/receipt-status.tsx (T018)"
# then
Task: "Create components/receipt/receipt-capture.tsx (T019)"
Task: "Restructure the list page (T020)"
```

## Implementation Strategy

### MVP First

1. Phases 1–2
2. Phase 3 (US1) → validate on a list processed by the backend or the mobile app
3. Phase 4 (US2) → the scan flow; this is the shippable MVP for "no mercado com o celular"

### Incremental Delivery

US1 → US2 (MVP) → US3 (fallbacks) → US4 (summary) → Polish. Each checkpoint leaves the page working.
