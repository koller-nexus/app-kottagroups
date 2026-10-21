---

description: "Tasks: destino de retorno nunca leva para outro site (issue #46)"
---

# Tasks: Destino de retorno ("next") nunca leva para outro site

**Input**: Design documents from `/specs/022-safe-next-redirect/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/safe-next-path.md](./contracts/safe-next-path.md),
[quickstart.md](./quickstart.md)

**Tests**: pedidos pela spec (FR-007) e pela Constituição V. Escrever os casos antes da regra e ver
falhar.

**Regras do repo**: `pnpm`; sem dependência nova (usar `URL` da plataforma); assinatura de
`safeNextPath(value: unknown, fallback = "/"): string` igual; nenhum ponto de uso muda (plan,
Source Code); identificadores em inglês, comentários explicam o porquê.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência pendente)
- **[Story]**: história da spec (US1–US3)

---

## Phase 1: Setup

- [X] T001 Na branch `feature/022-safe-next-redirect`, rodar `pnpm lint` e `pnpm test` e anotar falhas pré-existentes

---

## Phase 2: Foundational

Nada bloqueante: todas as 13 chamadas já passam por `safeNextPath` (research R1).

---

## Phase 3: User Story 1 - Link malicioso para /sair não leva a outro site (Priority: P1) 🎯 MVP

**Goal**: a regra nova de `safeNextPath` recusa todo destino que o navegador leria como outro site.

**Independent Test**: `pnpm test` com os casos de ataque; quickstart, passos 1 e 2 (`curl` em `/sair`).

### Tests for User Story 1

- [X] T002 [US1] Em `lib/safe-next.test.mjs`, acrescentar o teste "safeNextPath rejects targets the browser would read as another origin": `/\t/x`, `/\n/x`, `/\r/x`, `/\t\x`, `/.//x`, `/..//x`, `/%2e//x` e `/x/..//y` devolvem `/`; acrescentar `""` ao teste de recusa existente. Rodar `pnpm test` e ver falhar (contrato, tabela; FR-002, FR-003, FR-007)

### Implementation for User Story 1

- [X] T003 [US1] Em `lib/safe-next.ts`, trocar o corpo de `safeNextPath` pela regra de research R2, nesta ordem: (1) devolver `fallback` se `value` não é string, não começa com `/` ou casa `/[\u0000-\u001f\u007f\\]/`; (2) `const base = new URL("http://n.invalid")` e `const url = new URL(value, base)`; (3) devolver `fallback` se `url.origin !== base.origin`; (4) `const path = \`${url.pathname}${url.search}${url.hash}\``, devolver `fallback` se `path.startsWith("//")`, senão `path`. Comentário só no passo 4: `/.//x` normaliza para `//x`, que vira outra origem ao ser resolvido de novo. Manter o JSDoc da função e o regex fora do corpo como constante nomeada (ex.: `UNSAFE_CHARS`). Depois de T002

**Checkpoint**: `pnpm test` passa; `curl` do quickstart passo 1 termina em `/entrar` sem `next`.

---

## Phase 4: User Story 2 - Depois de entrar, a pessoa nunca é mandada para outro site (Priority: P1)

**Goal**: provar que os pontos de uso herdam a regra, inclusive com destino padrão próprio.

**Independent Test**: `pnpm test`; quickstart, passo 3.

### Tests for User Story 2

- [X] T004 [P] [US2] Em `lib/safe-next.test.mjs`, acrescentar o teste "safeNextPath falls back to the caller default": `safeNextPath("/\t/x", "/grupos/g/notas/n")` devolve `"/grupos/g/notas/n"` (fallback de `app/actions/invoices.ts`; FR-005). Depois de T003 (mesmo arquivo)
- [X] T005 [P] [US2] Em `lib/session-flow.test.mjs`, no teste "expiredSessionUrl falls back to / for unsafe paths", acrescentar `"/\t/x"` e `"/.//x"` à lista de caminhos (FR-006: o fluxo de sessão do servidor herda a regra)

**Checkpoint**: `pnpm test` passa; entrar por `/entrar?next=/%09/evil.example` cai na página inicial.

---

## Phase 5: User Story 3 - Destinos internos legítimos continuam funcionando (Priority: P1)

**Goal**: travar que caminhos internos saem iguais (ou só normalizados) e que a função é idempotente.

**Independent Test**: `pnpm test`; quickstart, passo 4.

### Tests for User Story 3

- [X] T006 [US3] Em `lib/safe-next.test.mjs`, acrescentar o teste "safeNextPath keeps query and hash and normalizes dot segments": `/convites/x?origem=link#aceitar` sai igual e `/grupos/../perfil` sai `/perfil` (FR-004); e o teste "safeNextPath is idempotent": para cada entrada usada no arquivo, `safeNextPath(safeNextPath(x)) === safeNextPath(x)` (research R5). Depois de T004 (mesmo arquivo)

**Checkpoint**: `pnpm test` passa; os testes existentes de `lib/session-flow.test.mjs` com `/grupos/1?aba=saldos` continuam iguais.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T007 Rodar `pnpm lint`, `pnpm test` e `pnpm build`; percorrer os passos manuais de `specs/022-safe-next-redirect/quickstart.md` (feito: lint, test, build e passo 1 com `curl`; faltam os passos 2–4, que pedem login no navegador)
- [X] T008 Conferir que nenhum ponto de uso mudou: `git diff --stat main` lista só `lib/safe-next.ts`, `lib/safe-next.test.mjs`, `lib/session-flow.test.mjs` e `specs/022-safe-next-redirect/`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (T001) → US1 (T002 → T003) → US2 (T004, T005) e US3 (T006) → Polish (T007, T008)

### User Story Dependencies

- **US1**: nenhuma; contém a única mudança de código
- **US2** e **US3**: só testes; dependem de T003 para passar

### Parallel Opportunities

- T004 e T005 mexem em arquivos diferentes
- T005 pode ser escrito junto com T002 (falha até T003)
- T002, T004 e T006 são o mesmo arquivo: em sequência

## Parallel Example: User Story 2

```text
T004 lib/safe-next.test.mjs
T005 lib/session-flow.test.mjs
```

## Implementation Strategy

- **MVP**: T001–T003 (US1). Fecha o open redirect em todos os pontos de uso.
- Depois T004–T006 travam o fallback por ponto de uso, os destinos legítimos e a idempotência.
- Tudo cabe num PR só: 1 arquivo de código e 2 de teste.
