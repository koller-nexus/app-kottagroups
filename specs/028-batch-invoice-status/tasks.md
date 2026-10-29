---

description: "Task list for 028-batch-invoice-status"
---

# Tasks: Consultar o status das notas em lote no acompanhamento

**Input**: Design documents from `/specs/028-batch-invoice-status/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/notas-status.md,
quickstart.md

**Tests**: pedidos. O FR-009 exige e2e com várias notas, e a constituição (V) exige teste para a
validação nova em `lib/`.

**Organization**: as duas histórias passam pela mesma rota. A troca da rota (Fase 2) já entrega as
duas. Cada fase de história acrescenta só a verificação dela.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem depender de tarefa pendente)
- **[Story]**: história do spec.md (US1, US2)

---

## Phase 1: Setup

**Purpose**: confirmar que a branch parte de um estado verde.

- [X] T001 Rodar `pnpm test` e `pnpm lint` na branch `feature/028-batch-invoice-status` e confirmar que passam antes de qualquer mudança

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: validação dos ids, a chamada em lote e a rota com uma chamada só. As duas histórias
dependem disso.

**⚠️ CRITICAL**: nenhuma história começa antes desta fase.

- [X] T002 [P] Em `lib/poll-schedule.test.mjs`, trocar as fixtures por ULIDs canônicos e cobrir a tabela do `data-model.md`:
  - aceita: 1 id; 20 ids distintos (gerados com um prefixo fixo de 24 caracteres mais 2 dígitos); repetidos viram a lista sem repetidos, na ordem da primeira ocorrência.
  - recusa (`null`): `null`, `""`, `a,,b`, `../users`, minúsculas, 25 e 27 caracteres, com `I`/`L`/`O`/`U`, primeiro caractere `8` ou `Z`, 21 ids distintos.
- [X] T003 Em `lib/poll-schedule.ts`, trocar `ID_PATTERN` por uma constante nomeada `ULID_PATTERN = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/`, com um comentário dizendo que espelha o `model.IsID` da API (um id inválido recusa o lote inteiro). Atualizar a doc de `parseStatusIds`. `pnpm test` passa com T002.
- [X] T004 [P] Em `lib/api/types.ts`, adicionar `export interface ApiInvoiceStatusItem { id: string; status: ApiInvoiceStatus }` ao lado de `ApiInvoice`.
- [X] T005 Em `lib/api/kotta.ts`, adicionar ao lado de `getInvoice`:
  - `export function getInvoiceStatuses(ids: string[])`, sem `cache()`.
  - Chama `apiRequest<{ items: ApiInvoiceStatusItem[] }>` com `withQuery("/invoices/status", { ids: ids.join(",") })`. O `withQuery` codifica a vírgula como `%2C`, e a API decodifica antes de separar os ids.
  - Depende de T004.
- [X] T006 Em `app/api/notas/status/route.ts`:
  - Trocar o `Promise.all` de `getInvoice(id).catch(skipMissing)` por `const { items } = await getInvoiceStatuses(ids)`.
  - Responder `{ items: items.map(({ id, status }) => ({ id, status })) }`, para a resposta não mudar de formato se a API acrescentar campos (FR-002).
  - Apagar `skipMissing` e o import de `getInvoice` (FR-008).
  - Manter o 400, o 401, o `catch` de `ApiError` → 503 e o `NO_STORE` como estão (contracts/notas-status.md).
  - Depende de T003 e T005.
- [X] T007 [P] Em `e2e/mock-api-proxy.ts`:
  - Depois do `fetch` ao upstream e antes do overlay por nota, quando `method === "GET"`, `url.pathname === "/api/v1/invoices/status"` e `upstream.ok`, aplicar `invoiceOverrides.get(item.id)` a cada item de `payload.data.items` e responder com `send`.
  - Comentar que `INVOICE_PATH` também casaria esse caminho (research R5).
  - Na implementação, o mesmo overlay também vale para `GET /api/v1/groups/:id/invoices`. Sem ele, a lista do grupo não vê as notas em `processing` e o acompanhamento nem começa no T008. A paginação é preservada.

**Checkpoint**: `pnpm test` e `pnpm lint` verdes. O e2e atual "nota em leitura consulta só o status
e atualiza a tela quando termina" continua passando com a rota nova.

---

## Phase 3: User Story 1 - Acompanhar várias notas em leitura com uma consulta por ciclo (Priority: P1) 🎯 MVP

**Goal**: um ciclo com N notas em leitura gera uma única consulta à API, e a tela atualiza o status de
cada nota.

**Independent Test**: com a API simulada e duas notas em leitura na lista de notas do grupo, um ciclo
gera uma única chamada `/api/v1/invoices/status` e nenhuma `/api/v1/invoices/<id>`. Quando as duas
terminam, a tela recarrega e mostra as duas lidas.

### Tests for User Story 1

- [X] T008 [US1] Em `e2e/notes-notifications.spec.ts`, no `describe` serial "notas do grupo", depois dos testes que usam `notePath`, novo teste "várias notas em leitura usam uma única consulta de status à API":
  1. Criar uma segunda despesa e enviar a foto da nota, como no primeiro teste do bloco (`/despesas/nova`, `RECEIPT`). Guardar o id da segunda nota.
  2. Com `setInvoice`, deixar as duas notas (a de `notePath` e a nova) em `{ status: "processing", expenseId: null }`.
  3. Abrir a lista de notas do grupo, `/grupos/<groupId>/notas`, tirando o `groupId` de `notePath`.
  4. Limpar as chamadas registradas com `DELETE ${MOCK_ORIGIN}/__mock/last-headers`.
  5. Esperar com `page.waitForResponse` uma resposta de `/api/notas/status`. O JSON dela traz as duas notas com `status: "processing"`, e a URL pedida contém os dois ids.
  6. Ler `GET ${MOCK_ORIGIN}/__mock/last-headers`. Os caminhos contêm `/api/v1/invoices/status` e nenhum casa com `^/api/v1/invoices/(?!status$)[^/]+$`.
  7. Com `setInvoice`, marcar as duas como `{ status: "done", expenseId: null }` e esperar (timeout 15 s) que a lista mostre as duas como lidas.
  8. No fim, restaurar as duas notas com `setInvoice(id, {})`.

### Implementation for User Story 1

Nada além da Fase 2: a troca da rota (T006) entrega a história. Se T008 falhar, corrigir em T005,
T006 ou T007.

**Checkpoint**: T008 passa e o passo 1 do quickstart confere à mão.

---

## Phase 4: User Story 2 - Nota sem acesso some sem derrubar as demais (Priority: P2)

**Goal**: notas omitidas pela API somem da resposta da rota, sem erro, e as outras continuam sendo
acompanhadas.

**Independent Test**: um pedido com uma nota real e um ULID válido que não existe devolve 200 só com a
nota real.

### Tests for User Story 2

- [X] T009 [US2] Em `e2e/notes-notifications.spec.ts`, no mesmo `describe`, novo teste "nota inexistente some da consulta de status sem erro":
  1. Com `setInvoice`, deixar a nota de `notePath` em `processing`.
  2. Com `page.goto(notePath)` (para ter a sessão), pedir `page.request.get("/api/notas/status?ids=<id real>,01ARZ3NDEKTSV4RRFFQ69G5FAV")`.
  3. Esperar 200, com `items` contendo só a nota real.
  4. Pedir `ids=abc` e esperar 400 `{ error: "Invalid ids" }` (FR-004).
  5. Restaurar a nota com `setInvoice(id, {})`.

### Implementation for User Story 2

Nada além da Fase 2: a API faz a filtragem, e a rota repassa o que recebe (T006).

**Checkpoint**: T009 passa.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T010 Rodar `pnpm lint`, `pnpm test` e `pnpm build`, e `API_ORIGIN=<API 0.19.0+> pnpm test:e2e e2e/notes-notifications.spec.ts`. Todos passam (quickstart.md).
- [X] T011 Confirmar que nada mais importa `skipMissing` e que `getInvoice` continua usado só pela página de detalhe da nota. Rodar `grep -rn "skipMissing\|getInvoice(" app lib components`.
- [X] T012 No PR, a descrição cita a #90 (`Closes #90`), a dependência api#256 (API 0.19.0+ no ambiente de e2e) e a mudança do formato aceito de id (research R2).

---

## Dependencies & Execution Order

- **Fase 1** → **Fase 2** → (**Fase 3** e **Fase 4**, em qualquer ordem) → **Fase 5**.
- Dentro da Fase 2:
  - T002 → T003.
  - T004 → T005.
  - T003 e T005 → T006.
  - T007 é independente.
- T008 e T009 mexem no mesmo arquivo, então rodam em sequência. Os dois dependem de T006 e T007.

## Parallel Example

```text
# Fase 2, em paralelo:
T002 lib/poll-schedule.test.mjs
T004 lib/api/types.ts
T007 e2e/mock-api-proxy.ts
# depois: T003 → T005 → T006
```

## Implementation Strategy

- **MVP**: Fases 1–3. A rota faz uma chamada só e o e2e prova isso com várias notas.
- **Incremento**: a Fase 4 só acrescenta a verificação da nota omitida e do id inválido. O código já
  está pronto desde a Fase 2.
- Um único PR. A mudança é pequena e as histórias não se separam no código.
