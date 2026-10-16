---

description: "Task list for 018 — Performance do front"
---

# Tasks: Performance do front — baseline, fim dos waterfalls e decisão sobre cache de dados no cliente

**Input**: Design documents from `/specs/018-front-performance/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/internal-interfaces.md, quickstart.md

**Tests**: Incluídos só para lógica pura nova, como exige a Constituição V (`lib/**/*.test.mjs`, `pnpm test`). UI coberta pelos E2E existentes + quickstart.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1–US5 da spec

---

## Phase 1: Setup

- [X] T001 Adicionar `@vercel/speed-insights` com `pnpm add @vercel/speed-insights` e renderizar `<SpeedInsights />` ao lado de `<Analytics />` em `app/layout.tsx` (justificativa da dependência no PR: CWV reais por rota, research R9)

---

## Phase 2: Foundational (bloqueia as stories)

**Purpose**: instrumentação (para o baseline) e o cliente dos endpoints agregados da API (PR #209).

- [X] T002 Instrumentar `apiRequest` em `lib/api/server.ts`: quando `process.env.API_TIMING_LOG === "1"`, logar `[api] #<n> <METHOD> <path sem query> -> <status> <ms>ms` com `performance.now()`; contador `n` por request via `const requestStats = cache(() => ({ calls: 0 }))` (`cache` de `react`); nunca logar token, corpo ou query string
- [X] T003 [P] Adicionar o tipo `ApiDashboard` em `lib/api/types.ts` conforme data-model (`totals.receivesCents`/`owesCents` integer ≥ 0; `monthSpend.currentCents`/`previousCents` integer ≥ 0, `month` string `YYYY-MM`; `groups[]` `{ id, name, emoji, netCents, membersCount ≥ 1 }`; `recent` `ApiNotification[]` máx. 3; `unpaidCount` integer ≥ 0)
- [X] T004 Em `lib/api/kotta.ts`: adicionar `getDashboard = cache(() => apiRequest<ApiDashboard>("/me/dashboard"))` e reescrever `listGroupDetails()` para paginar `GET /groups?include=members,balances&limit=GROUP_DETAILS_PAGE_LIMIT` (constante `GROUP_DETAILS_PAGE_LIMIT = 50`) seguindo `nextCursor` até `MAX_PAGES`, em vez de `listGroups()` + N × `getGroup()` (depende de T003)

**Checkpoint**: `pnpm build` passa; telas que usam `listGroupDetails()` (Grupos, Membros, Nova despesa, Notificações) já fazem nº constante de chamadas.

---

## Phase 3: User Story 1 - Medir antes de mudar e decidir com dados (Priority: P1) 🎯 MVP

**Goal**: baseline numérico das 7 rotas e ADR com a decisão sobre TanStack.

**Independent Test**: `baseline.md` tem LCP/INP/CLS/TTFB, chamadas à API e JS por rota; o ADR cita esses números e decide para Query, Virtual, Table e Form.

- [X] T005 [US1] Coletar o baseline **antes** das mudanças de US2–US5 (usar `main` com T002 aplicado): Lighthouse mobile (Moto G Power, 4G lento) em `/`, `/grupos`, `/grupos/[id]`, `/grupos/[id]/listas/[listId]`, `/grupos/[id]/notas`, `/despesas/nova`, `/perfil`; chamadas por visita com `API_TIMING_LOG=1 pnpm dev`; JS por rota com `pnpm next experimental-analyze --output`; registrar em `specs/018-front-performance/baseline.md` (seção "Antes") com data, commit e dispositivo
- [X] T006 [US1] Escrever `docs/adr/0001-client-data-fetching.md`: problema, opções (TanStack Query + BFF · cache/streaming Next 16 · híbrido), impacto em bundle (Query ≈ 13 kB gz), complexidade, segurança (cookie `HttpOnly`, CSRF, sessão expirada da spec 016), decisão por biblioteca (Query/Virtual/Table/Form: não adotar) e gatilhos para reabrir, citando os números do baseline (research R1, R2)
- [X] T007 [US1] Publicar a tabela "Antes" de `specs/018-front-performance/baseline.md` como comentário na issue #14 (`gh issue comment 14`) — Feito junto com o "depois": https://github.com/koller-nexus/app-kottagroups/issues/14#issuecomment-6225093058

