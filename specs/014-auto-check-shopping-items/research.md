# Research: Marcar como comprado, sozinho, o que veio na nota

Fontes verificadas em 2026-10-14: `../api-kottagroups` (commit `1a19850`) e este repositório.

## R1. O backend já marca o check de comprado?

**Decision**: Sim. A US1 (FR-001 a FR-006) já está implementada no backend; não há mudança de API.

**Evidence**:
- `internal/repository/match.go` `SaveMatches`: toda correspondência que `Completes()` (status
  `matched`) faz `UPDATE shopping_items SET completed = true WHERE completed = false` e grava
  `completed_by_match`. Item já marcado à mão não muda.
- `PATCH /shopping-item-matches/{id}` (openapi): confirmar marca o item; rejeitar só desmarca se foi
  a nota que marcou ("an item ticked by hand stays ticked").
- `internal/repository/shopping.go:284`: marcar/desmarcar à mão zera `completed_by_match`, então
  uma releitura não desfaz nem refaz a escolha da pessoa (FR-005).
- `internal/service/match.go`: sem o modelo de linguagem, ou com suspeita de injeção, todo
  resultado vira `needs_review` e nada é marcado. Coincide com FR-002 ("confere?" sem check).

**Alternatives considered**: marcar `completed` pela web após a leitura. Rejeitado: duplicaria a
regra do backend e brigaria com ela na rejeição.

## R2. Por que a pessoa não vê os checks?

**Decision**: A web para de consultar cedo demais. Corrigir só na web.

**Evidence**:
- Backend: `requestMatching` (`internal/repository/invoice.go:431`) só enfileira o cruzamento
  **depois** que a nota vira `done`/`needs_review`. O cruzamento roda num worker (outbox) com
  chamada ao modelo de linguagem, segundos depois.
- Web: `components/receipt/receipt-status.tsx` faz `router.refresh()` só enquanto
  `isInvoicePending(status)` (`queued`/`processing`). No primeiro `done`, as correspondências quase
  sempre ainda não existem; a lista aparece sem check e "Nota lida" é exibido. Os checks só surgem
  ao recarregar a página. Isso viola FR-007 e SC-002.
- A API não expõe "cruzamento em andamento" (nenhum campo de matching em `openapi.yaml`).

**Decision detail**: tratar como "ainda marcando" a nota lida que tem linhas (`items.length > 0`),
nenhuma correspondência (`matches.length === 0`) e pelo menos um item pendente na lista. Nesse
estado o polling continua, com o mesmo intervalo crescente e o mesmo limite
(`RECEIPT_POLL_TIMEOUT_MS`) da leitura.

**Alternatives considered**:
- Campo `matching: "pending" | "done"` no `GET /shopping-lists/{id}/receipt`: é o sinal exato, mas
  exige mudança no backend. Fica como upgrade (`ponytail:` no código) se o heurístico falhar.
- Recarregar por tempo fixo após `done`: mais simples, mas recarrega à toa quando já há
  correspondências e não sabe quando parar.

**Known ceiling**: nota em que nada da lista bate não gera correspondências; a web consulta até o
limite e depois para em silêncio. Custo: algumas requisições extras, sem mensagem errada.

## R3. Nota enviada pela seção Notas do grupo (US2)

**Decision**: Fora desta entrega; bloqueada no backend.

**Evidence**: o openapi só tem `PUT/DELETE /invoices/{id}/expense` para vínculos. `shopping_list_id`
de uma nota só é gravado em `receipt_invoice.go` (envio pela lista). `requestMatching` só cruza nota
que já nasceu ligada a uma lista. Não existe rota para ligar uma nota existente a uma lista.

**Next step**: abrir issue em `koller-nexus/api-kottagroups` pedindo `PUT /invoices/{id}/shopping-list`
(liga, valida mesmo grupo e lista sem nota, enfileira o cruzamento). Quando existir, a US2 vira um
seletor na tela da nota, análogo ao seletor de despesa da feature 008.

**Alternatives considered**: reenviar o arquivo da nota pela lista. Rejeitado: duplica a nota no
grupo e gasta uma leitura.
