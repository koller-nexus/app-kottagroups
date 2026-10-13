# Data Model: Testes E2E dos fluxos principais

The suite stores no app data of its own. It only adds the test-time entities below.

## Test user

| Field | Source | Rule |
|-------|--------|------|
| email | `E2E_EMAIL` env / CI secret | Required. A dev-seed account, for example the primary demo email in the API's `docs/environment.md` |
| password | `E2E_PASSWORD` env / CI secret | Required, never committed (FR-012) |

The user must belong to at least one group that has a shopping list. The dev seed already does
this. If one is missing, the shopping-list test creates the list first.

## Session state

| Field | Value |
|-------|-------|
| path | `e2e/.auth/user.json` (gitignored) |
| lifecycle | Written by the `setup` project on every run. It is never reused across runs (spec edge case: expired session) |
| contents | Playwright `storageState`: the `kotta_session` cookie (httpOnly, 24 h) |

## Run-scoped test data

| Entity | Name pattern | Created by |
|--------|--------------|------------|
| Group | `E2E grupo {runId}` → edited to `E2E grupo {runId} editado` | `e2e/groups.spec.ts` |
| Expense | `E2E despesa {runId}` | `e2e/expenses.spec.ts` |
| Shopping item | `E2E item {runId}` | `e2e/shopping-list.spec.ts` |
| Category | `E2E categoria {runId}` | `e2e/profile.spec.ts` |
| Sign-up account | `e2e+{runId}@example.com` | `e2e/access.spec.ts` |

`runId` = `Date.now().toString(36)`, computed once per process in `e2e/run-id.ts`.

Validation: tests assert that the named item is visible. They never assert list lengths or
totals, because data from earlier runs stays in the database (FR-013).
