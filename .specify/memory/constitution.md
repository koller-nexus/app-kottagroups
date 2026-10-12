<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (MINOR: principles materially expanded, no removals)
- Modified principles (titles unchanged, rules expanded):
  - I. Simplicity First: added the reuse-first decision ladder, dependency gate,
    and banned speculative abstractions (single-implementation interfaces,
    config for constants, scaffolding "for later")
  - II. Clean Code: added measurable size/nesting limits, named constants,
    no behavior-switching boolean params, explicit error handling
  - IV. Best Practices: added Server Components by default, `server-only`
    for secret-bearing modules, design tokens over raw values, accessibility floor
  - V. Testable by Default: tied tests to `pnpm test` and the `lib/*.test.mjs`
    convention
- Added sections: none
- Removed sections: none
- Development Workflow: step 3 now requires `pnpm test`
- Follow-up TODOs:
  - Principle IV keeps the `VERSION` file rule; no `VERSION` file exists today
    (removed in commit "chore: remove version"). Confirm whether to reintroduce
    it or amend the rule in a future PATCH/MAJOR.
-->

# Kotta Groups Constitution

## Core Principles

### I. Simplicity First

Every change MUST solve the stated requirement with the smallest working design.
Before writing code, contributors MUST stop at the first option that works:

1. The behavior is not actually required (YAGNI) — do not build it.
2. The codebase already has it (`lib/`, `components/`, existing patterns) — reuse it.
3. The language standard library or web platform covers it (native HTML
   elements, CSS, `Intl`, `URL`, `fetch`) — use it.
4. An already-installed dependency covers it — use it.
5. Only then write the minimum new code.

Rules:

- New runtime dependencies MUST be justified in the PR description (what it
  replaces, why a few lines of code would not do). A dependency MUST NOT be
  added for something achievable in under ~20 lines.
- Interfaces with a single implementation, factories for a single product,
  configuration for values that never change, and scaffolding "for later"
  MUST NOT be added.
- Duplicating a small amount of code is preferred over a premature shared
  helper; extract only on the third real use.
- Complexity MUST be justified in the PR description with the problem it
  prevents. If two designs meet the spec, the simpler one MUST win.
- Deletion is preferred over addition: unused code, props, and options MUST
  be removed in the same change that makes them unused.

Rationale: Simple code is cheaper to review, debug, and change. Overbuilding is
the default failure mode of feature work and MUST be treated as a defect.

### II. Clean Code

Code MUST be readable as prose: names describe intent, functions do one thing,
and modules stay short enough to review in one sitting.

- Names MUST reveal intent (`splitEvenly`, `isOverdue`), not type or mechanics
  (`data`, `handleStuff`, `flag2`). Booleans read as questions (`is`, `has`,
  `can`). Identifier names MUST be in English.
- Functions SHOULD stay under 40 lines; React components over 200 lines MUST
  be split or the PR MUST justify the size. Nesting deeper than 3 levels MUST
  be flattened with early returns or guard clauses.
- Magic numbers and strings with domain meaning MUST be named constants.
- Boolean parameters that switch a function between two behaviors MUST NOT be
  used; write two functions or pass an explicit option object.
- Errors MUST be handled explicitly: never swallowed silently, never caught
  only to be logged and ignored on a path that loses user data.
- Prefer explicit control flow over cleverness. Comments MUST explain *why*,
  never restate *what*.
- Dead code, commented-out blocks, TODOs without an owner, and placeholder
  implementations MUST NOT ship.
- Public APIs, HTTP error messages, and validation text MUST be in English.

Rationale: The next reader is a teammate or an agent under time pressure.
Unreadable code cannot be governed, tested, or safely changed.

### III. Organized Structure

Code MUST live next to the feature it serves. New behavior MUST be grouped by
capability (route, domain, or user flow), not dumped into catch-all folders.
Shared utilities MUST have a single, documented purpose; they MUST NOT become
a junk drawer. Files MUST have one primary export responsibility. Imports MUST
be direct and obvious; barrel files MUST NOT be added unless the project
already depends on them for a measured reason. Server, client, and data-access
boundaries MUST stay explicit.

Rationale: Organization is how the team finds and changes code. A messy tree
hides duplication and makes every feature slower.

### IV. Best Practices

Contributors MUST follow the platform rules of this app: current Next.js docs
under `node_modules/next/dist/docs/`, TypeScript strictness, and the project
lint configuration.

- Components MUST be Server Components by default. `"use client"` MUST be
  added only to the smallest component that needs state, effects, or browser
  APIs — never to a whole page for one interactive element.
