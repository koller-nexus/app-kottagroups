---

description: "Tarefas da feature 010: corrigir a tela de nota fiscal com leitura falhada"
---

# Tasks: Corrigir a tela de nota fiscal com leitura falhada

**Input**: `/specs/010-failed-receipt-screen/` (plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md)

**Tests**: pedidos pela constituição (princípio V): um teste unitário da regra e um e2e do estado de falha.

**Escopo desta entrega**: foto de reenvio e seção "Despesa". Escanear QR direto e "Tentar de novo" ficam fora até a API de notas do grupo oferecer suporte (research.md, item 2).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

Nenhum. Projeto, dependências e estrutura já existem.

## Phase 2: Foundational

- [X] T001 Em `lib/invoices.ts`, adicionar `canLinkInvoice(invoice: Pick<ApiInvoice, "status" | "expenseId">)`, que devolve `isInvoiceRead(status) || expenseId !== null` (data-model.md)
- [X] T002 [P] Em `lib/invoices.test.mjs`, testar `canLinkInvoice`: `done` e `needs_review` true; `failed` sem `expenseId` false; `failed` com `expenseId` true; `queued` e `processing` false

**Checkpoint**: `pnpm test` passa.

## Phase 3: User Story 1 - Saber o que fazer depois de uma falha (P1) 🎯 MVP

**Goal**: na falha, explicar e permitir enviar outra foto (com ou sem QR; a API lê a imagem).

**Independent Test**: nota `failed` em grupo ativo mostra a explicação e o formulário "Foto da nota"; grupo arquivado não mostra o formulário.

- [X] T003 [US1] Criar `components/app/invoice-failed-recovery.tsx` (Server Component): texto "Esta nota não pode ser lida de novo. Envie outra foto." seguido de `<InvoiceUploadForm groupId={groupId} />` de `components/forms/invoice-upload-form.tsx`; props `{ groupId: string }`
- [X] T004 [US1] Em `app/(conta)/grupos/[id]/notas/[notaId]/page.tsx`, renderizar `InvoiceFailedRecovery` quando `invoice.status === "failed" && !group.archived`, logo abaixo do bloco `role="alert"` de falha
- [X] T005 [US1] Em `e2e/notes-notifications.spec.ts`, caso nota `failed` sem vínculo: ver mensagem de erro em português, a explicação e o campo "Foto da nota"; botão "Excluir" continua visível

**Checkpoint**: US1 funciona sozinha.

## Phase 4: User Story 2 - Não mostrar "Despesa" numa nota sem leitura (P1)

**Goal**: seção "Despesa" só em nota lida ou falha já vinculada.

**Independent Test**: notas `failed` (sem vínculo), `queued` e `processing` sem seção "Despesa"; `done` igual a hoje.

- [X] T006 [US2] Em `app/(conta)/grupos/[id]/notas/[notaId]/page.tsx`, renderizar `InvoiceExpenseSection` somente quando `canLinkInvoice(invoice)` for verdadeiro
- [X] T007 [US2] Em `e2e/notes-notifications.spec.ts`, verificar ausência do título "Despesa" em `failed` sem vínculo, `queued` e `processing`, e presença em `done`

**Checkpoint**: US1 e US2 completas.

## Phase 5: User Story 3 - Mensagem coerente sem despesas livres (P2)

**Goal**: em nota lida e sem vínculo, sem despesas livres, uma única mensagem.

**Independent Test**: nota `done` sem vínculo em grupo sem despesas livres mostra só "Registre uma despesa neste grupo para vincular esta nota."

- [X] T008 [US3] Em `components/app/invoice-expense-section.tsx`, quando `!invoice.expenseId && options.length === 0 && !archived`, mostrar apenas "Registre uma despesa neste grupo para vincular esta nota." (omitir "Esta nota ainda não comprova nenhuma despesa." e "Não há despesas sem nota neste grupo." nesse caso); manter as mensagens atuais nos demais casos
- [X] T009 [US3] Em `e2e/notes-notifications.spec.ts`, ajustar as asserções que citam "Não há despesas sem nota neste grupo" e cobrir a mensagem nova

## Phase 6: Polish

- [X] T010 Rodar `pnpm test`, `pnpm lint` e `pnpm build` e corrigir falhas
- [ ] T011 Rodar `pnpm test:e2e e2e/notes-notifications.spec.ts` e seguir o quickstart.md

## Dependencies

- T001 → T002, T004, T006. T003 → T004. T006 e T004 editam `page.tsx`: fazer em sequência.
- US1, US2 e US3 são independentes entre si após a Phase 2; T005, T007 e T009 editam o mesmo spec e1e: fazer em sequência.

## Parallel example

T002 pode rodar junto com T003 (arquivos diferentes), depois de T001.

## Implementation strategy

MVP: Phase 2 + US1. Depois US2 (mesma página), depois US3. Itens fora de escopo (QR direto, retry) viram nova feature quando a API existir.
