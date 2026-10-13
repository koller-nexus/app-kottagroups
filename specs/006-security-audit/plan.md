# Implementation Plan: Auditoria de segurança do front

**Branch**: `feature/006-security-audit` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-security-audit/spec.md`

## Summary

Instalar a skill `security-audit` (`cloudflare/security-audit-skill`, mesma origem do
`api-kottagroups`), rodar `pnpm audit` (prod e completo), lint, testes e `trivy`, executar uma
rodada `standard` da skill sobre `main` com saída em `~/security-audit-skill/app-kottagroups/run-1`,
validar com os dois validadores e publicar os resultados no GitHub (comentário na #10, uma issue por
achado `confirmed`, cruzando auth/sessão com a run-9 da API). Nenhum código do app muda.

## Technical Context

**Language/Version**: TypeScript / Next.js 16.3.5, React 19.2.8 (alvo da auditoria); validadores da
skill em Node (`.cjs`)

**Primary Dependencies**: skill `security-audit`; CLI `skills` via `pnpm dlx`; `pnpm audit`; `gh`;
`trivy` (já instalado). `semgrep` ausente → não usado.

**Storage**: arquivos JSON/MD fora do repo (`~/security-audit-skill/app-kottagroups/run-<N>`)

**Testing**: `validate-findings.cjs`, `validate-coverage-ledger.cjs`, `pnpm lint`, `pnpm test`

**Target Platform**: máquina local do mantenedor (macOS), sem rede para produção

**Project Type**: web app (Next.js App Router) — esta feature é um processo de auditoria + docs

**Performance Goals**: N/A

**Constraints**: sem requisições a Vercel/API de produção (FR-009); sem segredos em issues
(FR-013); orçamento de 30 invocações de agente na rodada da skill

**Scale/Scope**: repo inteiro (~154 arquivos); 9 superfícies prioritárias (FR-006)

Nenhum `NEEDS CLARIFICATION` restante — ver [research.md](research.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Nota |
|-----------|--------|------|
| I. Simplicity First | ✅ | Só ferramentas já existentes (`pnpm audit`, `gh`, `trivy`); nenhuma dependência de runtime nova; CI só avaliada. |
| II. Clean Code | ✅ | Nenhum código de app. |
| III. Organized Structure | ✅ | Skill em `.agents/skills/` como as demais; artefatos fora do repo. |
| IV. Best Practices | ✅ | Audita justamente as regras de IV (auth em Server Actions, `server-only`, validação, segredos). Sem `VERSION` (arquivo não existe; regra já sinalizada na constituição). |
| V. Testable by Default | ✅ (justificado) | Sem lógica nova; verificação = validadores da skill + `quickstart.md`. Testes da skill (`*.test.cjs`) vêm com ela. |
| Workflow / branch | ⚠️ ação | Trabalho atual está em `main`; criar `feature/006-security-audit` antes de commitar. |

Pós-design: sem mudanças; gate passa.

## Project Structure

### Documentation (this feature)

```text
specs/006-security-audit/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── finding-issue.md      # formato da issue por achado confirmado
│   └── tracker-comment.md    # formato do comentário na #10
└── tasks.md                  # /speckit-tasks
```

### Source Code (repository root)

```text
.agents/skills/security-audit/   # novo: cópia da skill (SKILL.md, companions, validadores)
skills-lock.json                 # +entrada security-audit
AGENTS.md                        # +seção "### Security" em Installed skills
```

Fora do repo (não versionado):

```text
~/security-audit-skill/app-kottagroups/run-1/
├── run-metadata.json
├── coverage-ledger.json
├── findings.json
└── REPORT.md (+ notas/agents da skill)
```

**Structure Decision**: mudança só em metadados de skills; a auditoria em si produz artefatos
externos e issues no GitHub.

## Complexity Tracking

Nenhuma violação a justificar.
