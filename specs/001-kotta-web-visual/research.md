# Research: Kotta Web Visual Landing

## 1. How to recreate the Kotta public home on the web

**Decision**: Rebuild the public dashboard composition as a single Next.js App Router page (`/`), using the sibling mobile app’s public home as the visual source (brand, four stats, month bars, settlements, groups) and Kotta DESIGN.md for tokens (primary `#1a5c38`, background `#f7f9f8`, surface white, card radius 24px, control radius 12px).

**Rationale**: The spec scopes authenticated tabs and modals out. The mobile public home is already the logged-out layout. Porting Expo/React Native would violate Simplicity First.

**Alternatives considered**:
- Embed or transpile the Expo screens — rejected (wrong runtime, auth still in those files).
- Recreate the full tabbed app as static mock — rejected (FR-009).
- Marketing landing with a different desktop dashboard — rejected (FR-011, SC-001).

## 2. Fonts

**Decision**: Load Playfair Display (brand), DM Sans (body), and DM Mono (labels and money) with `next/font/google` in `app/layout.tsx`, per installed Next.js font docs (`node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`). Map them onto Tailwind theme tokens in `globals.css`. Do not use Geist.

**Rationale**: DESIGN.md specifies those families. `next/font` self-hosts and avoids extra font requests. The RN theme file uses extra-bold DM Sans for the wordmark; DESIGN.md uses Playfair for display — follow DESIGN.md for the web brand, which matches the “premium green” identity.

**Alternatives considered**:
- Keep Geist from the scaffold — rejected (not Kotta).
- `next/font/local` copies from the Expo app — extra assets, no benefit.

## 3. Demo data vs balance engine

**Decision**: Ship a frozen snapshot in `lib/demo-landing.ts` (already-computed totals, three groups, a few settlements). Do not import or reimplement `getGroupBalances` / mock store / AsyncStorage.

**Rationale**: Visual-only (FR-008, FR-010). Computing balances would pull a large domain layer for no user-visible gain. Snapshot numbers should look plausible in BRL and reuse the familiar group names (Apartamento, Viagem pra Praia, Churrasco de Domingo) so side-by-side review still feels like Kotta.

**Alternatives considered**:
- Copy `src/data/mock.ts` and the balance module — rejected (YAGNI, RN storage).
- Empty states inviting login — rejected (spec: filled demo, no auth CTA).

## 4. Store badges

**Decision**: Custom, self-contained SVG (or equivalent) badges for App Store and Google Play, each with a visible **Em breve** label. Render as `<button type="button">` (or non-navigating `<div role="img">`) with accessible name “App Store, em breve” / “Google Play, em breve”. No `href`, no `window.open`. Optional `title` or inline hint on click is unnecessary if the label is already visible.

**Rationale**: FR-006/FR-007 forbid live store URLs. Official badge PNGs imply a published listing. SVG stays crisp, works if a raster fails, and keeps alt text as real text.

**Alternatives considered**:
- Official Apple/Google badge images linking to store search — rejected (empty listings, FR-007).
- Text-only “Em breve na App Store” — weaker SC-004 recognition.

## 5. Layout on large screens

**Decision**: Center a max-width column (~430px, phone-like) on a `#f7f9f8` canvas. Do not build a multi-column admin layout. Header: brand left, badges right; wrap on very narrow widths (`flex-wrap`).

**Rationale**: SC-005 and FR-011. Matches “same layout as the app”.

**Alternatives considered**:
- Full-bleed 12-column desktop grid — rejected (new product, not the app).

## 6. Interactivity and routing

**Decision**: Group rows are not links. Badges are not links. No `/auth`, no `/group/[id]`, no tabs. Remove scaffold links (Vercel, Next docs). `lang="pt-BR"`. Light theme only; remove `prefers-color-scheme: dark` invert from the scaffold.

**Rationale**: FR-005, FR-009, FR-010, P3 scenarios.

**Alternatives considered**:
- Click group → static detail page — extra surface, out of spec.
- Client Zustand/store — unused.

## 7. Testing

**Decision**: `formatBRL` unit tests with Node’s built-in test runner. ESLint on the app. Manual visual pass in quickstart at 375 and 1280. Do not add Playwright/Vitest for this feature.

**Rationale**: Constitution wants a test for new behavior; money formatting is the only non-trivial pure logic. A full E2E stack is a new product dependency for one static page (YAGNI). Visual sameness is a human criterion (SC-001).

**Alternatives considered**:
- Playwright smoke — deferred until the repo has an E2E need beyond one page.
- No tests — fails constitution V.

## 8. Versioning

**Decision**: Add repository file `VERSION` with `0.2.0` when implementing (scaffold `package.json` is `0.1.0`; this is the first product UI).

**Rationale**: Constitution: if VERSION does not exist, the change that introduces versioning MUST add it.

**Alternatives considered**: Only bump `package.json` — incomplete vs AGENTS.md / constitution.
