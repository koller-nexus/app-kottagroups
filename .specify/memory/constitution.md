<!--
Sync Impact Report
- Version change: (unratified scaffold) → 1.0.0
- Modified principles:
  - scaffold principle 1 → I. Simplicity First
  - scaffold principle 2 → II. Clean Code
  - scaffold principle 3 → III. Organized Structure
  - scaffold principle 4 → IV. Best Practices
  - scaffold principle 5 → V. Testable by Default
- Added sections:
  - Stack & Constraints
  - Development Workflow
  - Governance (filled)
- Removed sections: none (scaffold placeholders replaced)
- Follow-up TODOs: none
-->

# Kotta Groups Constitution

## Core Principles

### I. Simplicity First

Every change MUST solve the stated requirement with the smallest working design.
Contributors MUST NOT add abstractions, layers, flags, or dependencies until a
concrete use case requires them (YAGNI). Duplicate a small amount of code when
that is clearer than a premature shared helper. Complexity MUST be justified in
the PR description with the problem it prevents. If two designs meet the spec,
the simpler one MUST win.

Rationale: Simple code is cheaper to review, debug, and change. Overbuilding is
the default failure mode of feature work and MUST be treated as a defect.

### II. Clean Code

Code MUST be readable as prose: names describe intent, functions do one thing,
and modules stay short enough to review in one sitting. Contributors MUST
prefer explicit control flow over cleverness. Comments MUST explain *why*, never
restate *what*. Dead code, commented-out blocks, TODOs without an owner, and
placeholder implementations MUST NOT ship. Public APIs, HTTP error messages,
and validation text MUST be in English. Identifier names MUST be in English.

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
lint configuration. Server Actions and route handlers MUST authenticate and
authorize inside the handler, not only in layouts. Independent async work MUST
run in parallel (`Promise.all` or equivalent) instead of sequential waterfalls.
User-visible mutations MUST validate input before side effects. Secrets MUST
never be committed. Each feature or behavior change MUST increment the project
`VERSION` file when that file exists; if it does not exist yet, the change that
introduces versioning MUST add it.

Rationale: Best practices here are the Next.js/React and security defaults of
this codebase, not generic slogans. Violations create production incidents.

### V. Testable by Default

Behavior MUST be written so it can be verified without the full UI when
practical: pure functions for rules, small modules for I/O. New behavior MUST
include a test or an explicit, written reason why a test is not applicable
(for example, a one-line copy change). Tests MUST assert observable outcomes,
not implementation trivia. Flaky tests MUST be fixed or removed; they MUST NOT
be skipped indefinitely.

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
3. Lint MUST pass (`pnpm lint`). Build MUST pass for user-visible or runtime
   changes (`pnpm build`) unless the PR is docs-only.
4. Review MUST check: simplicity, naming, structure, security of mutations,
   and absence of secrets.
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
the exception, the expiry or follow-up, and the owner.

Runtime guidance for agents and developers MUST follow this constitution
first, then `AGENTS.md` and installed Next.js docs.

**Version**: 1.0.0 | **Ratified**: 2026-09-14 | **Last Amended**: 2026-09-14