**Checkpoint**: decisão registrada; as stories seguintes seguem o ADR.

---

## Phase 4: User Story 2 - Painel independente do nº de grupos (Priority: P1)

**Goal**: Painel com ≤ 5 chamadas à API por visita, constante, mesmos valores de hoje.

**Independent Test**: com 1 e 20 grupos, maior `#n` nos logs = 5; números iguais aos do baseline.

- [X] T008 [P] [US2] Teste em `lib/kotta-view.test.mjs` para `dashboardViewFrom`: totais, `monthSpend` (`currentCents → currentMonthCents`, `previousCents → previousMonthCents`), grupos (`membersCount → memberCount`, `href` `/grupos/<id>`), `recent` com nome do mapa e fallback "Ex-membro", `href` `/grupos/<id>?aba=saldos`
- [X] T009 [US2] Implementar `dashboardViewFrom(dashboard, names)` (função pura) em `lib/kotta-view.ts` até T008 passar
- [X] T010 [US2] Reescrever `components/app/dashboard.tsx` para `Promise.all([getMe(), getDashboard(), listGroupDetails()])`, montar nomes com `peopleById(groups)` e renderizar via `dashboardViewFrom`; mover a parte de dados para um componente async filho envolvido em `<Suspense>` com esqueleto (`kotta-*`, `aria-busy="true"`, animação respeitando `prefers-reduced-motion`), mantendo o estado vazio atual
- [X] T011 [US2] Remover `listExpensesSince` de `lib/api/kotta.ts` e `previousMonthStartIso`/`monthSpend` de `lib/kotta-view.ts` se ficarem sem uso (conferir com `grep`), junto dos testes que só cobriam essas funções

**Checkpoint**: Painel com 5 chamadas fixas; `pnpm test` verde.

---

## Phase 5: User Story 3 - Marcar item da lista responde na hora (Priority: P2)

**Goal**: toggle otimista < 100 ms com rollback e mensagem.

**Independent Test**: Slow 4G → check imediato; API fora → item volta e mensagem aparece; toques rápidos → estado final = último toque.

- [X] T012 [US3] Em `app/actions/shopping.ts`, `toggleShoppingItemAction` passa a devolver `Promise<{ ok: true } | { ok: false; error: string }>` (erro de `ApiError` → "Não foi possível marcar o item. Tente de novo."; rede, `NETWORK_ERROR` → "Sem conexão. O item não foi marcado.") e revalida só `/grupos/${groupId}/listas/${listId}` em vez de `("/", "layout")`; validar `groupId`/`listId`/`itemId` do `formData` antes da chamada
- [X] T013 [US3] Em `components/forms/shopping-forms.tsx`, aplicar `useOptimistic(items, (state, { id, checked }) => …)` e disparar a action dentro de `startTransition`; exibir a mensagem de erro junto da lista (`role="status"`), mantendo o `<form>` funcional sem JS
- [X] T014 [US3] Revisar as demais actions de `app/actions/shopping.ts`: itens → `/grupos/${groupId}/listas/${listId}`; criar/renomear/excluir lista → também `/grupos/${groupId}`; notas fiscais da lista → rota da lista (research R4)

**Checkpoint**: quickstart §2 passa.

---

## Phase 6: User Story 4 - Notas em leitura sem pesar o app (Priority: P2)

**Goal**: consultar só o status, com backoff, pausa em background e parada em 10 min.

**Independent Test**: só `GET /api/notas/status` no Network durante a espera; zero consultas com a aba oculta; um refresh ao concluir.

