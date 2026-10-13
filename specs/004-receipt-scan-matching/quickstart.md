# Quickstart: validate 004-receipt-scan-matching

## Prerequisites

- Backend with 053 running (`api-kottagroups`, local or staging) and `NFCE_PROVIDER` configured
  for at least one state in `NFCE_ENABLED_UFS`. Without it, the QR path returns 503 and only the
  photo path can be checked.
- `API_ORIGIN` pointing at that backend; a logged-in user in a group with a shopping list of 5+
  items that match a real NFC-e you have on paper.
- A phone on the same network (camera needs HTTPS or `localhost`; use the deployed preview or a
  tunnel for the phone).

## Automated checks

```bash
pnpm lint
pnpm test     # includes lib/receipt.test.mjs
pnpm build    # scanner and jsqr must be in a separate chunk (see SC-007 below)
```

`lib/receipt.test.mjs` must cover: QR URL with a valid key, URL without `p`, key with a wrong
check digit, model 55 key, key with spaces/dots, `formatAccessKey` grouping, `fitWithin`
(landscape, portrait, already small), `nextPollDelay` cap, `matchSummaryLabel` (0 to review,
singular), `extraInvoiceItems`.

## Manual scenarios (phone viewport first)

| # | Story | Steps | Expected |
|---|---|---|---|
| 1 | US2 | Open a list with no receipt, tap **Escanear QR code**, point at the NFC-e | Dialog closes by itself, "Lendo sua nota…" appears, then the items get colored without reloading |
| 2 | US2 | Scan any non-NFC-e QR (e.g. a URL) | "Esse QR não parece de nota fiscal", camera stays open, nothing sent |
| 3 | US2 | Open the scanner, press Esc / tap close / switch tabs | Dialog closes, camera indicator turns off |
| 4 | US2 | Scan the same NFC-e on another list in the same group | "Essa nota já foi usada neste grupo." |
| 5 | US1 | On a processed list, tap **Sim** on a "Confere?" row | Row turns "Encontrado" within ~1 s; summary count updates |
| 6 | US1 | Tap **Não** on a "Confere?" row | Row turns "Não encontrado", item no longer counted as comprado |
| 7 | US1 | Toggle the checkbox of a "Não encontrado" row | Works as before |
| 8 | US3 | Deny camera permission, tap **Escanear QR code** | Key field opens; typing shows blocks of 4; submit enabled only at 44 valid digits |
| 9 | US3 | **Enviar foto** with a 4000 px photo | In DevTools Network the uploaded file is ≤ 1600 px and smaller than the original; processing starts |
| 10 | US4 | Processed list | Card shows establishment, date, total in R$, "via QR code"/"via foto"; "Também na nota (N)" collapsed, hidden when N = 0 |
| 11 | Edge | Backend stuck in `processing` > 2 min | Polling stops, "Ainda estamos lendo sua nota." + **Verificar de novo** |
| 12 | Edge | Receipt `failed` | Reason in Portuguese + capture options available again |
| 13 | A11y | Keyboard only, then a screen reader | All actions reachable with visible focus; status changes announced; set the OS to grayscale and every row state is still identifiable |

## SC-007 bundle check

After `pnpm build`, open the list page with the Network tab: no request for the scanner chunk
until **Escanear QR code** is tapped; the `jsqr` chunk loads only on browsers without
`BarcodeDetector` (Safari).
