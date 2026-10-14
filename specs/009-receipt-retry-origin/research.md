# Research: 009 receipt retry + origin

## D1 — Onde o botão aparece
- **Decision**: `ReceiptRetry` é montado em `ReceiptArea` (page.tsx) quando `canRetryReceipt(receipt)` é verdadeiro. Em `failed` fica acima de `ReceiptCapture`; em `needs_review` fica junto de `ReceiptStatus`.
- **Rationale**: `ReceiptArea` já decide o que mostrar por status; `ReceiptStatus` é só polling + mensagem e continua sem mudanças (FR-004, sem segundo polling).
- **Alternatives**: colocar o botão dentro de `ReceiptStatus` — rejeitado: ele só é montado em fila/processando/revisão e cresceria sem necessidade.

## D2 — Regra do botão
- **Decision**: `canRetryReceipt({status, retry})` = `retry.allowed && status` ∈ {`failed`, `needs_review`}. Nunca em `done`, `queued`, `processing`, nem com `status` null (nota só arquivo).
- **Rationale**: a API já diz `allowed`, mas a spec exige a defesa de UI (FR-001); a API só recusa `queued/processing/done` com `RECEIPT_RETRY_NOT_ALLOWED`.
- **Alternatives**: confiar só em `allowed` — rejeitado, contraria SC-004.

## D3 — Como retomar o polling
- **Decision**: a Server Action chama `revalidatePath("/", "layout")` (padrão do arquivo). A página reexecuta, `status` vira `queued`, `ReceiptStatus` monta com `pending=true` e seu `useEffect` inicia o polling.
- **Rationale**: nenhum código de polling novo.
- **Alternatives**: `router.refresh()` manual no cliente — redundante.

## D4 — Forma da ação
- **Decision**: `retryReceiptAction(_prev: FormState, formData)` lendo `listId` oculto, igual às demais ações; o componente usa `useActionState` e `pending` para desabilitar o botão (cobre o toque duplo).
- **Rationale**: consistência com `uploadReceiptAction`/`decideMatchAction` e com `lib/form`. O prompt cita `retryReceipt(listId)`; a assinatura segue a convenção do arquivo.
- **Alternatives**: `retryReceipt(listId)` simples + `useTransition` — funciona, mas foge da convenção e perde o `FormState` de erro.

## D5 — Mensagens de erro
- **Decision**: `RECEIPT_RETRY_NOT_ALLOWED` → "Essa nota não pode ser lida de novo agora"; `RECEIPT_NOT_RETRYABLE` → "Essa nota já foi importada neste grupo"; `RECEIPT_RETRY_LIMIT` → "Você já usou todas as tentativas para esta nota". 403/404/429 usam `FORBIDDEN`/`NOT_FOUND`/`RATE_LIMITED` já existentes.
- **Rationale**: `failure()` já mapeia via `friendlyMessage`; texto cru em inglês nunca chega à tela (FR-010).
- **Alternatives**: reutilizar `RECEIPT_ALREADY_IMPORTED` — rejeitado, código diferente e texto da spec é outro.

## D6 — Selo de origem
- **Decision**: `resolutionPathLabel(path)` devolve o texto ou `null` (origem nula ou desconhecida). `ReceiptSummary` mostra o selo; quando há selo ele substitui o "via QR code/via foto" de `extractionMethodLabel` na linha de detalhes, para não dizer a mesma coisa duas vezes.
- **Rationale**: o selo é mais específico que `extractionMethod`.
- **Alternatives**: manter os dois — redundante e contraditório (ex.: "via foto" + "Lido pelo QR code").

## D7 — Fila/processando mostram só status
- **Decision**: nenhuma mudança. A página já só renderiza `ReceiptSummary` quando `isReceiptProcessed`, e os itens marcados vêm do detalhe da lista, que a API mantém marcado.
- **Rationale**: FR-006/FR-007 já são atendidos; o e2e passa a verificá-los.

## D8 — Falha sem retry
- **Decision**: em `failed` com `retry.allowed === false`, `failedMessage` passado a `ReceiptCapture` ganha o prefixo "Essa nota não pode ser lida de novo." antes do texto atual; `ReceiptCapture` já oferece foto e QR.
- **Rationale**: evita criar componente novo (FR-008).

## D9 — E2E com API "mockada"
- **Problema**: as chamadas à API acontecem no servidor Next; `page.route` do Playwright não as intercepta, e o login real precisa continuar funcionando.
- **Decision**: `e2e/mock-api-proxy.ts` (node:http, sem dependências) encaminha tudo à API real e sobrescreve, para uma lista registrada pelo teste via endpoint de controle (`PUT /__mock/receipt/{listId}`), apenas: `GET /api/v1/shopping-lists/{id}` (campo `receipt.status`), `GET .../receipt` e `POST .../receipt/retry`. O Playwright sobe o proxy como segundo `webServer` e aponta o `API_ORIGIN` do app para ele; o setup de login continua usando a API real.
- **Rationale**: único jeito de controlar `failed → queued → done` e `RECEIPT_RETRY_LIMIT` sem depender de a API real falhar sob demanda.
- **Alternatives**: mock completo da API — rejeitado (login, grupos, listas); dependência `msw` — rejeitada (regra de dependências); testar só com unit — não cobre o fluxo pedido.

## D10 — Rótulo duplicado "Tentar de novo"
- **Decision**: `ReceiptCapture` (`components/receipt/receipt-capture.tsx`) hoje rotula o botão de escanear como "Tentar de novo" quando há `failedMessage`. Passa a ser sempre "Escanear QR code".
- **Rationale**: "Tentar de novo" agora é a ação de reprocessar a mesma nota; dois botões com o mesmo nome confundem o usuário e o seletor do e2e.
