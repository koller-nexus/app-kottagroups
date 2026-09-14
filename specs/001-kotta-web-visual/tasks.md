---
description: "Task list for Kotta web visual landing"
---

# Tasks: Kotta Web Visual Landing

**Input**: Design documents from `/specs/001-kotta-web-visual/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md

**Tests**: Spec does not require TDD. Plan requires `node:test` for `formatBRL` only — included in Phase 2, not as failing-first contract tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Existing Next.js App Router app at repository root (`app/`, `components/landing/`, `lib/`). Do not add `frontend/` or `backend/`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project folders and versioning for this feature (repo already has Next.js 16 + pnpm)

- [x] T001 Create `components/landing/` directory for landing presentational pieces
- [x] T002 Write `VERSION` with `0.2.0` (constitution: introduce VERSION on first product UI)
- [x] T003 Add `"test": "node --test lib/money.test.mjs"` to `package.json` scripts (keep existing `dev`/`build`/`lint`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tokens, fonts, money helper, and frozen demo snapshot all stories use

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Replace scaffold colors and remove `prefers-color-scheme: dark` inversion in `app/globals.css`; add Kotta tokens primary `#1a5c38`, background `#f7f9f8`, surface `#FFFFFF`, text `#3d3d3d` / `#6B7280`, border `#d8e6df`, danger `#C93A3A`, radius card 24px / control 12px / pill 9999px, and Tailwind font CSS variables for display/body/mono
- [x] T005 [P] Update `app/layout.tsx`: `lang="pt-BR"`, metadata for Kotta (not Create Next App), load Playfair Display / DM Sans / DM Mono via `next/font/google` per `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`, drop Geist
- [x] T006 [P] Implement `formatBRL` (integer cents → Brazilian real string) in `lib/money.ts`
- [x] T007 Add `node:test` cases in `lib/money.test.mjs` covering 0, positive cents (e.g. 32050 → includes `320,50`), and negative cents
- [x] T008 Create frozen `LandingSnapshot` in `lib/demo-landing.ts` with: `tagline` PT-BR; `balances` where `netCents` is signed, `receivesCents` ≥ 0, `owesCents` ≥ 0, `groupCount === groups.length`; `monthSpend` with `previousMonthCents` ≥ 0 and `currentMonthCents` ≥ 0; `settlements` 0–3 items each with `id`, `counterpartName`, `amountCents` > 0, `direction` `"receive"` \| `"pay"`, `status` `"pending"` \| `"paid"`; `groups` ≥ 1 each with `id`, non-empty `name`, emoji, `memberCount` ≥ 1, signed `netCents`; familiar demo names (Apartamento, Viagem pra Praia, Churrasco de Domingo); no `href` on store config

**Checkpoint**: Foundation ready — `/` can be composed from tokens + snapshot

---

## Phase 3: User Story 1 - Ver a home com o mesmo layout do Kotta (Priority: P1) 🎯 MVP

**Goal**: Route `/` shows the public Kotta dashboard composition (brand, tagline, four stats, month bars, settlements, groups) in a phone-width column

**Independent Test**: Open `http://localhost:3000` and confirm section order in `specs/001-kotta-web-visual/contracts/ui-contract.md` (header brand, tagline, `SEU SALDO` / `VOCÊ RECEBE` / `VOCÊ DEVE` / `GRUPOS`, `GASTOS DOS GRUPOS`, `ÚLTIMAS QUITAÇÕES`, `SEUS GRUPOS`). Desktop stays a centered ~430px column. Scaffold Next/Vercel CTAs are gone.

### Implementation for User Story 1

- [x] T009 [P] [US1] Create `components/landing/stat-card.tsx` (uppercase label, value, caption) for the four-card grid
- [x] T010 [P] [US1] Create `components/landing/month-spend.tsx` that derives bar widths as each month value over `max(previous, current, 1)` (do not store percentages)
- [x] T011 [P] [US1] Create `components/landing/settlement-row.tsx` for `direction` receive/pay sentences and `status` labels `pendente` / `pago` with Kotta green/red
- [x] T012 [P] [US1] Create `components/landing/balance-chip.tsx` from signed `netCents`
- [x] T013 [P] [US1] Create `components/landing/group-row.tsx` showing emoji, name, `N membro` / `N membros`, and `balance-chip.tsx`
- [x] T014 [US1] Replace scaffold `app/page.tsx` with landing composition from `lib/demo-landing.ts`: header with brand **Kotta** (badges optional/empty until US2), tagline, stats grid with exact labels `SEU SALDO`, `VOCÊ RECEBE`, `VOCÊ DEVE`, `GRUPOS` (absolute `netCents` plus a receber/a pagar caption from sign), month block, settlements, groups; max-width ~430px centered; no `Entrar`/`Cadastrar`

