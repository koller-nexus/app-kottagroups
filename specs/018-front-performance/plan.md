# Implementation Plan: Performance do front — baseline, fim dos waterfalls e decisão sobre cache de dados no cliente

**Branch**: `feature/018-front-performance` | **Date**: 2026-10-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-front-performance/spec.md`

## Summary

Medir (CWV reais, chamadas à API por render, JS por rota), registrar a decisão sobre TanStack
(ADR: **não adotar** Query/Virtual/Table/Form por ora — ver `research.md` R1) e aplicar as
melhorias com o que o app já tem: consumir os endpoints agregados da API (PR #209) no Painel e
nos detalhes de grupos, `useOptimistic` na lista de compras, watcher de status de notas via um
Route Handler leve (sem `router.refresh()` a cada 3 s), "carregar mais" de notificações por
Server Action, `revalidatePath` com escopo mínimo e `<Suspense>` por seção.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.2.8

**Primary Dependencies**: Next.js 16.3.5 (App Router, Turbopack), Tailwind CSS 4,
`@vercel/analytics`; **nova**: `@vercel/speed-insights` (justificada em R9)

**Storage**: N/A (dados vêm da API Kotta; sessão em cookie `HttpOnly`)

**Testing**: `pnpm test` (`node --test lib/*.test.mjs lib/api/*.test.mjs`), Playwright (`pnpm test:e2e`)

**Target Platform**: web, mobile-first; deploy na Vercel

**Project Type**: web-app (front Next.js; API em repositório separado)

**Performance Goals**: Painel com ≤ 5 chamadas à API por visita, constante no nº de grupos;
toggle de item < 100 ms visual; LCP < 2,5 s e INP < 200 ms em 4G lento (ou melhoria documentada)

**Constraints**: token não legível pelo navegador; nenhuma rota +10% de JS sem justificativa;
manter sessão expirada/erros (spec 016) e textos atuais

**Scale/Scope**: ~7 rotas principais, 3 pontos de `AutoRefresh`, 5 telas com `listGroupDetails()`,
29 `revalidatePath` em `app/actions/*`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Nota |
|---|---|---|
| I. Simplicity First | ✅ | Rejeita TanStack Query, BFF e `cacheComponents`; reusa `listNotificationsPage`, `getInvoice`, `apiRequest`; remove `listExpensesSince` e `AutoRefresh` ao substituí-los. 1 dependência nova (`@vercel/speed-insights`), justificada (R9). |
| II. Clean Code | ✅ | Intervalos/limites como constantes nomeadas (data-model); mapeamento do Painel como função pura. |
| III. Organized Structure | ✅ | Handler em `app/api/notas/status/`, watcher em `components/app/`, tipos em `lib/api/types.ts`. Sem barrel. |
| IV. Best Practices | ✅ | `"use client"` só no watcher, lista otimista e "carregar mais"; handler e actions autenticam via `apiRequest` (`server-only`); entrada validada (`ids`, `status`, `cursor`); trabalho independente em `Promise.all`; esqueletos com tokens `kotta-*`; `prefers-reduced-motion` nos esqueletos. Regra do `VERSION`: arquivo não existe (pendência já registrada na constituição) — sem ação. |
| V. Testable by Default | ✅ | Testes `lib/*.test.mjs` para: mapeamento Dashboard→View, agenda de backoff do watcher (função pura `nextPollDelay`), validação de `ids`. E2E existentes cobrem Painel/lista. |

Sem violações → Complexity Tracking vazio.

**Re-check pós-design**: ✅ mantido. O design não adicionou camadas além do Route Handler de
status (uma rota, somente leitura) e da action "carregar mais".

## Project Structure

### Documentation (this feature)

```text
specs/018-front-performance/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/internal-interfaces.md
├── baseline.md          # preenchido na implementação (antes/depois)
└── tasks.md             # /speckit-tasks
docs/adr/0001-client-data-fetching.md   # ADR (entregável)
```

### Source Code (repository root)

```text
app/
├── layout.tsx                         # + <SpeedInsights />
├── api/notas/status/route.ts          # novo: status de notas (GET)
├── actions/*.ts                       # revalidatePath com escopo; toggle devolve resultado; loadMoreNotifications
└── (conta)/
    ├── notificacoes/page.tsx          # "carregar mais"
    ├── grupos/[id]/notas/…            # AutoRefresh → InvoiceStatusWatcher
    └── grupos/[id]/listas/[listId]/   # Suspense por seção
components/app/
├── dashboard.tsx                      # getDashboard + listGroupDetails (nomes); Suspense
├── invoice-status-watcher.tsx         # novo (substitui auto-refresh.tsx, removido)
├── group-invoices-card.tsx            # usa o watcher
└── avatar-photo.tsx                   # lazy/async/dimensões
components/forms/shopping-forms.tsx    # useOptimistic no toggle
lib/
├── api/server.ts                      # log de tempo/contador por request (API_TIMING_LOG)
├── api/kotta.ts                       # getDashboard; listGroupDetails em lote; remove listExpensesSince
├── api/types.ts                       # ApiDashboard
├── kotta-view.ts                      # dashboardViewFrom (puro)
└── poll-schedule.ts                   # nextPollDelay (puro) + testes
```

**Structure Decision**: projeto Next.js único; mudanças ficam junto das telas/camada de API
existentes, sem pastas novas além de `app/api/notas/status/` e `docs/adr/`.

## Complexity Tracking

Nenhuma violação a justificar.
