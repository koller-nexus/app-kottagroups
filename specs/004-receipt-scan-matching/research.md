# Research: 004-receipt-scan-matching

All decisions below resolve the open points the spec and issue #8 left for planning. No
`NEEDS CLARIFICATION` remains.

## R1. Backend contract

- **Decision**: Build against the merged backend contract in
  `api-kottagroups/specs/053-nfce-shopping-match/contracts/http-api.md` (also `api/openapi.yaml`),
  not the snake_case names in issue #8.
- **Rationale**: api#156 is closed and shipped. The real API uses camelCase (`qrUrl`, `accessKey`,
  `extractionMethod`, `totalCents`, `invoiceItem`), returns `202 { invoiceId, status,
  extractionMethod }` from `POST /shopping-lists/{id}/receipt`, embeds a receipt summary in
  `GET /shopping-lists/{id}`, and returns `item: { id, completed }` from
  `PATCH /shopping-item-matches/{id}`.
- **Differences from the issue that change the front**:
  - Error codes: `409 RECEIPT_ALREADY_IMPORTED`, `422 NFCE_UNSUPPORTED` (state not enabled),
    `503 NFCE_UNAVAILABLE` (provider off), `400 VALIDATION_FAILED` (bad key/URL). All need
    Portuguese messages.
  - `matches` in `GET .../receipt` omits rejected rows; `item.match` is `null` once rejected.
  - Legacy and PDF receipts have `invoiceId`, `status`, `extractionMethod` all `null`.
  - The backend validates `qrUrl` host (`gov.br`), check digit, model 65, and UF. The front
    only pre-checks shape and check digit to give a fast, specific message.
- **Alternatives considered**: mocking the contract from the issue text — rejected, the real
  API exists.

## R2. QR decoding in the browser

- **Decision**: Use the native `BarcodeDetector` when it exists and lists `qr_code` in
  `getSupportedFormats()`. Otherwise load `jsqr@1.4.0` with a dynamic `import()` at the moment
  the scanner starts. Frames come from `getUserMedia({ video: { facingMode: "environment" } })`
  drawn to a canvas (downscaled to ~640 px wide) about 4 times per second.
- **Rationale**: `BarcodeDetector` ships in Chrome/Edge on Android (most Brazilian users) at zero
  bundle cost, but not in Safari on iOS, so a fallback is required. `jsqr` is ~130 KB minified (~46 KB gzipped, measured in the build),
  dependency-free, pure JS, MIT, and decodes a single QR from `ImageData`, which is all we need.
  QR decoding is far beyond the constitution's 20-line threshold, so the dependency is justified
  (record this in the PR description).
- **Alternatives considered**:
  - `@zxing/browser` / `@zxing/library`: multi-format, ~4x larger, we only read QR.
  - `barcode-detector` polyfill (zxing-wasm): ~1 MB wasm download on iOS.
  - Native only: leaves iOS users with photo/key only — too common a case in a market.

## R3. Loading the scanner on demand

- **Decision**: The scanner is its own client component, rendered through
  `next/dynamic(() => import("./qr-scanner"), { ssr: false })` from the capture component, and
  only mounted after the user taps **Escanear QR code**. `jsqr` is a second, nested `import()`
  inside the scanner, reached only when `BarcodeDetector` is missing.
- **Rationale**: `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` (Next 16):
  `ssr: false` is allowed only in Client Components, and a conditionally rendered dynamic
  component is fetched on first render. This keeps camera code and `jsqr` out of the list page's
  initial bundle (FR-007, SC-007).
- **Alternatives considered**: a static import with a client-only guard — puts everything in the
  first load.

## R4. Scanner UI, closing, and camera release

- **Decision**: Render the scanner in a native `<dialog>` opened with `showModal()`. Close on the
  close button, on the dialog's `cancel` event (Esc), on a successful read, and when the page
  becomes hidden (`visibilitychange`). Every close path stops all `MediaStreamTrack`s.
- **Rationale**: `<dialog>` gives Esc handling, focus containment, and a backdrop for free
  (platform feature first). Stopping tracks is what turns the camera light off (FR-004, edge case
  "troca de aba").
- **Invalid QR**: show "Esse QR não parece de nota fiscal" inside the dialog, keep scanning, and
  ignore repeats of the same decoded text so the message does not flicker.

## R5. Validating the QR and the access key

- **Decision**: Pure functions in `lib/receipt.ts`:
  - `accessKeyFromQrUrl(text)`: parse with `URL`, read `p`, take the part before the first `|`,
    accept only if it normalizes to a valid key.
  - `normalizeAccessKey(raw)`: strip non-digits; valid when 44 digits, model (`digits[20..21]`)
    is `65`, and the mod-11 check digit matches. Returns the digits or `null`.
  - `accessKeyProblem(raw)`: the Portuguese message for the key field (length vs. check digit).
  - `formatAccessKey(raw)`: digits grouped in blocks of 4 for the masked input.
- **Rationale**: Same rules as the backend, fast feedback, and the issue requires unit tests for
  these (`lib/receipt.test.mjs`, picked up by the existing `pnpm test` glob). The mod-11 check is
  ~10 lines.
