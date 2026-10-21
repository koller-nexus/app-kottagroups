# Implementation Plan: Destino de retorno ("next") nunca leva para outro site

**Branch**: `feature/022-safe-next-redirect` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/022-safe-next-redirect/spec.md`

## Summary

`safeNextPath` olha só o começo do texto, e `/<TAB>/host`, `/.//host` e parecidos passam e viram
`//host` no navegador. A correção troca a checagem de prefixo pela regra da issue #46: recusar
caracteres de controle, DEL e `\`; resolver o valor com `URL` contra uma base fictícia; exigir a
mesma origem; recusar caminho normalizado que comece com `//`; devolver o caminho normalizado
(ver [research.md](research.md) R2). Todas as 13 chamadas já passam por essa função, então a
correção fica nela e nenhum ponto de uso muda (R1). Os casos da auditoria entram em
`lib/safe-next.test.mjs`.

## Technical Context

**Language/Version**: TypeScript 5 (strict), Next.js 16.3 (App Router), Node 24

**Primary Dependencies**: nenhuma nova (`URL` da plataforma)

**Storage**: N/A

**Testing**: `pnpm test` (node:test em `lib/*.test.mjs`)

**Target Platform**: web (servidor Next na Vercel; a função roda no servidor)

**Project Type**: web application (front de `api-kottagroups`)

**Performance Goals**: N/A (um `new URL` por requisição)

**Constraints**: assinatura de `safeNextPath` igual; destinos legítimos levam à mesma página de hoje

**Scale/Scope**: 1 arquivo de código + 1 de teste

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Nota |
|-----------|--------|------|
| I. Simplicity First | ✅ | `URL` da plataforma, sem dependência; correção num só lugar (R1); sem opção nova na função. |
| II. Clean Code | ✅ | Função curta, guard clauses; comentário só para o porquê do `//` final. Nomes em inglês. |
| III. Organized Structure | ✅ | Muda só o dono da regra, `lib/safe-next.ts`; nenhum arquivo novo de código. |
| IV. Best Practices | ✅ | Valida no limite de entrada, como pede o princípio. Nenhuma API do Next muda. Sem arquivo `VERSION` no projeto, nada a incrementar. |
| V. Testable by Default | ✅ | Função pura; tabela do [contrato](contracts/safe-next-path.md) vira teste, mais idempotência (R5). |

Pós-design: sem mudança; nenhuma violação.

## Project Structure

### Documentation (this feature)

```text
specs/022-safe-next-redirect/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/safe-next-path.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
lib/safe-next.ts         # nova regra (R2), mesma assinatura
lib/safe-next.test.mjs   # casos da auditoria, legítimos, fallback por ponto de uso, idempotência
```

Sem mudança: `app/sair/route.ts`, as páginas de `app/(acesso)/`, `app/actions/auth.ts`,
`app/actions/invoices.ts`, `lib/session-flow.ts` e `lib/api/server.ts`. Todos já chamam
`safeNextPath` antes de redirecionar.

**Structure Decision**: app Next.js único na raiz; mudança nos dois arquivos acima.

## Complexity Tracking

Sem violações.