- [X] T015 [P] [US4] Teste em `lib/poll-schedule.test.mjs` para `nextPollDelay(attempt)` e `isPollExpired(startedAtMs, nowMs)`: `POLL_INTERVALS_MS = [3000, 5000, 10000]` (fica em 10000 após o 3º), `POLL_MAX_DURATION_MS = 600000`; e para `parseStatusIds(raw)`: 1 a `MAX_STATUS_IDS = 20` ids, formato de id válido, rejeita vazio/excesso/formato inválido
- [X] T016 [US4] Implementar `lib/poll-schedule.ts` (`POLL_INTERVALS_MS`, `POLL_MAX_DURATION_MS`, `MAX_STATUS_IDS`, `nextPollDelay`, `isPollExpired`, `parseStatusIds`) até T015 passar
- [X] T017 [US4] Criar `app/api/notas/status/route.ts` (`GET`) conforme contracts §2: `parseStatusIds(searchParams.get("ids"))` → 400 `{ error: "Invalid ids" }`; `Promise.all` de `getInvoice(id)` omitindo 404/403; 401 → `{ error: "Session expired" }` com status 401 sem `redirect()` (fazer a chamada sem o redirect de `apiRequest`, ex.: capturando o 401 numa variante `auth` que lança `ApiError`); rede/5xx → 503 `{ error: "Service unavailable" }`; `Cache-Control: no-store`
- [X] T018 [US4] Criar `components/app/invoice-status-watcher.tsx` (`"use client"`), `InvoiceStatusWatcher({ ids })` com os estados `polling`/`paused`/`done`/`expired`/`session-expired` do data-model: `setTimeout` com `nextPollDelay`, pausa em `document.hidden` (consulta imediata ao voltar), `router.refresh()` uma vez quando nenhum id segue pendente (`isInvoicePending`), botão "Atualizar" ao expirar, 401 → `router.replace(expiredSessionUrl(...))` de `lib/session-flow.ts`
- [X] T019 [US4] Trocar `<AutoRefresh />` por `<InvoiceStatusWatcher ids={…ids pendentes} />` em `app/(conta)/grupos/[id]/notas/page.tsx`, `app/(conta)/grupos/[id]/notas/[notaId]/page.tsx` e `components/app/group-invoices-card.tsx`; apagar `components/app/auto-refresh.tsx`

**Checkpoint**: quickstart §3 passa.

---

## Phase 7: User Story 5 - Telas de grupo e navegação sem recarregar tudo (Priority: P3)

**Goal**: detalhes em lote (já em T004), invalidação mínima, streaming por seção, notificações sem recarregar o shell.

**Independent Test**: nº de chamadas constante em Grupos/Membros/Nova despesa/Notificações; mutation atualiza só as rotas afetadas; "Carregar mais" anexa itens.

- [X] T020 [P] [US5] Escopo de `revalidatePath` em `app/actions/expenses.ts` e `app/actions/invoices.ts`: `revalidatePath(`/grupos/${groupId}`, "layout")` + `revalidatePath("/")` (Painel) — **Revisto**: `invoices.ts` já tinha escopo; `expenses.ts` mantém `("/", "layout")` porque despesas mudam o sino do shell (motivo comentado no arquivo). Ver ADR 0001.
- [X] T021 [P] [US5] Escopo em `app/actions/kotta.ts`: `markSettlementPaidAction`/`undoSettlementPaidAction` mantêm `("/", "layout")` (mudam o contador do sino no shell) com comentário do porquê; `updateAvatarAction`/`updateProfileAction` mantêm `("/", "layout")` (avatar/nome no shell) com comentário — Feito: motivo comentado no topo de `app/actions/kotta.ts`.
- [X] T022 [P] [US5] Escopo em `app/actions/groups.ts` e `app/actions/categories.ts`: criar/renomear/arquivar/desarquivar/excluir grupo mantêm `("/", "layout")` (menu de grupos do shell) com comentário; membros (`addMemberAction`, `removeMemberAction`, `promoteMemberAction`) → `revalidatePath(`/grupos/${groupId}`, "layout")`; categorias → rotas que as listam (conferir chamadores de `listCategories`) — Feito: grupos e membros mantêm `("/", "layout")` (menu e sino do shell); categorias também (rótulos em toda lista de despesas). Motivo comentado nos arquivos.
- [X] T023 [US5] Criar `loadMoreNotificationsAction(status, cursor)` em `app/actions/notifications.ts` (`"use server"`): validar `status` ∈ valores aceitos hoje pela página e `cursor` string não vazia ≤ 512; devolver `{ items, nextCursor }` mapeados como em `app/(conta)/notificacoes/page.tsx` (extrair o mapeamento existente para função reutilizada pela página e pela action) — **Dispensada**: a paginação por link é navegação suave, e o layout `(conta)` com o shell não re-renderiza (research R7).
- [X] T024 [US5] Criar `components/app/notifications-load-more.tsx` (`"use client"`) que anexa os itens e guarda `nextCursor`, e usá-lo em `app/(conta)/notificacoes/page.tsx` mantendo o link `?cursor=` como fallback sem JS (`<a>` dentro do componente, interceptado no clique) — **Dispensada** junto com T023.
- [X] T025 [P] [US5] `<Suspense>` por seção com esqueletos `kotta-*` em `app/(conta)/grupos/[id]/page.tsx` e `app/(conta)/grupos/[id]/listas/[listId]/page.tsx`: cabeçalho primeiro, seções lentas (despesas, saldos, notas, itens) em componentes async filhos — **Adiada**: feito só no Painel (T010). A página do grupo depende do 404 de qualquer chamada (commit `038f54f`), e as chamadas já são constantes e em paralelo (research R8).
- [X] T026 [P] [US5] Imagens: `loading="lazy"`, `decoding="async"` e `width`/`height` explícitos em `components/app/avatar-photo.tsx` e `components/app/invoice-photo.tsx` (e no `<img>` de `app/(conta)/grupos/[id]/listas/[listId]/page.tsx`) — Feito: `decoding="async"` em avatar e foto da nota (esta sem lazy, por ser o LCP); `loading="lazy"` + `decoding="async"` na prévia da nota da lista.
- [X] T027 [US5] Conferir prefetch da tab bar em `components/app/sidebar-nav.tsx` no build de produção (mobile); forçar `prefetch` só se o baseline mostrar navegação lenta, e registrar o resultado em `specs/018-front-performance/baseline.md` — Feito: o prefetch padrão já prefetcha até o `loading.tsx` (esqueleto imediato); o custo foi medido e registrado em `baseline.md`, sem `prefetch` forçado.

