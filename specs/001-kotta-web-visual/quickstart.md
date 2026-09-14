# Quickstart: Kotta Web Visual Landing

Validates the landing against [spec.md](./spec.md) and [contracts/ui-contract.md](./contracts/ui-contract.md).

## Prerequisites

- Node 20+
- `pnpm` (see `package.json` `packageManager`)
- Repo root: `app-kottagroups`

## Setup

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Automated checks

```bash
pnpm lint
pnpm test
```

`pnpm test` MUST run Node’s test runner against money formatting (`lib/money.test.mjs`). Expected: all tests pass.

```bash
pnpm build
```

Expected: production build succeeds.

## Visual scenarios

Use a narrow viewport (~375px) and a wide one (~1280px).

### P1 — Same home composition

1. Load `/`.
2. Confirm section order in [ui-contract.md](./contracts/ui-contract.md).
3. Confirm a centered phone-like column on desktop (not a wide admin grid).
4. Optional: compare with the Kotta mobile public home; same blocks within ~10 seconds.

### P2 — Store badges, no login

1. Header shows App Store and Play Store marks with **Em breve**.
2. Search the page for Entrar / Cadastrar — none.
3. Click each badge — URL stays on `/`.

### P3 — Demo only

1. Stats, settlements, and groups show demo content (not a login empty-state).
2. Click a group row — no authenticated screen.
3. No email/password fields.

## Edge checks

- ~320px width: brand and badges wrap; cards remain readable; no required horizontal scroll on the main column.
- Zoom 200%: labels still readable.
- If a badge graphic fails, store name + Em breve remain as text.

## Done

Landing matches the UI contract, lint/test/build pass, and P1–P3 hold at both widths.
