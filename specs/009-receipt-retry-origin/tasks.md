---

description: "Task list for 009-receipt-retry-origin"
---

# Tasks: Tentar de novo a leitura da nota e mostrar a origem do resultado

**Input**: `/specs/009-receipt-retry-origin/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: pedidos na spec (FR-012): unit em `lib/receipt.test.mjs` e e2e Playwright.

**Format**: `- [ ] T### [P?] [US?] Descrição com caminho`

## Phase 1: Setup

- [X] T001 Criar a branch `feature/009-receipt-retry-origin` a partir de `main` (a constituição proíbe commit direto em `main`)

## Phase 2: Foundational (bloqueia todas as histórias)

- [X] T002 [P] Em `lib/api/types.ts`, adicionar `export type ApiReceiptResolutionPath = "qr_image" | "printed_key" | "qr_submitted" | "text"` e `export interface ApiReceiptRetry { allowed: boolean; remaining: number }`; acrescentar a `ApiShoppingReceipt` os campos `resolutionPath: ApiReceiptResolutionPath | null` e `retry: ApiReceiptRetry` (ambos obrigatórios) e atualizar o comentário do tipo (itens/matches vazios em `queued`/`processing`)
- [X] T003 [P] Em `lib/api/errors.ts` (`friendlyMessage`), adicionar `RECEIPT_RETRY_NOT_ALLOWED` → "Essa nota não pode ser lida de novo agora", `RECEIPT_NOT_RETRYABLE` → "Essa nota já foi importada neste grupo" e `RECEIPT_RETRY_LIMIT` → "Você já usou todas as tentativas para esta nota"
- [X] T004 Em `app/actions/shopping.ts`, criar `retryReceiptAction(_prev: FormState, formData: FormData): Promise<FormState>`: lê `listId` com `text()`, devolve `{ error: "Lista não encontrada." }` se vazio, chama `apiRequest<ApiReceiptAccepted>(\`/shopping-lists/${enc(listId)}/receipt/retry\`, { method: "POST" })` num try/catch com `failure(error)`, depois `revalidatePath("/", "layout")` e `return { ok: true }`

**Checkpoint**: tipos, mensagens e ação prontos.

## Phase 3: User Story 1 — Tentar de novo quando a leitura falha (P1) 🎯 MVP

**Goal**: botão "Tentar de novo" com tentativas restantes, desabilitado durante a ação, retomando o polling existente.

**Independent Test**: nota `failed` com `retry.allowed` → clicar → status "Lendo sua nota…" → resultado final.

### Testes

- [X] T005 [P] [US1] Em `lib/receipt.test.mjs`, testar `canRetryReceipt`: verdadeiro só com `retry.allowed === true` e status `failed` ou `needs_review`; falso para `done`, `queued`, `processing`, `status: null` e `allowed: false` mesmo com `remaining > 0`; e `retriesLeftLabel`: `1` → "1 tentativa restante", `2` → "2 tentativas restantes" (escrever antes de T006; devem falhar)

### Implementação

