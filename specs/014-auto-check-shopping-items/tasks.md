---

description: "Task list for feature 014: checks automáticos na lista a partir da nota"
---

# Tasks: Marcar como comprado, sozinho, o que veio na nota

**Input**: Design documents from `/specs/014-auto-check-shopping-items/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/receipt-status-ui.md

**Tests**: a constituição (V. Testable by Default) exige teste para regra nova em `lib/`; por isso
há tarefas de teste para `awaitingMatches` e para a mensagem.

**Organization**: US1 é a entrega. US2 está bloqueada no backend (research.md R3) e só gera a
tarefa de abrir a issue.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Criar a branch `feature/014-auto-check-shopping-items` a partir de `main` (o trabalho atual está em `feature/013-invoice-discount-summary`; não misturar)

---

## Phase 2: Foundational

Nenhuma tarefa: a API, os tipos (`ApiShoppingReceipt`, `ApiShoppingItem` em `lib/api/types.ts`) e o polling já existem.

---

## Phase 3: User Story 1 - Itens encontrados na nota ficam com check de comprado (Priority: P1) 🎯 MVP

**Goal**: com a lista aberta durante a leitura, os checks gravados pelo backend aparecem sozinhos, sem recarregar a página (FR-001, FR-006, FR-007, SC-002).

**Independent Test**: lista com 5 itens pendentes, enviar nota que contém 3 → sem recarregar, a tela mostra "Marcando os itens da lista…", depois os 3 itens com check e "3 de 5 itens", depois "Nota lida" (quickstart.md, Manual US1).

### Tests for User Story 1

- [X] T002 [P] [US1] Em `lib/receipt.test.mjs`, adicionar `test("awaitingMatches: espera o cruzamento só quando a nota lida ainda não casou nada", ...)` cobrindo: `true` para status `done` e `needs_review` com `items.length > 0`, `matches.length === 0` e algum item `completed: false`; `false` para `queued`/`processing`/`failed`/`null`, para `items` vazio, para `matches` não vazio e para lista com todos os itens `completed: true`; importar `awaitingMatches` e `MATCHING_MESSAGE` no bloco de import existente
- [X] T003 [P] [US1] Em `lib/receipt.test.mjs`, adicionar asserção de que `MATCHING_MESSAGE === "Marcando os itens da lista…"`

### Implementation for User Story 1

- [X] T004 [US1] Em `lib/receipt.ts`, exportar `MATCHING_MESSAGE = "Marcando os itens da lista…"` e `awaitingMatches(receipt: Pick<ApiShoppingReceipt, "status" | "items" | "matches"> | null, items: Pick<ApiShoppingItem, "completed">[]): boolean` = `isReceiptProcessed(receipt?.status) && receipt.items.length > 0 && receipt.matches.length === 0 && items.some((item) => !item.completed)`; acima dela, comentário `// ponytail:` explicando que o backend cruza a nota depois de `done` sem expor o andamento, e que o upgrade é um campo de "cruzamento em andamento" na API (research.md R2); rodar `pnpm test` e ver T002/T003 passarem
- [X] T005 [US1] Em `components/receipt/receipt-status.tsx`, adicionar a prop `awaitingMatches: boolean` e, conforme `contracts/receipt-status-ui.md`: `pending = isInvoicePending(status) || awaitingMatches` (mantém o polling com `nextPollDelay` e `RECEIPT_POLL_TIMEOUT_MS`); a mensagem é `MATCHING_MESSAGE` com `Spinner` enquanto `awaitingMatches` e sem timeout; "Nota lida" só quando `!awaitingMatches`; ao estourar o limite em `awaitingMatches`, não mostrar nada (sem "Está demorando…" nem "Verificar de novo", que continuam só para `queued`/`processing`); atualizar o comentário do componente
- [X] T006 [US1] Em `app/(conta)/grupos/[id]/listas/[listId]/page.tsx`, passar `items={list.items}` para `ReceiptArea` (linha 94) e, dentro de `ReceiptArea`, renderizar `<ReceiptStatus status={status} awaitingMatches={awaitingMatches(receipt, items)} />`; importar `awaitingMatches` de `@/lib/receipt`

**Checkpoint**: US1 funciona e é demonstrável sozinha.

---

## Phase 4: User Story 2 - Nota enviada pela seção Notas do grupo também marca a lista (Priority: P2)

**Goal**: ligar uma nota do grupo a uma lista e cruzar os itens (FR-009).

**Status**: bloqueada. O backend não tem rota para ligar uma nota existente a uma lista (research.md R3). Nenhum código web nesta entrega.

- [X] T007 [US2] (substituída: o backend cria a lista a partir da nota, feature 063; ver spec.md) Abrir issue em `koller-nexus/api-kottagroups` pedindo `PUT /api/v1/invoices/{id}/shopping-list` (body `{ shoppingListId }`; valida nota e lista do mesmo grupo, lista sem nota, grupo não arquivado; grava `shopping_list_id` e chama `requestMatching`) e `DELETE` para desligar; citar `internal/repository/invoice.go:431` e linkar `specs/014-auto-check-shopping-items/spec.md`; registrar o link da issue em `specs/014-auto-check-shopping-items/research.md` (R3, Next step)

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T008 Rodar `pnpm lint`, `pnpm test` e `pnpm build` na raiz do repositório e corrigir o que falhar
- [ ] T009 (pendente: validar com a API local) Executar o roteiro manual de `specs/014-auto-check-shopping-items/quickstart.md` (passos 1–6) contra a API local e anotar o tempo até os checks aparecerem (SC-002: até 30 s)

---

## Dependencies & Execution Order

- T001 → tudo.
- US1: T002 e T003 (testes, mesmo arquivo, mas independentes do código) → T004 → T005 → T006.
- US2 (T007) é independente de US1 e pode ser feita a qualquer momento.
- Polish (T008, T009) depois de T006.

### Parallel Opportunities

- T002 e T003 escrevem no mesmo arquivo; [P] apenas em relação ao código (fazer em sequência ou num só commit).
- T007 roda em paralelo com toda a US1.

```text
# Em paralelo:
T002+T003 (lib/receipt.test.mjs)   |   T007 (issue no backend)
```

## Implementation Strategy

MVP = US1 (T001–T006 + T008–T009): resolve o pedido no caminho principal, envio pela lista. US2
volta como nova feature quando a rota do backend existir.
