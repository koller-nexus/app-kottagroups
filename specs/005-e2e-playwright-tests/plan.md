# Implementation Plan: Testes E2E dos fluxos principais

**Branch**: `feature/005-e2e-playwright-tests` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-e2e-playwright-tests/spec.md`

## Summary

Add a Playwright suite (`pnpm test:e2e`, tests in `e2e/`) that drives the app in Chromium against
the real `api-kottagroups` running with its dev seed. A `setup` project checks that the API is
reachable, logs in once and saves `storageState`. The spec files cover access, dashboard, groups,
expenses, shopping list, notes/notifications and profile/categories. They use role and label
selectors and names with a per-run suffix. A `pull_request` workflow starts Postgres and Redis,
runs the API from `develop`, builds the app and runs the suite. On failure it uploads the report,
the traces and the API log. The README documents the local run.

## Technical Context

**Language/Version**: TypeScript 5 (strict), Node 22. The app runs through bun (`dev`, `build`,
`start` scripts).

**Primary Dependencies**: `@playwright/test@1.64.0` (new, dev-only), Next.js 16.3.5 and React
19.2.8 (existing).

**Storage**: None in this repo. The suite writes to the API's Postgres through the app. Session
state goes to `e2e/.auth/user.json` (gitignored).

**Testing**: Playwright for E2E. `node --test` for unit tests is unchanged.

**Target Platform**: Chromium. CI runs on `ubuntu-latest` GitHub Actions.

**Project Type**: Web application (Next.js App Router frontend). The backend lives in a separate
repo.

**Performance Goals**: Full suite under 5 minutes in CI (SC-002).

**Constraints**:

- Data comes from the server, so `page.route()` is not used.
- The auth rate limit is raised for test runs (research R3).
- No credentials are committed (FR-012).
- `API_ORIGIN` is required at build time (research R5).

**Scale/Scope**: 7 spec files and about 20 tests covering every flow in issue #9. There is one
workflow.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ | Real API instead of a hand-written mock. Postgres + Redis services instead of the full observability compose stack. One helper (`run-id.ts`) is used by 5 files. No page objects or custom fixtures beyond the `storageState` setup. The new devDependency is justified in research R4 and in the PR |
| II. Clean Code | ✅ | English identifiers. Test titles describe the user outcome. Named constants for the port, the auth path and the runId |
| III. Organized Structure | ✅ | Everything lives in `e2e/`, with one spec file per capability (contract file list) |
| IV. Best Practices | ✅ | No app code changes are planned. If an element lacks an accessible name, the fix is to add a label in the component, which raises the accessibility floor. Secrets stay in env vars and CI secrets. The `VERSION` file rule does not apply because there is no `VERSION` file (the same follow-up the constitution already records) |
| V. Testable by Default | ✅ with note | The principle names `lib/**/*.test.mjs` under `pnpm test` for unit rules. E2E is a separate layer with its own command, and `pnpm test` stays unchanged. The rule against flaky tests is enforced by SC-005 and `retries: 0` in CI |
| Workflow | ✅ | `pnpm lint`, `pnpm test` and `pnpm build` must still pass with `e2e/` included (quickstart V8). Work lands through a PR from a feature branch |

Post-design re-check: still passing. There are no violations, so Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/005-e2e-playwright-tests/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── e2e-runner.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
package.json                 # + "test:e2e": "playwright test", + @playwright/test devDependency
playwright.config.ts         # baseURL :3002, setup → chromium projects, webServer, CI reporters
.gitignore                   # + /e2e/.auth/, /playwright-report/, /test-results/
e2e/
├── auth.setup.ts
├── run-id.ts
├── access.spec.ts
├── dashboard.spec.ts
├── groups.spec.ts
├── expenses.spec.ts
├── shopping-list.spec.ts
├── notes-notifications.spec.ts
└── profile.spec.ts
.github/workflows/e2e.yml    # first workflow in this repo
README.md                    # + "Testes E2E" section
```

**Structure Decision**: A single Next.js project. The E2E tests sit in a top-level `e2e/` folder,
separate from the `lib/*.test.mjs` unit tests, as issue #9 asks. Components change only if a
control has no accessible name, and then only to add the label.

## Risks

- **Cross-repo token**: if `API_REPO_TOKEN` is missing, the workflow fails at checkout. The README
  and the PR describe the one-time secret setup.
- **API `develop` drift**: a breaking API change can turn web PRs red. This is intended: it is the
  integration signal. The API log artifact makes the cause visible.
- **Missing accessible names**: some controls (icon buttons, for example) may have no
  role or label to select by. These get fixed in place as part of the relevant user story task.

## Complexity Tracking

No constitution violations to justify.
