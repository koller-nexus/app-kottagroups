---

description: "Tasks: Mostrar o andamento da leitura da nota fiscal"
---

# Tasks: Mostrar o andamento da leitura da nota fiscal

**Input**: Design documents from `specs/011-receipt-reading-progress/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-states.md, quickstart.md

**Tests**: a constituição (Princípio V) exige teste para comportamento novo; por isso há tarefas de teste para a lógica pura em `lib/`. A UI é validada pelo `quickstart.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história do spec.md (US1, US2, US3)

## Phase 1: Setup

Nada a inicializar: sem dependência nova, sem rota nova, sem mudança de API.

## Phase 2: Foundational (bloqueia as histórias)

**Propósito**: peça compartilhada que as três histórias usam.

- [X] T001 [P] Criar o componente `Spinner` em `components/app/spinner.tsx`: Server Component com props `label?: string` e `size?: "sm" | "md"` (padrão `md`); anel `aria-hidden` com `border-kotta-border` e `border-t-kotta-primary`, `motion-safe:animate-spin`, e o `label` visível ao lado; sem `role` próprio (contracts/ui-states.md).
- [X] T002 [P] Em `lib/receipt.ts`, adicionar constantes nomeadas de texto e funções puras: `readingMessage(status, timedOut)` retornando "Na fila para ser lida" / "Lendo sua nota…" / "Está demorando mais que o normal." conforme data-model.md, e `readingJustFinished(seenPending: boolean, status)` que é verdadeira só para `done` após ter visto pendente. Constante `READING_LEAVE_HINT = "Pode sair da tela; seguimos lendo."`.
- [X] T003 Em `lib/receipt.test.mjs`, testar `readingMessage` (queued, processing, timeout) e `readingJustFinished` (pendente→done verdadeiro; já aberto em done falso; needs_review e failed falsos). Rodar `pnpm test`.

**Checkpoint**: `Spinner` e as regras de mensagem prontos.

## Phase 3: User Story 1 - Ver que o envio da nota está em andamento (P1) 🎯 MVP

**Goal**: indicador visível e texto por etapa desde o início do envio; botões desativados.

**Independent Test**: quickstart cenários 1 a 3.

- [X] T004 [P] [US1] Em `components/forms/shopping-forms.tsx` (`ReceiptUploadForm`), mostrar `Spinner` com a mensagem da etapa dentro de um `role="status"`: "Preparando a foto…" quando `pending` e a busca de QR ainda não começou, manter "Procurando QR code…" (`QR_SEARCH_STATUS.searching`) e usar "Enviando a nota…" quando `pending` após a busca ou `search === "qr"`. Trocar o texto do botão para não competir com o status e manter `disabled={busy || Boolean(hint)}`. Texto só muda quando a etapa muda.
- [X] T005 [P] [US1] Em `components/receipt/receipt-capture.tsx`, trocar o `<p role="status">` de "Enviando nota…" por `Spinner` com "Enviando a nota…" (QR escaneado e chave digitada); manter botões `disabled={pending}`.
- [X] T006 [P] [US1] Em `components/forms/invoice-upload-form.tsx`, mostrar `Spinner` com "Enviando a nota…" em `role="status"` quando `pending`; manter o botão desativado e o erro via `FormError` (indicador some no erro, botões reativam).

**Checkpoint**: todo envio mostra progresso e não permite toque duplo.

## Phase 4: User Story 2 - Acompanhar a leitura enquanto a nota é processada (P1)

**Goal**: aviso de progresso evidente, "pode sair", "Nota lida" ao concluir, timeout mantido.

**Independent Test**: quickstart cenários 4 a 6.

- [X] T007 [US2] Em `components/receipt/receipt-status.tsx`, usar `Spinner` no lugar do ponto pulsante, o texto de `readingMessage`, e `READING_LEAVE_HINT` abaixo do texto quando pendente e sem timeout; com timeout, parar o `Spinner` (não renderizar) e manter "Verificar de novo".
- [X] T008 [US2] Ainda em `components/receipt/receipt-status.tsx`, guardar em estado se já viu o status pendente (`seenPending`); quando `readingJustFinished(seenPending, status)` for verdadeiro, mostrar "Nota lida" em `role="status"` e escondê-lo após alguns segundos (constante nomeada, ex.: `READ_CONFIRMATION_MS = 4000`) com limpeza do timer. Abrir a nota já pronta não mostra nada.
- [X] T009 [P] [US2] Em `app/(conta)/grupos/[id]/notas/[notaId]/page.tsx`, substituir o parágrafo "Estamos lendo a nota…" por bloco com `Spinner`, `readingMessage(invoice.status, false)` e `READING_LEAVE_HINT` seguido de "Esta página se atualiza sozinha."; manter `AutoRefresh` e a região `aria-live`.

**Checkpoint**: leitura acompanhável de ponta a ponta nas duas telas.

## Phase 5: User Story 3 - Perceber o andamento nas listas (P2)

**Goal**: itens pendentes mostram indicador e viram status final sozinhos.

**Independent Test**: quickstart cenário 7.

- [X] T010 [P] [US3] Em `components/app/invoice-status.tsx`, mostrar `Spinner size="sm"` antes do rótulo quando `isInvoicePending(status)` (importar de `@/lib/invoices`); continua Server Component.
- [X] T011 [US3] Verificar se a lista de notas do grupo (`app/(conta)/grupos/[id]/notas/page.tsx` e o card em `components/app/group-invoices-card.tsx`) se atualiza sozinha com nota pendente; se não, incluir `<AutoRefresh />` (`components/app/auto-refresh.tsx`) condicionado a existir alguma nota com `isInvoicePending`, para cumprir FR-010 sem recarga manual.

**Checkpoint**: as três histórias funcionam de forma independente.

## Phase 6: Polish

- [X] T012 Rodar `pnpm lint`, `pnpm test` e `pnpm build`; corrigir qualquer falha.
- [ ] T013 Percorrer o `quickstart.md` (cenários 1 a 8), incluindo movimento reduzido e leitor de tela; conferir SC-001 a SC-006.
- [X] T014 Atualizar o e2e existente se algum texto trocado ("Enviando nota…", "Estamos lendo a nota…") for asserido em `e2e/` (buscar com grep antes de editar).

## Dependencies & Execution Order

- Foundational (T001–T003) antes de tudo; T003 depende de T002.
- US1, US2 e US3 dependem só da Foundational e são independentes entre si.
- Dentro de US2: T007 → T008 (mesmo arquivo); T009 é independente.
- Polish depois das histórias desejadas.

### Parallel Opportunities

- T001 e T002 em paralelo.
- Após a Foundational: T004, T005, T006 em paralelo; T009 e T010 em paralelo com elas.

## Implementation Strategy

- **MVP**: Foundational + US1 (envio nunca fica mudo, sem envio duplicado). Entregável sozinho.
- Depois US2 (maior ganho: a espera longa), por fim US3.
- Entrega incremental: validar cada história pelo seu cenário do quickstart antes da próxima.