**Checkpoint**: quickstart §1 e §4 passam.

---

## Phase 8: Polish & Cross-Cutting

- [X] T028 Coletar a seção "Depois" de `specs/018-front-performance/baseline.md` com o mesmo método de T005; conferir JS por rota ≤ +10% (justificar no ADR se não) e LCP < 2,5 s / INP < 200 ms ou melhoria documentada; comentar a tabela na issue #14 — Feito em `baseline.md` (Painel 44 → 5 com 20 grupos; JS no máximo +1,6%). CWV de produção ficam com o Speed Insights. Comentário na issue: ver T007.
- [X] T029 Rodar os gates `pnpm lint && pnpm test && pnpm build && pnpm test:e2e`; ajustar E2E de lista de compras/notas que dependiam de `AutoRefresh` ou do recarregamento completo — Feito: lint, `pnpm test` (113), build e E2E (47 + 1 novo do watcher) passam contra a API local.
- [X] T030 Conferir `grep -rn 'revalidatePath("/", "layout")' app/actions`: cada ocorrência restante tem comentário justificando (FR-014) — Feito: cada `("/", "layout")` que sobrou tem o motivo comentado.

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T004)** → stories.
- **US1 (T005)** precisa de T002 e deve rodar **antes** de mexer em US2–US5 (o "antes" do baseline). T006 depende de T005.
- **US2** depende de T003–T004. **US3**, **US4** e **US5** são independentes entre si e de US2.
- **Polish (T028–T030)** depois de todas as stories.

### Dentro das stories

- Teste antes da implementação: T008 → T009; T015 → T016.
- T017 e T018 dependem de T016; T019 depende de T018.
- T024 depende de T023.

## Parallel Examples

```text
Foundational:  T003 em paralelo com T002
US2:           T008 em paralelo com qualquer task de US3/US4
US4:           T015 (teste) em paralelo com T012/T013 (US3)
US5:           T020, T021, T022, T025, T026 em paralelo (arquivos distintos)
```

## Implementation Strategy

1. **MVP**: T001–T007 (medição + ADR) e T008–T011 (Painel) — maior ganho, prova o método.
2. Incremento 2: US3 (lista otimista) e US4 (watcher) em paralelo.
3. Incremento 3: US5 (invalidação, streaming, notificações, imagens).
4. Fechar com T028–T030 e PR único (ou um PR por incremento, se o diff ficar grande).
