# Research: Testes E2E dos fluxos principais

## R1. Backend used by the suite (spec FR-009)

- **Decision**: Run against the real `api-kottagroups` with `APP_ENV=dev`. In CI, the job starts
  Postgres 16 and Redis 7 as service containers, checks out `koller-nexus/api-kottagroups`
  (`develop`), runs `go run ./cmd/api -migrate` and then starts the API in the background on
  `:8085`. The first start inserts the dev seed.
- **Rationale**: The pages fetch data on the Next server (`lib/api/server.ts` reads `API_ORIGIN`),
  so `page.route()` cannot intercept anything. The API already ships a deterministic dev seed with
  six demo accounts (`docs/environment.md` → "Development seed credentials"). A mock would have to
  reimplement auth, groups, expenses, shopping lists, notes, notifications and categories by
  hand, and would drift from the real contract. That breaks Constitution I (simplicity) for a
  worse test.
- **Alternatives considered**:
  - HTTP mock in this repo (option B): rejected. It is a large hand-written surface that tests the
    mock and not the integration.
  - `docker compose up` from `deployments/dev`: rejected. It also starts Grafana, Loki, Tempo,
    Prometheus and Alloy, and it builds a Chainguard image. That makes it slow and heavy for a PR
    check. Postgres and Redis service containers plus `go run` start only what the suite needs.
  - Published `ghcr.io/koller-nexus/api-kottagroups:prd-*` image: rejected. It lags `develop`,
    so the web PR would test against an API missing endpoints the web already uses.

## R2. Cross-repo checkout

- **Decision**: `actions/checkout` with `repository: koller-nexus/api-kottagroups`,
  `ref: develop`, `path: api` and `token: ${{ secrets.API_REPO_TOKEN }}` (a read-only
  fine-grained token for the API repo).
- **Rationale**: The default `GITHUB_TOKEN` only reads the current repo.
- **Alternatives**: a GitHub App token. That is more setup for the same read access.

## R3. Rate limiting during the suite

- **Decision**: Start the API with `AUTH_RATE_LIMIT_ATTEMPTS=1000`. The README tells local users to
  do the same.
- **Rationale**: The default allows 10 login/register attempts per 15 minutes. All attempts come
  from the Next server (one IP). One run uses about 5 attempts, so two quick local runs would
  start failing on `429`.

## R4. Test runner and version

- **Decision**: `@playwright/test@1.64.0` as an exact-pinned devDependency, Chromium only.
- **Rationale**: Issue #9 asks for it. The installed Next docs
  (`node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md`) use it and recommend
  testing the production build. It is dev-only, so no runtime bundle impact.

## R5. App server during tests

- **Decision**: `playwright.config.ts` `webServer` runs `pnpm build && pnpm start --port <E2E_PORT|3002>`
  locally and in CI, with `API_ORIGIN` passed in `webServer.env` and `reuseExistingServer: false`.
- **Rationale**:
  - Next 16 refuses a second `next dev` in the same folder, so a dev-server approach breaks
    whenever the developer already has `pnpm dev` running.
  - The production build is what the Next testing guide recommends.
  - Never reusing a running server avoids testing a server that points at the production API.
    A dev server without `API_ORIGIN` falls back to `https://api.kottagroups.com.br`.
  - `API_ORIGIN` is required by the config itself, and `next.config.ts` reads it at build time.
- **Note**: In production mode the session cookie is `secure`. Chromium accepts secure cookies on
  `http://localhost`, so login works without TLS. The scripts run through `bun`, so CI needs
  `oven-sh/setup-bun`. The CI uses Node 22, because `pnpm test` already relies on
  `--experimental-strip-types`.

## R6. Auth fixture

- **Decision**: Use a Playwright `setup` project (`e2e/auth.setup.ts`):
  1. Check `${API_ORIGIN}/api/healthz` and fail with a clear message if the API is down (spec edge
     case).
  2. Log in through `/entrar` with `E2E_EMAIL` / `E2E_PASSWORD`.
  3. Save `storageState` to `e2e/.auth/user.json`, which is gitignored and recreated on every run.

  The `chromium` project depends on `setup` and uses that state. Guest tests clear the state with
  `test.use({ storageState: { cookies: [], origins: [] } })`.
- **Rationale**: This is Playwright's documented pattern. `proxy.ts` redirects a logged-in user
  away from `/entrar`, `/cadastrar` and `/esqueci-a-senha`, so guest tests MUST run without the
  cookie.
- **Credentials**: No defaults in code (FR-012). Locally they come from the env (the README points
  to the API's seed docs). In CI they come from the `E2E_EMAIL` / `E2E_PASSWORD` repo secrets.

## R7. Test isolation

- **Decision**: Each spec file builds names as `` `E2E <thing> ${runId}` ``. `runId` is computed
  once in `e2e/run-id.ts` (`Date.now().toString(36)`). Sign-up uses
  `` `e2e+${runId}@example.com` ``. Assertions look for the created name and never count totals.
- **Rationale**: This covers spec FR-013 and the edge cases. The seed is never reset between local
  runs.

## R8. CI runner

- **Decision**: Use `ubuntu-latest`.
- **Rationale**: Service containers need a Linux runner with Docker. The API repo uses
  self-hosted runners, but nothing shows this repo has access to one. Switching later only means
  changing `runs-on`.
