<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Kotta Groups

Visual landing of the Kotta Groups product. Follow `DESIGN.md` and `lib/theme.ts` for color, type, radius, and spacing. The product name in the UI is **Kotta Groups**.

Store badges on `/` MUST keep official Portuguese copy, two lines, same height, side by side:

- App Store: `Baixar na` / `App Store`
- Google Play: `Disponível no` / `Google Play`

Do not replace that copy with “Em breve”. “Em breve” is a separate label. Badges MUST NOT navigate to the stores.

## Installed skills

Use these skills when the task matches. Project copies live under `.agents/skills/` (Spec Kit commands also under `.claude/skills/`).

### Product UI

- @.agents/skills/frontend-design/SKILL.md
- @.agents/skills/ui-ux-pro-max/SKILL.md
- @.agents/skills/frontend-patterns/SKILL.md

### Next.js / React

- @.agents/skills/nextjs-turbopack/SKILL.md
- @.agents/skills/vercel-react-best-practices/SKILL.md
- @.agents/skills/vercel-react-best-practices/AGENTS.md

### Security

Use when asked for a security audit, security review, or defensive pen test of this code.

- @.agents/skills/security-audit/SKILL.md

### Spec Kit

- @.agents/skills/speckit-specify/SKILL.md
- @.agents/skills/speckit-plan/SKILL.md
- @.agents/skills/speckit-tasks/SKILL.md
- @.agents/skills/speckit-implement/SKILL.md
- @.agents/skills/speckit-constitution/SKILL.md
- @.agents/skills/speckit-clarify/SKILL.md
- @.agents/skills/speckit-analyze/SKILL.md
- @.agents/skills/speckit-checklist/SKILL.md
- @.agents/skills/speckit-converge/SKILL.md
- @.agents/skills/speckit-taskstoissues/SKILL.md