- Modules that read secrets, session tokens, or call the backend API with
  credentials MUST import `server-only` (as `lib/api/server.ts` does).
- Server Actions and route handlers MUST authenticate and authorize inside the
  handler, not only in layouts.
- User-visible mutations MUST validate input before side effects. Unknown data
  MUST be validated at the boundary where it enters the app.
- Independent async work MUST run in parallel (`Promise.all` or equivalent)
  instead of sequential waterfalls.
- UI MUST use the design tokens from `DESIGN.md`, `lib/theme.ts`, and the
  `kotta-*` classes in `app/globals.css`; raw hex colors and ad-hoc spacing
  MUST NOT be introduced in components.
- Accessibility floor: interactive elements MUST be reachable and operable by
  keyboard with a visible focus state, images MUST have `alt` text, form
  fields MUST have visible labels, and motion MUST respect
  `prefers-reduced-motion`.
- Secrets MUST never be committed.
- Each feature or behavior change MUST increment the project `VERSION` file
  when that file exists; if it does not exist yet, the change that introduces
  versioning MUST add it.

Rationale: Best practices here are the Next.js/React, security, and design
defaults of this codebase, not generic slogans. Violations create production
incidents or visual drift.

### V. Testable by Default

Behavior MUST be written so it can be verified without the full UI when
practical: pure functions for rules (money, splits, permissions, dates) in
`lib/`, small modules for I/O. New behavior MUST include a test or an
explicit, written reason why a test is not applicable (for example, a
one-line copy change). Tests live beside the module as `lib/**/*.test.mjs`
and MUST run under `pnpm test`. Tests MUST assert observable outcomes, not
implementation trivia. One focused test that fails when the logic breaks is
preferred over broad suites of trivial assertions. Flaky tests MUST be fixed
or removed; they MUST NOT be skipped indefinitely.

Rationale: Untestable code is ungovernable. Tests lock the simplicity and
structure the other principles require.

## Stack & Constraints

This repository is a Next.js App Router application (`app-kottagroups`) using
TypeScript, React, Tailwind CSS, and `pnpm` as the package manager.

- Application source MUST stay TypeScript. `any` MUST NOT be introduced to
  silence errors; unknown data MUST be validated at the boundary.
- Package manager for installs and scripts MUST be `pnpm`.
- Before writing Next.js APIs, contributors MUST read the installed docs in
  `node_modules/next/dist/docs/` rather than relying on older training data.
- API and HTTP error messages MUST be English. Commit messages MUST be English
  and MUST follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`,
  `test:`, `chore:`).
- Direct commits to `develop` (and to `main` except documented release
  process) are forbidden. Work MUST land through a dedicated branch and a
  Pull Request.

## Development Workflow

1. Specify the change (spec or equivalent) before large implementation.
2. Implement the smallest diff that satisfies the spec and this constitution.
3. Lint MUST pass (`pnpm lint`). Tests MUST pass (`pnpm test`). Build MUST
   pass for user-visible or runtime changes (`pnpm build`) unless the PR is
   docs-only.
4. Review MUST check: simplicity (could anything be deleted or reused?),
   naming, size limits, structure, client/server boundaries, security of
   mutations, and absence of secrets.
5. Merge only via Pull Request. Feature, fix, and agent branches MUST be used
   (`feature/`, `fix/`, `agent/` or equivalent).

Code review is a compliance gate for this constitution, not a courtesy.

## Governance

This constitution supersedes informal habits, chat suggestions, and
convenience shortcuts when they conflict.

Amendments MUST be proposed as a change to `.specify/memory/constitution.md`
with: the principle or rule being changed, the reason, and a migration note
if existing code will be non-compliant. Amendments require review through the
same Pull Request process as application code.

Versioning policy:

- MAJOR: a principle is removed or redefined in a backward-incompatible way.
- MINOR: a principle or section is added or materially expanded.
- PATCH: clarifications, wording, and non-semantic refinements.

Compliance review: every PR MUST be checkable against these principles. If a
change cannot comply (emergency, third-party constraint), the PR MUST record
the exception, the expiry or follow-up, and the owner. Existing code that
predates a rule is not required to change until it is touched; code touched
by a PR MUST comply.

Runtime guidance for agents and developers MUST follow this constitution
first, then `AGENTS.md` and installed Next.js docs.

**Version**: 1.1.0 | **Ratified**: 2026-09-14 | **Last Amended**: 2026-10-12