- **Alternatives considered**: length-only check — lets typos reach the API and come back as a
  generic `VALIDATION_FAILED`.

## R6. Photo compression

- **Decision**: Before the upload action runs, the client decodes the picked image with
  `createImageBitmap`, draws it to a canvas at most 1600 px on the longest side, and re-encodes
  `image/jpeg` at quality 0.8 (`canvas.toBlob`). The resize math is a pure function in
  `lib/receipt.ts` (`fitWithin`) and tested. If decoding fails (e.g. a format the browser cannot
  decode), the original file is sent if it passes the existing 10 MB check, so the user is never
  blocked. The photo input accepts images only (`image/*`); PDF is no longer offered because the
  backend stores PDFs without reading them, which would be a dead end in this flow.
- **Rationale**: Web platform only, no dependency (FR-006, SC-004). Wrapping the existing
  `uploadReceiptAction` call inside the client `useActionState` reducer follows the pattern
  `ShoppingItemRow` already uses.
- **Alternatives considered**: `browser-image-compression` — a dependency for ~25 lines of canvas
  code.

## R7. Polling the processing status

- **Decision**: A small client component, `ReceiptStatus`, receives the receipt status from the
  server page. While the status is `queued`/`processing` (reuse `isInvoicePending` from
  `lib/invoices.ts`) it calls `router.refresh()` on a schedule from `nextPollDelay(attempt)`
  (2 s, growing ×1.25 per attempt, capped at 5 s) and stops after `RECEIPT_POLL_TIMEOUT_MS`
  (120 s). After the timeout it shows "Ainda estamos lendo sua nota." with **Verificar de novo**,
  which restarts the schedule. The status text sits in a `role="status"` (`aria-live="polite"`)
  region.
- **Rationale**: `router.refresh()` re-runs the server page, which already fetches the list and
  the receipt, so the item colors appear as soon as the status leaves processing with no client
  data fetching (FR-008–FR-010). Same mechanism as `components/app/auto-refresh.tsx` on `/notas`;
  that component stays untouched because it has no backoff or timeout and `/notas` does not need
  them.
- **Alternatives considered**: client `fetch` of `GET .../receipt` plus a separate refresh — two
  fetch paths for the same data; SSE — out of scope.

## R8. Confirming and rejecting a match

- **Decision**: One server action, `decideMatchAction`, bound to a form with two submit buttons
  (`name="status"`, values `confirmed` and `rejected`). It validates the status, calls
  `PATCH /shopping-item-matches/{id}`, then `revalidatePath("/", "layout")` like every other
  shopping action. The buttons are disabled while pending (`useFormStatus`), which blocks double
  taps. Errors come back through `useActionState` and show under the row; the row keeps its
  previous state.
- **Rationale**: Native form semantics, no client state machine, and the re-render after a server
  action updates the row without a full reload (FR-015, SC-003). The PATCH response could patch
  the row locally, but the revalidation already returns the fresh list in the same round trip.
- **Alternatives considered**: two actions (`confirm…`/`reject…`) — duplicate code;
  `useOptimistic` — not needed to meet 1 s.

## R9. Review color token

- **Decision**: Add `kotta-review-bg` `#F3ECD8` (a pale sand) and `kotta-review` `#6B5317` (text
  and icon on it) to `app/globals.css`, `lib/theme.ts`, and `DESIGN.md`. Found rows use the
  existing `kotta-light-green`; not-found rows keep the white surface with `kotta-muted` text.
- **Rationale**: The mobile design system forbids saturated yellow ("no yellow… second strong
  hue"). A desaturated tonal background, like the existing `kotta-danger-bg` sand rose, reads as
  "attention" without breaking the palette. `#6B5317` on `#F3ECD8` is 6.2:1 contrast
  (WCAG AA). Color is never the only signal: each state has an icon and a word (FR-013).
- **Alternatives considered**: the name `kotta-warning-bg` from the issue — renamed because it
  marks "confira", not a warning or error.

## R10. Page layout

- **Decision**: On the list page, the receipt capture/status block moves from the side column to
  the top of the main column (above the items), because the main case is a phone where the side
  column renders below the list. The receipt summary card and "Também na nota (N)" go below the
  item list (spec US4). "Remover nota fiscal" moves into the summary card. The side column keeps
  the list name and "Excluir lista".
- **Capture visibility**: shown when the list has no receipt or the receipt `failed`. While
  processing, the status block replaces it. When done/needs_review, the summary card is shown and
  replacing a receipt means removing it first (spec assumption: one active receipt per list).
  Legacy/PDF receipts (status `null`) keep today's file preview plus the remove link.
- **Rationale**: Thumb reach on mobile, DOM order equals visual order (no CSS reordering).

## R11. Fetching the receipt

- **Decision**: The list page fetches `getShoppingList` and `getReceiptOrNull` in parallel
  (`Promise.all`). `getReceiptOrNull` wraps the existing cached `getReceipt` and maps a 404 to
  `null`.
- **Rationale**: Constitution IV (no waterfalls). The embedded summary in the list response
  carries status but not items or matches.
