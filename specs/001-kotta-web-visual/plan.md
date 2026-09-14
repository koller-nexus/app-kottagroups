# Implementation Plan: Kotta Web Visual Landing

**Branch**: `001-kotta-web-visual` | **Date**: 2026-09-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-kotta-web-visual/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Replace the Next.js scaffold home with a single public landing that copies the Kotta mobile public dashboard: brand, four balance cards, month spend bars, recent settlements, and group rows. Swap Entrar/Cadastrar for informational App Store and Play Store badges labeled **Em breve**. Static demo data only — no auth, no APIs, no authenticated screens.

Technical approach: one App Router page, CSS tokens matching Kotta DESIGN.md, `next/font/google` for Playfair Display / DM Sans / DM Mono, a frozen TypeScript demo snapshot (no balance engine), inline SVG store badges as non-link controls.

## Technical Context

**Language/Version**: TypeScript 5, Node 20+ (as in the repo)

**Primary Dependencies**: Next.js 16.3 App Router, React 19, Tailwind CSS 4, `next/font/google`

**Storage**: N/A (compile-time demo module; no persistence)

**Testing**: `pnpm lint`; `node:test` on money formatting; visual sign-off via [quickstart.md](./quickstart.md) (no new E2E framework)

**Target Platform**: Modern browsers (mobile ~375px and desktop ~1280px)

**Project Type**: Single Next.js web application (static visual landing)

**Performance Goals**: First meaningful content (brand + stats) perceived under 3 seconds on a normal connection (SC-002); no client data fetching

**Constraints**: Visual-only; Portuguese UI; no login; store badges must not navigate to stores; light theme only (Kotta is not dark); keep a phone-width column on large screens; no Server Actions or route handlers for this feature

**Scale/Scope**: 1 page, ~5 presentational pieces, 1 demo snapshot, 2 store badges

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Simplicity First | One route, frozen demo JSON-like module, no auth/state libraries, no port of the mobile store or balance engine | Pass |
| II. Clean Code | English identifiers; PT-BR visible copy from the spec; no leftover scaffold “Create Next App” copy; no TODOs | Pass |
| III. Organized Structure | Landing files grouped under `app/` + `components/landing/` + `lib/`; no junk-drawer utils | Pass |
| IV. Best Practices | Read installed Next.js font/layout docs; no Server Actions; no secrets; add `VERSION` on first product change | Pass |
| V. Testable by Default | Pure `formatBRL`; demo snapshot is data; lint + `node:test` for formatting; UI proven by quickstart (YAGNI: no Playwright yet) | Pass |

No constitution violations. Complexity Tracking left empty.

**Post-design re-check**: Contracts are a UI contract (no HTTP API). Data model is display-only. Still no extra layers. Gate remains Pass.

## Project Structure

### Documentation (this feature)

```text
specs/001-kotta-web-visual/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
└── tasks.md              # created later by /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── layout.tsx            # pt-BR metadata, Kotta fonts, light theme
├── page.tsx              # landing composition (route `/`)
└── globals.css           # Kotta color/radius/spacing tokens

components/landing/
├── store-badge.tsx       # App Store / Play Store “Em breve” controls
├── stat-card.tsx
├── month-spend.tsx
├── settlement-row.tsx
├── group-row.tsx
└── balance-chip.tsx

lib/
├── demo-landing.ts       # frozen snapshot consumed by the page
└── money.ts              # cents → pt-BR currency string

lib/money.test.mjs        # node:test for formatBRL

VERSION                   # introduce project version file (constitution)
```

**Structure Decision**: Keep the existing Next.js App Router app. Do not add `frontend/` or `backend/`. Do not copy the Expo app tree. Presentational pieces live next to the landing feature; demo data is a module, not a store.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

None.
