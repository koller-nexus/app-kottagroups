# Contract: E2E runner, environment and CI check

## Command

| Command | Behavior |
|---------|----------|
| `pnpm test:e2e` | `playwright test`. Starts the app on `:3002` (or reuses a running one), runs `setup`, then every `e2e/**/*.spec.ts` in Chromium |
| `pnpm test` | Unchanged: unit tests in `lib/` only (FR-002) |

Exit code `0` only when every test passes.

## Environment

| Variable | Required | Used by | Notes |
|----------|----------|---------|-------|
| `API_ORIGIN` | yes | app (build + runtime), `auth.setup.ts` health check | `http://localhost:8085` locally and in CI |
| `E2E_EMAIL` | yes | `auth.setup.ts`, login tests | Dev-seed account |
| `E2E_PASSWORD` | yes | same | Never committed |
| `CI` | set by Actions | `playwright.config.ts` | Enables `forbidOnly` |
| `E2E_PORT` | no | `playwright.config.ts` | App port, default `3002`. Use another port when `pnpm dev` already holds 3002 |

If `API_ORIGIN` is missing, the config refuses to start (the app would otherwise fall back to the
production API). If `E2E_EMAIL` or `E2E_PASSWORD` is missing, `setup` fails with a message naming it. If the API is
unreachable, `setup` fails with `API not reachable at <API_ORIGIN>/api/healthz` before any other test
runs.

## Files

```text
playwright.config.ts
e2e/
├── auth.setup.ts          # health check + login + storageState
├── run-id.ts              # runId for unique names
├── access.spec.ts         # US1: entrar, senha inválida, cadastrar, esqueci, rota protegida, sair
├── dashboard.spec.ts      # US1: / guest preview and logged in
├── groups.spec.ts         # US2: criar, editar, membros
├── expenses.spec.ts       # US2: criar, ver, editar
├── shopping-list.spec.ts  # US2: adicionar e marcar item
├── notes-notifications.spec.ts  # US3
└── profile.spec.ts        # US3: perfil + criar categoria
.github/workflows/e2e.yml
```

Gitignored additions: `/e2e/.auth/`, `/playwright-report/`, `/test-results/`.

## Selector rule (FR-008)

Tests locate elements only with `getByRole`, `getByLabel`, `getByText` and `getByPlaceholder`.
Locators on CSS classes or `data-*` attributes are not allowed. If an element has no accessible
name, the fix is to give it one in the component, which also improves accessibility.

## CI check `.github/workflows/e2e.yml`

- **Trigger**: `pull_request` (all branches).
- **Runner**: `ubuntu-latest`.
- **Services**: `postgres:16-alpine` (`kotta/kotta/kotta`) and `redis:7-alpine`, both with health
  checks.
- **Secrets**: `API_REPO_TOKEN` (read the API repo), `E2E_EMAIL`, `E2E_PASSWORD`.
- **Steps**, in order:
  1. Check out the app.
  2. Check out `koller-nexus/api-kottagroups@develop` into `api/`.
  3. `setup-go` from `api/go.mod`.
  4. Build the API and run it with `-migrate`.
  5. Start the API binary in the background. Logs go to `api.log`. The environment is `APP_ENV=dev`,
     `APP_PORT=8085`, `DATABASE_URL`, `REDIS_URL`, a 32+ character `JWT_SECRET`,
     `AUTH_RATE_LIMIT_ATTEMPTS=1000` and `APP_CONFIRMATION_URL=http://localhost:3002`.
  6. Wait up to 60 s for `/api/healthz`.
  7. Install pnpm, Node 22 (with the pnpm cache) and bun.
  8. Run `pnpm install --frozen-lockfile`.
  9. Run `pnpm exec playwright install --with-deps chromium`.
  10. Run `pnpm test:e2e`. Its `webServer` runs `pnpm build && pnpm start --port 3002` with
      `API_ORIGIN` passed explicitly, so there is no separate build step.
- **On failure**: upload the `playwright-report/`, `test-results/` (traces) and `api.log`
  artifacts, kept for 7 days.
- **Timeout**: `timeout-minutes: 15`. The suite itself targets under 5 minutes (SC-002).
- **Playwright config in CI**: `trace: 'retain-on-failure'`, `reporter: [['html', { open: 'never' }], ['list']]`
  and `workers: 1`. One worker keeps the shared seed user's data predictable.
