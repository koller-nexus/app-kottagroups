# Implementation Plan: Re-auditoria de segurança do front

**Branch**: `feature/020-security-reaudit` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/020-security-reaudit/spec.md`

## Summary

Segunda rodada da skill `security-audit` (já instalada na 006) sobre `main` @ `36f6150`, perfil
`standard`, saída em `~/security-audit-skill/app-kottagroups/run-2`, carregando a `run-1` como
rodada anterior. Antes da rodada: `pnpm audit` (prod e completo, comparado com a run-1), lint,
testes e `trivy`. Depois: validadores da skill, uma issue de acompanhamento nova (a #10 está
fechada), atualização da #46 (achado herdado) e uma issue por achado `confirmed` novo. Nenhum
código do app muda.

## Technical Context

**Language/Version**: TypeScript / Next.js 16.3.5, React 19.2.8 (alvo); validadores da skill em
Node (`.cjs`)

**Primary Dependencies**: skill `.agents/skills/security-audit/` (já versionada); `pnpm audit`;
`gh` (autenticado); `trivy` (`/opt/homebrew/bin`). `semgrep` ausente → não usado, não instalado.

**Storage**: JSON/MD fora do repo (`~/security-audit-skill/app-kottagroups/run-2`)

**Testing**: `validate-findings.cjs`, `validate-coverage-ledger.cjs`, `pnpm lint`, `pnpm test`

**Target Platform**: máquina local do mantenedor (macOS), sem rede para produção

**Project Type**: web app (Next.js App Router); esta feature é processo de auditoria + docs

**Performance Goals**: N/A

**Constraints**: zero requisições a Vercel/API de produção (FR-008); sem segredos/tokens em issues
(FR-011); orçamento de 30 invocações de agente; o host não oferece o sandbox exigido pela skill →
rodada só por leitura (mesmo critério da run-1)

**Scale/Scope**: 174 arquivos de app (`app/`, `lib/`, `components/`, `proxy.ts`,
`next.config.ts`); 8 superfícies novas (FR-003) + 4 itens herdados da run-1 (FR-002)

Nenhum `NEEDS CLARIFICATION` restante; ver [research.md](research.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Nota |
|-----------|--------|------|
| I. Simplicity First | ✅ | Reusa skill, contratos e roteiro da 006; nenhuma dependência nova. |
| II. Clean Code | ✅ | Nenhum código de app. |
| III. Organized Structure | ✅ | Só `specs/020-security-reaudit/`; artefatos da rodada fora do repo. |
| IV. Best Practices | ✅ | A auditoria verifica as próprias regras de IV (auth em Server Actions, `server-only`, validação, segredos). |
| V. Testable by Default | ✅ (justificado) | Sem lógica nova; verificação = validadores da skill + [quickstart.md](quickstart.md). |
| Workflow / branch | ⚠️ ação | Trabalho em `main`; criar `feature/020-security-reaudit` antes de commitar. |

Pós-design: sem mudanças; gate passa.

## Project Structure

### Documentation (this feature)

```text
specs/020-security-reaudit/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── finding-issue.md      # issue por achado confirmado novo
│   └── tracker-issue.md      # issue de acompanhamento da run-2
├── checklists/requirements.md
└── tasks.md                  # /speckit-tasks
```

### Source Code (repository root)

Nenhum arquivo de app muda (FR-012). Fora do repo, não versionado:

```text
~/security-audit-skill/app-kottagroups/run-2/
├── run-metadata.json  architecture.md  coverage-ledger.json  findings.json
├── REPORT.md  FINDINGS-DETAIL.md  NEEDS-VALIDATION.md
├── deps/              # saída de pnpm audit, lint, test, trivy
└── agents/<id>/       # scratch/artifacts por agente
```

**Structure Decision**: feature só de documentação + processo; mesma forma da 006.

## Complexity Tracking

Sem violações.