- [X] T006 [US1] Em `lib/receipt.ts`, implementar `canRetryReceipt(receipt: { status: ApiInvoiceStatus | null; retry: ApiReceiptRetry }): boolean` e `retriesLeftLabel(remaining: number): string` (regra de `data-model.md`)
- [X] T007 [US1] Criar `components/receipt/receipt-retry.tsx` (`"use client"`): `ReceiptRetry({ listId, remaining })` com `useActionState(retryReceiptAction, {})`, `<form>` com `<input type="hidden" name="listId">`, botão `secondary-action` "Tentar de novo" com `disabled={pending}`, texto `retriesLeftLabel(remaining)` e erro em `role="alert"` via o `FormError` já usado em `components/receipt/receipt-capture.tsx` (reusar, não recriar); alvo de toque mínimo `min-h-11` e foco visível como os outros botões
- [X] T008 [US1] Em `components/receipt/receipt-capture.tsx`, trocar o rótulo condicional do botão de escanear (`failedMessage ? "Tentar de novo" : "Escanear QR code"`) por sempre "Escanear QR code" (research D10)
- [X] T009 [US1] Em `app/(conta)/grupos/[id]/listas/[listId]/page.tsx` (`ReceiptArea`), renderizar `<ReceiptRetry listId remaining={receipt.retry.remaining} />` quando `canRetryReceipt(receipt)`: acima de `ReceiptCapture` no ramo `failed` e junto de `ReceiptStatus` no ramo `needs_review`; não montar em modo `readOnly`
- [X] T010 [US1] Em `e2e/mock-api-proxy.ts`, criar o proxy `node:http` sem dependências: encaminha tudo para `UPSTREAM_ORIGIN`; mantém em memória um cenário por `listId` registrado via `PUT /__mock/receipt/{listId}` (corpo JSON com a nota e a resposta do retry); sobrescreve `GET /api/v1/shopping-lists/{id}` (campo `receipt.status`), `GET /api/v1/shopping-lists/{id}/receipt` e `POST /api/v1/shopping-lists/{id}/receipt/retry` (research D9); o retry 202 troca a nota do cenário para `queued` e, na leitura seguinte, para a nota final configurada
- [X] T011 [US1] Em `playwright.config.ts`, transformar `webServer` em array: (1) o proxy (`node --experimental-strip-types e2e/mock-api-proxy.ts`, porta própria via `MOCK_API_PORT`, `UPSTREAM_ORIGIN=API_ORIGIN`, `url` de health) e (2) o app existente com `env.API_ORIGIN` apontando para o proxy; manter `API_ORIGIN` real para `auth.setup.ts`
- [X] T012 (escrito, não executado: faltam E2E_EMAIL/E2E_PASSWORD) [US1] Criar `e2e/receipt-retry.spec.ts` com o cenário: lista nova (reaproveitar o helper de abrir lista de `e2e/receipt-image.spec.ts` ou copiar o trecho mínimo) → registrar nota `failed` com `retry {allowed: true, remaining: 2}` no proxy → ver "Tentar de novo" e "2 tentativas restantes" → clicar → botão desabilitado → "Lendo sua nota…" → nota `done` com itens e selo "Lido pelo QR code"; segundo teste: retry recusado com `409 RECEIPT_RETRY_LIMIT` → "Você já usou todas as tentativas para esta nota"

**Checkpoint**: US1 funciona e é demonstrável sozinha.

## Phase 4: User Story 2 — Selo de origem (P2)

**Goal**: selo conforme `resolutionPath`.

**Independent Test**: nota `done` com cada origem e uma sem origem.

- [X] T013 [P] [US2] Em `lib/receipt.test.mjs`, testar `resolutionPathLabel`: `qr_image` → "Lido pelo QR code", `printed_key` → "Lido pela chave de acesso", `qr_submitted` → "QR code", `text` → "Lido da foto — confira os itens", `null` → `null`, valor desconhecido → `null`
- [X] T014 [US2] Em `lib/receipt.ts`, implementar `resolutionPathLabel(path: ApiReceiptResolutionPath | null): string | null` com um `Record` de textos (sem `switch` longo)
- [X] T015 [US2] Em `components/receipt/receipt-summary.tsx`, mostrar o selo (`resolutionPathLabel(receipt.resolutionPath)`) ao lado dos detalhes; quando houver selo, omitir `extractionMethodLabel` da linha de detalhes (research D6); usar tokens `kotta-*`
- [X] T016 [US2] Em `e2e/receipt-retry.spec.ts`, garantir que o cenário `done` do T012 confere o selo "Lido pelo QR code" e que uma nota `done` com `resolutionPath: null` não mostra selo

## Phase 5: User Story 3 — Só status em fila/processando (P2)

**Goal**: sem itens/matches/total parciais; itens marcados anteriormente continuam marcados.

**Independent Test**: nota `queued` com itens da lista já marcados.