**Checkpoint**: User Story 1 is a demoable MVP without store badges

---

## Phase 4: User Story 2 - Descobrir que o app nas lojas ainda não chegou (Priority: P2)

**Goal**: Header shows App Store and Play Store marks with **Em breve** instead of login CTAs; badges do not navigate

**Independent Test**: Top of `/` shows both store badges + **Em breve**; page has no Entrar/Cadastrar; clicking badges keeps the URL on `/`

### Implementation for User Story 2

- [x] T015 [US2] Create `components/landing/store-badge.tsx` for `store` `"app-store"` \| `"play-store"`: inline SVG (or equivalent), visible **Em breve**, accessible name “App Store, em breve” / “Google Play, em breve”; `href` MUST be absent; use `<button type="button">` (or non-navigating control) so click stays on `/`
- [x] T016 [US2] Place both badges at the header end in `app/page.tsx` (wrap with brand on narrow widths); confirm no login buttons remain

**Checkpoint**: User Stories 1 and 2 both work on `/`

---

## Phase 5: User Story 3 - Explorar o visual sem criar sessão (Priority: P3)

**Goal**: Demo content only; no auth forms, no authenticated routes, group rows are not navigation

**Independent Test**: No email/password fields; clicking a group does not open tabs/detail; two visitors would see the same snapshot (static module)

### Implementation for User Story 3

- [x] T017 [US3] Ensure `components/landing/group-row.tsx` is not a link (`<a>` / `href` / `router.push` forbidden); rows are display-only
- [x] T018 [US3] Confirm `app/` has no auth/group/profile feature routes; `app/page.tsx` has no credential form and no scaffold external CTAs

**Checkpoint**: All three stories independently hold on a single static `/`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Product copy, quality gates, quickstart sign-off

- [x] T019 [P] Update `README.md` so getting started describes the Kotta visual landing (not the create-next-app template)
- [x] T020 Run `pnpm lint`, `pnpm test`, and `pnpm build`; fix failures in touched files
- [x] T021 Walk `specs/001-kotta-web-visual/quickstart.md` at ~375px and ~1280px (section order, badges, no horizontal scroll on the main column)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–5)**: Depend on Foundational; implement P1 → P2 → P3 (same `app/page.tsx` header, so sequential on that file)
- **Polish (Phase 6)**: After desired stories

### User Story Dependencies

- **User Story 1 (P1)**: After Phase 2 only — MVP
- **User Story 2 (P2)**: After US1 recommended (shares `app/page.tsx` header); badges component can be built in parallel with US1 components
- **User Story 3 (P3)**: Tightens US1 group rows and routing; do after US1 so there is a row to make non-navigating

### Within Each User Story

- Shared snapshot/tokens before UI
- Presentational components before `app/page.tsx` composition
- US2 badges before/with header wiring
- Polish last

### Parallel Opportunities

- T005 and T006 in parallel with T004 (different files)
- T009–T013 in parallel after T008
- T015 can start once `components/landing/` exists, in parallel with T009–T013
- T019 in parallel with T020 if README vs lint do not conflict

---

## Parallel Example: User Story 1

```bash
# After T008, launch presentational pieces together:
Task: "Create components/landing/stat-card.tsx"
Task: "Create components/landing/month-spend.tsx"
Task: "Create components/landing/settlement-row.tsx"
Task: "Create components/landing/balance-chip.tsx"
Task: "Create components/landing/group-row.tsx"

# Then compose:
Task: "Replace app/page.tsx with landing composition"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup
2. Phase 2 Foundational
3. Phase 3 User Story 1
4. **STOP**: validate section order on `/`
5. Demo the visual home (badges can wait)

### Incremental Delivery

1. Setup + Foundational
2. US1 → visual home MVP
3. US2 → Em breve store badges
4. US3 → no-session / non-navigating rows
5. Polish → lint, test, build, quickstart

### Parallel Team Strategy

1. Together: Phase 1–2
2. Then: one person T009–T014 (US1); another T015 (badge component) then T016 after header exists
3. US3 is a short pass on the same files — one owner

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to US1/US2/US3
- Do not port Expo mock store or balance engine
- Do not add Playwright/Vitest in this feature
- Commit after each phase or logical group
- Next step after this file: `/speckit-implement`
