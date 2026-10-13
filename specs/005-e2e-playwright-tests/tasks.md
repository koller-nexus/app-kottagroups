---

description: "Task list for 005-e2e-playwright-tests"
---

# Tasks: Testes E2E dos fluxos principais

**Input**: Design documents from `/specs/005-e2e-playwright-tests/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/e2e-runner.md,
quickstart.md

**Tests**: This feature *is* the test suite, so the `e2e/*.spec.ts` files are the deliverable.
No separate tests-for-the-tests are planned. Quickstart V1–V8 validate the suite.

**Organization**: Tasks are grouped by user story (spec.md US1–US4).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: The user story the task belongs to (US1–US4)

## Rules for every spec file

These rules come from contracts/e2e-runner.md and research R6/R7:

- Selectors: use only `getByRole`, `getByLabel`, `getByText` and `getByPlaceholder` (FR-008). Before
  writing a locator, read the page's `page.tsx` and the components it renders to find the real
  labels and headings.
- If a control has no accessible name, add a visible label or `aria-label` in the component (the
  smallest change), mention it in the PR, and do not fall back to CSS selectors.
- Use names built from `runId` (`e2e/run-id.ts`). Assert that the created item is visible, and
  never assert counts or totals (FR-013).
- Guest tests use `test.use({ storageState: { cookies: [], origins: [] } })`, because `proxy.ts`
  redirects logged-in users away from `/entrar`, `/cadastrar` and `/esqueci-a-senha`.

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Add `@playwright/test` pinned to exactly `1.64.0` as a devDependency
  (`pnpm add -D -E @playwright/test@1.64.0`). Add the script `"test:e2e": "playwright test"` and
  leave `"test"` unchanged (FR-002), in package.json and pnpm-lock.yaml.
- [X] T002 [P] Append `/e2e/.auth/`, `/playwright-report/`, `/test-results/` to .gitignore.
- [X] T003 Create playwright.config.ts (per research R5/R6 and contracts/e2e-runner.md).
  `testDir: "e2e"`, `use.baseURL: "http://localhost:3002"`.
  `trace: "retain-on-failure"`, `forbidOnly: !!process.env.CI`, `retries: 0`, `workers: 1`.
  `reporter: [["html", { open: "never" }], ["list"]]`. Two projects: `setup`
  (`testMatch: /auth\.setup\.ts/`) and `chromium` (`devices["Desktop Chrome"]`,
  `storageState: "e2e/.auth/user.json"`, `dependencies: ["setup"]`). `webServer`:
  `command: process.env.CI ? "pnpm start --port 3002" : "pnpm dev"`,
  `url: "http://localhost:3002"`, `reuseExistingServer: !process.env.CI`, `timeout: 120_000`.
  Use named constants for the port and the auth file path.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: The logged-in specs in US1–US3 need T004–T005.

- [X] T004 [P] Create e2e/run-id.ts exporting `runId = Date.now().toString(36)`, computed once
  per process (data-model.md "Run-scoped test data").
- [X] T005 Create e2e/auth.setup.ts (research R6). The test does four things in order:
  1. Read `API_ORIGIN`, `E2E_EMAIL` and `E2E_PASSWORD`, and throw `Missing env var <NAME>` when
     one is empty (quickstart V3).
  2. `fetch(`${API_ORIGIN}/api/healthz`)` and throw `API not reachable at <API_ORIGIN>/api/healthz` when
     it fails or is not OK (quickstart V2).
  3. Log in through `/entrar` with label selectors (read app/(acesso)/entrar/page.tsx) and wait
     for the URL `/`.
  4. Save `page.context().storageState({ path: "e2e/.auth/user.json" })`.

  Credentials have no defaults in code (FR-012).

**Checkpoint**: `pnpm test:e2e` runs `setup` green against the local API.

---

## Phase 3: User Story 1 - Rodar a suíte localmente e confiar nos fluxos de acesso (Priority: P1) 🎯 MVP

**Goal**: One command covers access flows and the dashboard with a reused session.

**Independent Test**: Follow quickstart steps 1–2, see `access` and `dashboard` pass. Break
`PROTECTED` in proxy.ts and see the redirect test fail (quickstart V4).

- [X] T006 [P] [US1] Create e2e/access.spec.ts with a guest `describe` (empty storageState)
  containing these tests:
  - (a) Valid login at `/entrar` lands on `/`.
  - (b) A wrong password shows the error message and stays on `/entrar`.
  - (c) Sign-up at `/cadastrar` with `` `e2e+${runId}@example.com` `` reaches the "confirme seu
    e-mail" screen.
  - (d) `/esqueci-a-senha` with `E2E_EMAIL` shows the confirmation message.
  - (e) Opening `/grupos` redirects to `/entrar` (assert the URL contains `/entrar`).

  Read app/(acesso)/entrar/page.tsx, app/(acesso)/cadastrar/page.tsx,
  app/(acesso)/esqueci-a-senha/page.tsx, app/(acesso)/confirme-seu-email/page.tsx and proxy.ts
  for labels, copy and redirects.
- [X] T007 [US1] Add to e2e/access.spec.ts a logout test that logs in fresh inside the test.
  It does not use the shared state, because `/sair` would kill the shared session for later
  tests. It visits `/sair` (app/sair/route.ts), asserts it is logged out, and then asserts that
  `/grupos` redirects to `/entrar`.
- [X] T008 [P] [US1] Create e2e/dashboard.spec.ts:
  - (a) Guest (empty storageState): `/` shows the preview state.
  - (b) Logged in: `/` shows the user's real data, such as a seed group name or the user's name.

  Read app/page.tsx and the components it renders to tell the two states apart by visible text
  or headings.
- [X] T009 [US1] Run `pnpm test:e2e` twice in a row and confirm both runs pass
  (quickstart V1). Fix any flaky waits by using web-first assertions (`expect(...).toBeVisible()`,
  `toHaveURL`) instead of timeouts.

**Checkpoint**: The MVP works. The suite runs locally and covers access and the dashboard.

---

## Phase 4: User Story 2 - Cobrir grupos, despesas e lista de compras (Priority: P2)

**Goal**: The core flows are covered end to end.

**Independent Test**: `pnpm test:e2e e2e/groups.spec.ts e2e/expenses.spec.ts e2e/shopping-list.spec.ts`
passes, and each test ends by seeing the created or edited data.

- [X] T010 [P] [US2] Create e2e/groups.spec.ts as one serial `describe`:
  1. Create a group at `/grupos/novo` named `` `E2E grupo ${runId}` `` and assert the name is
     visible on the group page.
  2. Edit it at `/grupos/[id]/editar` to `` `E2E grupo ${runId} editado` `` and assert the new
     name.
  3. Open `/grupos/[id]/membros` and assert the logged-in user is listed.

  Read app/(conta)/grupos/novo/page.tsx, app/(conta)/grupos/[id]/page.tsx,
  app/(conta)/grupos/[id]/editar/page.tsx and app/(conta)/grupos/[id]/membros/page.tsx. Take the
  group id from the URL after creation.
- [X] T011 [P] [US2] Create e2e/expenses.spec.ts as one serial `describe`:
  1. Create an expense at `/despesas/nova` in an existing seed group, with description
     `` `E2E despesa ${runId}` `` and a fixed amount such as `12,34`.
  2. Assert the detail page `/despesas/[id]` shows the description and the formatted amount.
  3. Edit the description at `/despesas/[id]/editar` and assert the detail shows the change.

  Read app/(conta)/despesas/nova/page.tsx, app/(conta)/despesas/[id]/page.tsx and
  app/(conta)/despesas/[id]/editar/page.tsx.
- [X] T012 [P] [US2] Create e2e/shopping-list.spec.ts:
  1. Open a seed group, then open its shopping list at `/grupos/[id]/listas/[listId]`. If the
     group has none, create one first from the group page.
  2. Add the item `` `E2E item ${runId}` ``.
  3. Mark it as bought and assert the row shows the bought state by its accessible state or
     visible text.

  Read app/(conta)/grupos/[id]/page.tsx and app/(conta)/grupos/[id]/listas/[listId]/page.tsx,
  plus the components they render. Do not touch the receipt capture flow (out of scope).

**Checkpoint**: US1 and US2 pass together.

---

## Phase 5: User Story 4 - Rodar a suíte automaticamente em todo PR (Priority: P2)

**Goal**: Every PR runs the suite and keeps the report and trace when it fails.

**Independent Test**: Open a PR and see the `e2e` check run. Force one failure and see the
artifacts (quickstart V7).

- [X] T013 [US4] Create .github/workflows/e2e.yml exactly per contracts/e2e-runner.md "CI check":
  - Trigger on `pull_request`, run on `ubuntu-latest`, with `timeout-minutes: 15`.
  - Services `postgres:16-alpine` (user/password/db `kotta`, port 5432, `pg_isready` health
    check) and `redis:7-alpine` (port 6379, `redis-cli ping` health check).
  - Check out the app. Check out `koller-nexus/api-kottagroups`, `ref: develop`, `path: api`,
    `token: ${{ secrets.API_REPO_TOKEN }}`.
  - `actions/setup-go` with `go-version-file: api/go.mod`.
  - Migrate with `go run ./cmd/api -migrate` in `api/`.
  - Start the API in the background with `nohup go run ./cmd/api > api.log 2>&1 &`. Use the env
    `APP_ENV=dev`, `APP_PORT=8085`,
    `DATABASE_URL=postgres://kotta:kotta@localhost:5432/kotta?sslmode=disable`,
    `REDIS_URL=redis://localhost:6379`, a 32+ char `JWT_SECRET`, `AUTH_RATE_LIMIT_ATTEMPTS=1000`
    and `APP_CONFIRMATION_URL=http://localhost:3002`.
  - Wait for `curl -fsS http://localhost:8085/api/healthz` in a 60 s loop.
  - `pnpm/action-setup`, `actions/setup-node` (node 22, `cache: pnpm`) and `oven-sh/setup-bun`.
  - `pnpm install --frozen-lockfile`, then `pnpm exec playwright install --with-deps chromium`.
  - `pnpm build` with `API_ORIGIN=http://localhost:8085`.
  - `pnpm test:e2e` with `API_ORIGIN`, `E2E_EMAIL: ${{ secrets.E2E_EMAIL }}` and
    `E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}`.
  - `if: failure()` → `actions/upload-artifact` for `playwright-report/`, `test-results/` and
    `api.log`, with `retention-days: 7`.

  Pin every action to a full commit SHA with a version comment, as the API repo does.

**Checkpoint**: The PR check is green with US1 and US2 coverage.

---

## Phase 6: User Story 3 - Cobrir notas, notificações, perfil e categorias (Priority: P3)

**Goal**: The secondary pages have coverage.

**Independent Test**: `pnpm test:e2e e2e/notes-notifications.spec.ts e2e/profile.spec.ts` passes.

- [X] T014 [P] [US3] Create e2e/notes-notifications.spec.ts. Open `/notas` and `/notificacoes`
  and assert each page's heading and either the user's content or the empty state the page
  defines. Read app/(conta)/notas/page.tsx and app/(conta)/notificacoes/page.tsx.
- [X] T015 [P] [US3] Create e2e/profile.spec.ts:
  - (a) `/perfil` shows the heading and the logged-in user's name or email.
  - (b) Create the category `` `E2E categoria ${runId}` `` at `/perfil/categorias/nova` and
    assert it appears at `/perfil/categorias`.

  Read app/(conta)/perfil/page.tsx, app/(conta)/perfil/categorias/page.tsx and
  app/(conta)/perfil/categorias/nova/page.tsx.

**Checkpoint**: Every flow listed in issue #9 is covered (SC-003).

---

## Implementation notes

These are deviations found while building, and the docs are updated to match:

- The API health path is `/api/healthz`. There is no `/readyz`.
- `GET /sair` keeps a valid session (it only clears tokens the API rejects). Logout is the
  **Sair** button (`logoutAction`), which only clears the cookie. So the logout test reuses the
  shared session safely.
- Successful login is asserted by `auth.setup.ts` and not repeated in `access.spec.ts`. This keeps
  each run at 4 auth attempts.
- `webServer` always runs `pnpm build && pnpm start` and never reuses a running server.
  `E2E_PORT` overrides 3002. Next 16 blocks a second `next dev`, and a dev server without
  `API_ORIGIN` would hit the production API.
- CI uses Node 22, because `pnpm test` relies on `--experimental-strip-types`.

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T016 [P] Add a "Testes E2E" section to README.md. It covers:
  - Prerequisites.
  - Starting the API with the dev seed and `AUTH_RATE_LIMIT_ATTEMPTS=1000` (quickstart step 1).
  - The env vars `API_ORIGIN`, `E2E_EMAIL` and `E2E_PASSWORD`, pointing to
    api-kottagroups `docs/environment.md` for the seed credentials, with no password written in
    the README.
  - `pnpm exec playwright install chromium`, `pnpm test:e2e` and
    `pnpm exec playwright show-report`.
  - The one-time CI secrets `API_REPO_TOKEN`, `E2E_EMAIL` and `E2E_PASSWORD` (FR-011).
- [X] T017 Run `pnpm lint`, `pnpm test` and `pnpm build`, and confirm all three pass with `e2e/` and
  playwright.config.ts included (quickstart V5, V8). Fix type or lint errors in e2e files.
- [X] T018 Run the full suite 5 times in a row (quickstart V6, SC-005). Confirm 5/5 pass and the
  total time stays under 5 minutes (SC-002). Fix or remove any flaky test; do not skip it.
- [X] T019 Write the PR description. Include:
  - The justification for the new devDependency `@playwright/test` (Constitution I, research R4).
  - The decision to test against the real API (research R1).
  - The required repo secrets.
  - Any component accessibility labels added for selectors.

---

## Dependencies & Execution Order

- **Setup (T001–T003)** → **Foundational (T004–T005)** → user stories.
- **US1 (T006–T009)**: needs Foundational. It is the MVP.
- **US2 (T010–T012)**: needs Foundational and is independent of US1's files.
- **US4 (T013)**: needs T001–T005 plus at least one spec file. It runs whatever specs exist.
- **US3 (T014–T015)**: needs Foundational and is independent of US1 and US2.
- **Polish (T016–T019)**: T017 and T018 come after all stories. T016 can run any time after T013.

Within a phase, the [P] tasks touch different files and can run together. T007 edits the same
file as T006, so run it after T006.

## Parallel Example

```text
# After T005:
T006 e2e/access.spec.ts   |  T008 e2e/dashboard.spec.ts
T010 e2e/groups.spec.ts   |  T011 e2e/expenses.spec.ts  |  T012 e2e/shopping-list.spec.ts
T014 e2e/notes-notifications.spec.ts  |  T015 e2e/profile.spec.ts
```

## Implementation Strategy

1. **MVP**: Phases 1–3 (T001–T009). `pnpm test:e2e` runs locally and covers access and the
   dashboard.
2. Add US2 (T010–T012), then US4 (T013), so PRs are gated on the core flows early.
3. Add US3 (T014–T015), then Polish (T016–T019).