- [X] T017 [US3] Em `e2e/receipt-retry.spec.ts`, adicionar teste: nota `queued` (resposta com `items`/`matches` vazios) e item da lista com marca anterior → só "Lendo sua nota…" visível, sem cartão `Nota lida`/total, item continua marcado e sem botão "Tentar de novo" mesmo com `retry.allowed: true`
- [X] T018 [US3] Verificar em `app/(conta)/grupos/[id]/listas/[listId]/page.tsx` que `ReceiptSummary` só renderiza com `isReceiptProcessed` (FR-006); só alterar se o teste T017 falhar

## Phase 6: User Story 4 — Falha sem nova tentativa (P3)

**Goal**: explicação + enviar outra foto ou escanear QR.

**Independent Test**: nota `failed` com `retry.allowed: false`.

- [X] T019 [US4] Em `app/(conta)/grupos/[id]/listas/[listId]/page.tsx` (`ReceiptArea`, ramo `failed`), quando `!receipt.retry.allowed`, prefixar `failedMessage` com "Essa nota não pode ser lida de novo." antes do texto de `invoiceErrorMessage` (research D8)
- [X] T020 [US4] Em `e2e/receipt-retry.spec.ts`, adicionar teste: nota `failed` com `allowed: false` → texto da explicação, botão "Escanear QR code" e envio de imagem visíveis, e nenhum botão "Tentar de novo"

## Phase 7: User Story 5 — Mensagens de recusa (P3)

**Goal**: cada recusa mostra a mensagem em português.

**Independent Test**: simular os três 409 pelo proxy.

- [X] T021 [P] [US5] Em `lib/api/errors.test.mjs` (já existe; acrescentar casos), testar que `friendlyMessage` devolve os três textos do T003 e que o texto em inglês do servidor não aparece
- [X] T022 [US5] Em `e2e/receipt-retry.spec.ts`, parametrizar o teste de recusa do T012 para `RECEIPT_RETRY_NOT_ALLOWED`, `RECEIPT_NOT_RETRYABLE` e `RECEIPT_RETRY_LIMIT`, conferindo cada mensagem e que o botão volta habilitado

## Phase 8: Polish

- [X] T023 [P] Rodar `pnpm lint` e corrigir avisos nos arquivos tocados
- [X] T024 Rodar `pnpm test` e `pnpm build`; todos devem passar
- [ ] T025 Rodar `pnpm test:e2e e2e/receipt-retry.spec.ts` e depois a suíte `e2e/` completa para garantir que o proxy não quebrou `receipt-image.spec.ts` nem o login
- [ ] T026 Conferir a lista de `quickstart.md` item a item e marcar o que não foi possível validar localmente

## Dependencies & Execution Order

- Phase 1 → Phase 2 → histórias → Polish.
- Foundational: T002, T003 em paralelo; T004 depende de T002 (tipo `ApiReceiptAccepted` já existe, mas usa `FormState`) — pode rodar junto, sem conflito de arquivo, porém após T003 para a mensagem final fazer sentido.
- US1: T005 → T006 → T007/T008 → T009; T010 → T011 → T012 (e2e depende de T009).
- US2 depende de T002; US3, US4, US5 dependem de T009–T012 (usam o mesmo spec e proxy).
- Arquivos compartilhados (`receipt.ts`, `receipt.test.mjs`, `page.tsx`, `receipt-retry.spec.ts`) → tarefas nesses arquivos são sequenciais.

## Parallel Examples

- Foundational: T002 ‖ T003.
- US1: T005 (teste) ‖ T010 (proxy) — arquivos diferentes.
- US2 T013 ‖ US5 T021 depois da Foundational.

## Implementation Strategy

- **MVP**: Phases 1–3 (US1) — o botão funcionando com proxy e e2e.
- Depois, incremento por história: US2 (selo) → US3 → US4 → US5 → Polish.
- Parar e validar com `quickstart.md` ao fim de cada fase.
