# Quickstart: validating the E2E suite

## Prerequisites

- Docker, Go (version from `api-kottagroups/go.mod`), Node 22, pnpm, bun.
- `api-kottagroups` checked out next to this repo.

## 1. Start the API with the dev seed

```bash
cd ../api-kottagroups
make docker-up-stores                      # Postgres 16 + Redis 7 only
export APP_ENV=dev APP_PORT=8085 AUTH_RATE_LIMIT_ATTEMPTS=1000 \
  DATABASE_URL=postgres://kotta:kotta@localhost:5432/kotta?sslmode=disable \
  REDIS_URL=redis://localhost:6379 \
  JWT_SECRET=compose-local-dev-secret-min-32-chars   # same values as deployments/dev
go run ./cmd/api -migrate
make run
curl -fsS http://localhost:8085/api/healthz     # expect 200
```

## 2. Run the suite

```bash
cd ../app-kottagroups
pnpm install
pnpm exec playwright install chromium
export API_ORIGIN=http://localhost:8085
export E2E_EMAIL=<demo email from api-kottagroups/docs/environment.md>
export E2E_PASSWORD=<shared demo password from the same doc>
pnpm test:e2e
```

**Expected**: every test passes, and `playwright-report/` has the HTML report
(`pnpm exec playwright show-report`).

## Validation scenarios

| # | Scenario | Expected |
|---|----------|----------|
| V1 | Run `pnpm test:e2e` twice in a row | Both runs pass (FR-013, SC-005) |
| V2 | Stop the API, then run `pnpm test:e2e` | Only `setup` fails, with `API not reachable at http://localhost:8085/api/healthz` |
| V3 | Unset `E2E_PASSWORD`, then run | `setup` fails naming the missing variable |
| V4 | Temporarily change the guest redirect in `proxy.ts` from `/entrar` to `/` | The protected-route and logout tests fail. Revert afterwards. Removing `/grupos` from `PROTECTED` is not enough: the API 401 → `/sair` fallback still lands on `/entrar` |
| V5 | Run `pnpm test` | Unit tests only, unchanged (FR-002) |
| V6 | Run the suite 5 times: `for i in 1 2 3 4 5; do pnpm test:e2e || break; done` | 5/5 pass (SC-005) |
| V7 | Open a PR | The `e2e` check runs and passes. On a forced failure, the run has the `playwright-report`, `test-results` and `api.log` artifacts (US4) |
| V8 | Run `pnpm lint && pnpm build` | Both pass with `e2e/` and `playwright.config.ts` included |

## CI setup (one time, repo admin)

Add these repository secrets: `API_REPO_TOKEN` (read-only on `koller-nexus/api-kottagroups`),
`E2E_EMAIL` and `E2E_PASSWORD`.
