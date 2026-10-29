# Implementation Plan: Consultar o status das notas em lote no acompanhamento

**Branch**: `feature/028-batch-invoice-status` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/028-batch-invoice-status/spec.md`

## Summary

A API (api#255, PR api#256) publicou `GET /invoices/status?ids=…`: até 20 notas numa requisição,
omitindo as que a pessoa não pode ver. A rota `app/api/notas/status/route.ts` troca os até 20
`getInvoice` em paralelo por uma única `getInvoiceStatuses(ids)`. A resposta para a tela continua
`{ items: [{ id, status }] }`, então `InvoiceStatusWatcher` não muda.

Três ajustes acompanham a troca:

- `skipMissing` sai, porque a API já faz essa filtragem.
- `parseStatusIds` passa a aceitar só o ULID canônico da API (R2), para um id ruim não derrubar o
  lote.
- O proxy de mock do e2e aplica as simulações de status também ao lote (R5).

## Technical Context

**Language/Version**: TypeScript 5 (strict), Node 20+

**Primary Dependencies**: Next.js 16.4.2 (route handler), React 19.2. Nenhuma dependência nova.

**Storage**: N/A

**Testing**:

- `pnpm test` (node:test, `lib/*.test.mjs`)
- `pnpm test:e2e` (Playwright, API real atrás de `e2e/mock-api-proxy.ts`, `workers: 1`)

**Target Platform**: Vercel; e2e em `next start` local contra a API de teste

**Project Type**: web app Next.js (BFF da `api-kottagroups`)

**Performance Goals**: 1 chamada à API por ciclo do acompanhamento, em vez de N (SC-001)

**Constraints**:

- A resposta da rota não muda de formato (FR-002).
- Id inválido nunca chega à API (FR-004).
- Os erros continuam como hoje (FR-006, FR-007).

**Scale/Scope**:

- 4 arquivos de código: `lib/api/kotta.ts`, `lib/api/types.ts`, `lib/poll-schedule.ts` e a rota.
- 1 teste unitário ajustado.
- O mock do e2e ganha o overlay do lote.
- 1 teste e2e novo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Situação |
|-----------|----------|
| I. Simplicity First | ✅ Remove código (`skipMissing`, o `Promise.all` de N chamadas). Reusa `apiRequest`, `parseStatusIds` e o `/__mock/last-headers` da spec 026. Sem fallback para a API antiga (R6). Sem dependência nova. |
| II. Clean Code | ✅ `getInvoiceStatuses` e `ApiInvoiceStatusItem` em inglês. O regex do ULID vira constante nomeada. Os erros continuam explícitos no `catch` da rota. |
| III. Organized Structure | ✅ A chamada fica em `lib/api/kotta.ts`, o tipo em `lib/api/types.ts` e a validação em `lib/poll-schedule.ts`, cada um onde já estava. |
| IV. Best Practices | ✅ O handler continua autenticando (sessão) e validando `ids` antes da chamada. `server-only` vem pelo `apiRequest`. Sem UI nova. |
| V. Testable by Default | ✅ `lib/poll-schedule.test.mjs` cobre a tabela do `data-model.md`; o e2e cobre FR-009. |
| Workflow | ✅ Branch `feature/028-batch-invoice-status` criada a partir de `main`. Lint, test, e2e e build no PR. Sem arquivo `VERSION` (follow-up da constituição). |

Sem violações; Complexity Tracking vazio. Re-check pós-design: mantido.

## Project Structure

### Documentation (this feature)

```text
specs/028-batch-invoice-status/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── notas-status.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
lib/
├── api/
│   ├── types.ts               # + ApiInvoiceStatusItem { id, status }
│   └── kotta.ts               # + getInvoiceStatuses(ids) -> { items: ApiInvoiceStatusItem[] }
├── poll-schedule.ts           # ID_PATTERN -> ULID canônico (R2)
└── poll-schedule.test.mjs     # fixtures com ULIDs válidos + casos inválidos do data-model
app/api/notas/status/route.ts  # 1 chamada getInvoiceStatuses; sem skipMissing nem getInvoice
e2e/
├── mock-api-proxy.ts          # GET /api/v1/invoices/status aplica invoiceOverrides por item
└── notes-notifications.spec.ts
                               # + teste com duas notas em leitura na lista do grupo (R5)
```

**Structure Decision**: `InvoiceStatusWatcher` e as páginas que o usam não mudam. `getInvoice`
continua existindo, porque a página de detalhe da nota usa.

## Riscos

- **Fixtures do teste unitário**: `lib/poll-schedule.test.mjs` usa ids como `01JABC`, `a1` e
  `id${i}`. Eles deixam de ser válidos e precisam virar ULIDs canônicos.
- **e2e contra API antiga**: o lote dá 404 e a rota responde 503; o teste novo falha. O ambiente
  de e2e precisa da API 0.19.0 ou maior (R6).
- **Regex do mock**: `INVOICE_PATH` casa `/api/v1/invoices/status`. Por isso o overlay do lote
  precisa ser tratado antes do overlay por nota (R5).

## Complexity Tracking

Vazio.
