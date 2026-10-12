---

description: "Task list for 003-web-layout-auth-flows"
---

# Tasks: Layout web e fluxos de entrar e sair

**Input**: Design documents from `/specs/003-web-layout-auth-flows/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/routes.md, quickstart.md

**Tests**: A constituição (V. Testable by Default) exige teste para comportamento novo. As regras
de sessão ganham testes em `lib/session-flow.test.mjs` (escritos antes da implementação). O layout
não tem runner de UI no projeto; ele é validado pelos roteiros de `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Caminhos relativos à raiz do repositório (projeto Next.js único)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar o branch exigido pela constituição

- [X] T001 Create branch `feature/003-web-layout-auth-flows` from `main` in the repository root (constituição: sem commits diretos em `main`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Regras de sessão, cabeçalho do caminho atual, avisos de entrar e tokens de largura usados por todas as histórias

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Write failing tests in `lib/session-flow.test.mjs` (estilo de `lib/safe-next.test.mjs`, `node:test` + `assert/strict`, import de `./session-flow.ts`) cobrindo: `loginNotice("saiu")` → "Você saiu da conta."; `loginNotice("expirada")` e `loginNotice("envio")` → "Sua sessão expirou. Entre de novo para continuar."; `loginNotice` com outro valor ou `undefined` → `undefined`; `expiredSessionUrl("/notas", "GET")` → `/sair?motivo=expirada&next=%2Fnotas`; `expiredSessionUrl("/despesas/nova", "POST")` → `/sair?motivo=envio&next=` com o destino `/despesas/nova?aviso=envio-nao-salvo` (preservando query existente, ex.: `/grupos/1?aba=saldos` vira `/grupos/1?aba=saldos&aviso=envio-nao-salvo`); caminho inválido (`//exemplo.com`, `https://x`, `/\x`, `undefined`) → `next=/` (regra de `safeNextPath`: "só `/…`, nunca `//` nem `/\`")
- [X] T003 Implement `lib/session-flow.ts` with pure functions `loginNotice(motivo: unknown): string | undefined`, `expiredSessionUrl(path: string | null | undefined, method: string): string` and constant `SUBMIT_LOST_PARAM = "aviso"` / value `"envio-nao-salvo"`, reusing `safeNextPath` from `lib/safe-next.ts`; `motivo` values are exactly `saiu` | `expirada` | `envio`; method GET → `expirada`, any other method → `envio`; make T002 pass with `pnpm test`
- [X] T004 [P] In `proxy.ts`, on the pass-through branch clone the request headers, set `x-kotta-path` to `pathname + search` (overwriting any client value) and return `NextResponse.next({ request: { headers } })`; export the header name as a constant from `lib/session-flow.ts` and import it here
- [X] T005 [P] Add `--container-reading: 45rem;` (720 px) and `--container-view: 70rem;` (1120 px) to the `@theme` block in `app/globals.css` so `max-w-reading` and `max-w-view` exist
- [X] T006 In `app/(acesso)/entrar/page.tsx`, replace the inline `motivo === "expirada"` check with `loginNotice(motivo)` from `lib/session-flow.ts` (first value if `motivo` is an array)

**Checkpoint**: `pnpm test` passa; `/entrar?motivo=saiu` mostra "Você saiu da conta."

---

## Phase 3: User Story 1 - Sair da conta de qualquer lugar (Priority: P1) 🎯 MVP

**Goal**: "Sair" em ≤ 2 interações em qualquer página logada, com estado "Saindo…", aviso após sair e sem logout por link externo (FR-001 a FR-006)

**Independent Test**: `quickstart.md` cenário 1 (passos 1 a 5)

- [X] T007 [P] [US1] Create client component `components/auth/logout-button.tsx`: `<form action={logoutAction}>` with a submit button using `useFormStatus` (from `react-dom`) to show "Saindo…" and `disabled` while pending; props `label` (default "Sair") and `className`; min touch target 44×44 px (`min-h-11`), visible focus ring per existing focus classes, danger styling only via `kotta-danger` tokens
- [X] T008 [P] [US1] In `app/actions/auth.ts`, change `logoutAction` to redirect to `/entrar?motivo=saiu` after `clearSessionToken()`
- [X] T009 [P] [US1] In `lib/api/server.ts`, export the existing `apiOrigin()` helper (needed by `/sair`) without changing its behavior
- [X] T010 [US1] Rewrite `app/sair/route.ts` per `contracts/routes.md` "GET /sair": read `motivo` (only `expirada` | `envio` forwarded) and `next` (validated with `safeNextPath`); no cookie → redirect to `/entrar` with those params; otherwise call `${apiOrigin()}/api/v1/users/me` directly with `fetch` (Bearer token, `cache: "no-store"`, NOT via `apiRequest`); 401 → delete `SESSION_COOKIE` and redirect to `/entrar?motivo=…&next=…`; 2xx → redirect to `next` (or `/`) without deleting; network error or other status → redirect to `/entrar` without deleting (depends on T009)
- [X] T011 [P] [US1] In `components/app/sidebar-nav.tsx`, make `SidebarNav` scroll on its own (`min-h-0 overflow-y-auto` on the `<nav>`) so the account area below it stays visible with many groups
- [X] T012 [US1] In `components/app/app-shell.tsx`, make the `<aside>` itself non-scrolling (`overflow-hidden`, nav takes `flex-1 min-h-0`) and render `<LogoutButton />` directly below the profile card link in the account area (1 click on desktop) (depends on T007, T011)
- [X] T013 [US1] In `app/(conta)/perfil/page.tsx`, move sign-out into the "Resumo da conta" card, directly below the group count, using `<LogoutButton label="Sair da conta" />`; delete the old "Conta" section at the bottom (depends on T007)
- [X] T014 [P] [US1] In `app/(acesso)/confirme-seu-email/page.tsx`, replace the inline `<form action={logoutAction}>` with `<LogoutButton label="Entrar com outra conta" />` keeping the current muted text style (depends on T007)

**Checkpoint**: `quickstart.md` cenário 1 passa (inclui voltar/recarregar após sair; se o voltar mostrar dados em Chrome ou Safari, aplicar o fallback de `pageshow` descrito em research R5 dentro de `components/app/app-shell.tsx`)

---

## Phase 4: User Story 2 - Entrar e voltar para onde estava (Priority: P1)

**Goal**: Voltar à página de origem após entrar ou após sessão expirada; aviso de envio perdido; erro de login acessível (FR-007 a FR-011)

**Independent Test**: `quickstart.md` cenário 2 (passos 1 a 8)

- [X] T015 [US2] In `lib/api/server.ts` `apiRequest`, read `x-kotta-path` via `headers()` from `next/headers`; when `auth && !token` redirect to `/entrar?next=<encoded safe path>`; on `auth && status 401` redirect to `expiredSessionUrl(path, method)` instead of `/sair?motivo=expirada` (keep the 403 `EMAIL_NOT_CONFIRMED` branch unchanged) (depends on T003, T004, T009)
- [X] T016 [P] [US2] Create client component `components/app/submit-lost-notice.tsx`: reads `useSearchParams()`; when `aviso === "envio-nao-salvo"` renders a `role="status"` banner with the exact text "A sessão expirou e o envio não foi salvo. Preencha de novo." styled with `kotta-danger-bg` / `kotta-danger` tokens and `rounded-control`; renders nothing otherwise
- [X] T017 [US2] In `components/app/app-shell.tsx`, render `<Suspense fallback={null}><SubmitLostNotice /></Suspense>` as the first child of `<main id="conteudo">` with `mb-6` spacing (depends on T012, T016)
- [X] T018 [P] [US2] In `components/auth/login-form.tsx`, add refs to the email and password `Field`s (React 19 `ref` prop is forwarded through `...input` in `components/auth/field.tsx`) and a `useEffect` on `state` that, when `state.error` is set, focuses the password field if the email has a value, else the email field; keep `role="alert"` on `FormError`, `autoComplete` and paste behavior unchanged

**Checkpoint**: `quickstart.md` cenário 2 passa

---

## Phase 5: User Story 3 - Páginas com espaço de web (Priority: P2)

**Goal**: Duas larguras (visão 1120 px, leitura 720 px), margens 16/32/40 px, ritmo 32/48 px, Painel em duas colunas no desktop (FR-012 a FR-021, FR-024)

**Independent Test**: `quickstart.md` cenário 3 (passos 1 a 8)

- [X] T019 [US3] In `components/app/page-header.tsx`, add `export function Page({ title, description, leading, actions, width = "view", children })` per `contracts/routes.md`: outer `div` with `max-w-reading` only when `width === "reading"` (left-aligned, no `mx-auto`), then `<PageHeader …/>`, then `<div className="mt-8 flex flex-col gap-8 lg:gap-12">{children}</div>`
- [X] T020 [US3] In `components/app/app-shell.tsx`, set `<main>` to `mx-auto w-full max-w-view flex-1 px-4 pt-6 sm:px-8 lg:px-10 lg:pt-10 lg:pb-16` with mobile bottom padding `pb-[calc(4rem+env(safe-area-inset-bottom)+2rem)]` (tab bar 64 px + safe area + 32 px) and the mobile header to `px-4 sm:px-8` (depends on T005, T017)
- [X] T021 [P] [US3] In `components/app/dashboard-view.tsx`, remove the support phrase paragraph and wrap the sections in `<div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">` with column 1 = `GardenField` + "Gastos dos grupos" and column 2 = "Últimas quitações" + "Seus grupos", each column `flex flex-col gap-8`; drop the per-section `mt-6`/`mt-8` margins; mobile order stays frase, saldo, gastos, quitações, grupos (`DESIGN.md`)
- [X] T022 [US3] In `components/app/dashboard.tsx`, drop the `mx-auto max-w-2xl` wrapper and the bare `<h1>`; render `<Page title={`Olá, ${firstName(me.name)}`} description="Dividir os gastos da viagem sem fazer conta de cabeça.">` around `DashboardView` (depends on T019, T021)
- [X] T023 [P] [US3] Migrate visão pages to `<Page>` (default width), removing ad-hoc wrappers and top margins between header and first block: `app/(conta)/grupos/page.tsx`, `app/(conta)/grupos/[id]/page.tsx` (only the outer wrapper/header spacing; tab content unchanged), `app/(conta)/grupos/[id]/listas/[listId]/page.tsx` (depends on T019)
- [X] T024 [P] [US3] Migrate leitura pages to `<Page width="reading">`, removing `mx-auto max-w-2xl`: `app/(conta)/grupos/novo/page.tsx`, `app/(conta)/grupos/[id]/editar/page.tsx`, `app/(conta)/grupos/[id]/membros/page.tsx` (depends on T019)
- [X] T025 [P] [US3] Migrate leitura pages to `<Page width="reading">`, removing `mx-auto max-w-2xl`: `app/(conta)/despesas/nova/page.tsx`, `app/(conta)/despesas/[id]/page.tsx`, `app/(conta)/despesas/[id]/editar/page.tsx` (depends on T019)
- [X] T026 [P] [US3] Migrate `app/(conta)/notas/page.tsx` and `app/(conta)/notificacoes/page.tsx` to `<Page>` (visão) and `app/(conta)/notas/[id]/page.tsx` to `<Page width="reading">`, removing `mx-auto max-w-3xl` (depends on T019)
- [X] T027 [P] [US3] Migrate `app/(conta)/perfil/categorias/page.tsx` to `<Page>` (visão) and `app/(conta)/perfil/categorias/nova/page.tsx`, `app/(conta)/perfil/categorias/[id]/page.tsx` to `<Page width="reading">`, removing `mx-auto max-w-*` (depends on T019)
- [X] T028 [US3] Migrate `app/(conta)/perfil/page.tsx` to `<Page>` (visão), replacing `PageHeader` + `mt-8` and the inner `gap-8` stack with the `Page` rhythm (depends on T013, T019)
- [X] T029 [P] [US3] In `app/(conta)/loading.tsx`, match the `Page` rhythm (title, `mt-8`, blocks with `gap-8 lg:gap-12`) and use `bg-kotta-border` for skeleton bars (`kotta-overlay` equals the page background and makes them invisible)
- [X] T030 [US3] In `app/page.tsx` (guest), wrap content in `mx-auto w-full max-w-view px-4 pt-6 pb-12 sm:px-8 lg:px-10 lg:pt-10`, keep the Cadastrar/Entrar header, pass the support phrase above `DashboardView` as the page description, keep "No celular" with both `StoreBadge`s side by side, same height, official two-line copy and no store navigation (`AGENTS.md`) (depends on T021)
- [X] T031 [P] [US3] In `DESIGN.md` section "Painel", add that on desktop (≥ 1024 px) the Painel uses two columns (saldo + gastos | quitações + grupos) and that the order below 1024 px stays as listed

**Checkpoint**: `quickstart.md` cenário 3 passa

---

## Phase 6: User Story 4 - Telas de acesso consistentes (Priority: P3)

**Goal**: Uma moldura para as seis telas de acesso; URLs inalteradas (FR-022, FR-023)

**Independent Test**: `quickstart.md` cenário 4

- [X] T032 [US4] Move `app/confirm-email/` to `app/(acesso)/confirm-email/` and `app/forget-password/` to `app/(acesso)/forget-password/` with `git mv`; reduce each Suspense fallback to the loading text only (the layout provides the frame and brand)
- [X] T033 [P] [US4] In `components/confirm-email/confirm-email-screen.tsx`, remove the own `<main>`, framed `<section>` (including the `shadow-[…]`) and brand header; return only the screen content (depends on T032)
- [X] T034 [P] [US4] In `components/forget-password/forget-password-screen.tsx`, remove the own `<main>`, framed `<section>` (including the `shadow-[…]`) and brand header; return only the screen content (depends on T032)
- [X] T035 [P] [US4] In `app/(acesso)/layout.tsx`, align page gutters to `px-4 sm:px-8` (FR-015) keeping `max-w-lg`, no shadow, brand icon + "Kotta Groups" linking to `/`

**Checkpoint**: `quickstart.md` cenário 4 passa

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T036 Audit with `grep -rn "max-w-" "app/(conta)" components/app` and `grep -rn "#[0-9a-fA-F]\{6\}" app components --include=*.tsx`: no page wrapper keeps its own width (SC-004), no raw hex added (FR-024); remove now-unused imports (`logoutAction` in pages, `PageHeader` where replaced)
- [X] T037 Run `pnpm lint`, `pnpm test` and `pnpm build` from the repository root; fix any failure
- [ ] T038 Run every scenario in `specs/003-web-layout-auth-flows/quickstart.md` in Chrome and Safari at 320, 375, 768, 1024, 1440 and 1920 px and 200% zoom; record failures as new tasks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories → **Polish (Phase 7)**
- T002 before T003 (testes primeiro); T004, T005 parallel; T006 after T003

### User Story Dependencies

- **US1 (P1)**: depends only on Phase 2
- **US2 (P1)**: depends on Phase 2; T015 needs T009 (US1) only for the exported `apiOrigin` import path — do T009 first if running US2 alone
- **US3 (P2)**: depends on Phase 2; shares `components/app/app-shell.tsx` with US1 (T012) and US2 (T017), so T020 runs after them; shares `app/(conta)/perfil/page.tsx` with US1 (T013 → T028)
- **US4 (P3)**: depends only on Phase 2; independent of US1–US3

### Same-file sequences (no [P] across these)

- `components/app/app-shell.tsx`: T012 → T017 → T020
- `lib/api/server.ts`: T009 → T015
- `app/(conta)/perfil/page.tsx`: T013 → T028

## Parallel Example: User Story 1

```text
T007 components/auth/logout-button.tsx
T008 app/actions/auth.ts
T009 lib/api/server.ts
T011 components/app/sidebar-nav.tsx
# then T010, T012, T013, T014
```

## Parallel Example: User Story 3

```text
T021 components/app/dashboard-view.tsx
T023 grupos (visão)   T024 grupos (leitura)   T025 despesas
T026 notas/notificações   T027 perfil/categorias   T029 loading   T031 DESIGN.md
```

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 + Phase 2
2. Phase 3 (US1): sair seguro e visível
3. **Stop and validate**: `quickstart.md` cenário 1; abrir PR se quiser entregar já

### Incremental Delivery

1. US1 → sair (segurança)
2. US2 → entrar e voltar (os dois P1 juntos fecham os fluxos de sessão)
3. US3 → layout web (maior diff visual; páginas migram em paralelo)
4. US4 → moldura de acesso
5. Polish → auditoria, `pnpm lint/test/build`, quickstart completo
