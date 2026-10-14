# Research: Notas dentro do grupo

## R1. Backend não suporta o vínculo hoje

- **Decision**: O app implementa contra o contrato proposto em [contracts/backend-api.md](contracts/backend-api.md). A implementação no app só começa (ou só é mesclada) quando o backend publicar esse contrato no swagger.
- **Rationale**: `api/openapi.yaml` (2026-10-13) só tem `/invoices` por usuário. `Invoice` não tem `groupId`/`expenseId`; `ExpenseSummary` não tem `invoiceId`. Simular o vínculo no app (ex.: guardar o id da nota na descrição da despesa) quebraria FR-005/FR-007 e SC-005.
- **T001 (2026-10-13)**: `api-kottagroups` (branch `develop` e branches remotas) ainda não tem `/groups/{id}/invoices`, `/invoices/{id}/expense`, nem os campos `groupId`/`uploadedByUserId`/`expenseId` em `Invoice` ou `invoiceId` em `ExpenseSummary`. Implementação no app bloqueada.
- **T001 resolvido (2026-10-13)**: contrato implementado no backend na branch `feature/058-group-invoices` (migração 0014, `make check` e `make test-integration` verdes). O app foi implementado contra essa branch; mesclar o backend antes do app.
- **Alternatives considered**: vínculo só no app (cookie/descrição) — rejeitado, não é compartilhado entre membros; esperar o backend sem contrato — rejeitado, o contrato orienta a spec do backend.

## R2. Onde ficam as notas no app

- **Decision**: Rotas `/grupos/[id]/notas` (lista + envio) e `/grupos/[id]/notas/[notaId]` (detalhe + vínculo). A página do grupo ganha um cartão "Notas" ao lado de "Listas de compras", com as 3 mais recentes e o link para a lista.
- **Rationale**: Segue o padrão já usado por listas de compras (`ShoppingListsCard` + `/grupos/[id]/listas/[listId]`). A URL carrega o grupo, então o "voltar" e a checagem de membro são diretos.
- **Alternatives considered**: aba nova na página do grupo (`?aba=notas`) — rejeitado, a página do grupo já tem 453 linhas e o limite da constituição é 200 por componente; manter `/notas/[id]` global — rejeitado pela decisão FR-015.

## R3. Fim da área pessoal (FR-015/FR-016)

- **Decision**: Remover `app/(conta)/notas/*` e o item "Notas" de `components/app/nav-items.ts`. Redirecionar `/notas` e `/notas/:id` para `/grupos` em `next.config.ts`, junto do redirect de `/painel`.
- **Rationale**: Um redirect declarativo é uma linha e não exige página. `/notas/:id` não sabe o grupo da nota sem chamar a API; `/grupos` basta para FR-016.
- **Alternatives considered**: página que busca a nota e redireciona ao grupo dela — rejeitado, notas antigas não têm grupo (cairiam em erro).

## R4. Seletor de despesa e aviso de diferença (FR-008/FR-009)

- **Decision**: `<select>` nativo renderizado no servidor com as despesas do grupo (`listExpensesPage(groupId)`, até 100 mais recentes), excluindo as que já têm outra nota. Depois de vincular, o detalhe da nota mostra a diferença entre o total lido e o valor da despesa quando ela existe.
- **Rationale**: Sem JS no cliente; Server Action com redirect (padrão do app). O aviso não bloqueia, então mostrá-lo no resultado basta.
- **Alternatives considered**: combobox com busca no cliente — rejeitado (YAGNI); aviso antes de confirmar exigiria estado no cliente.
- **Ceiling**: grupos com mais de 100 despesas só veem as 100 mais recentes no seletor. Busca/paginação no seletor quando isso aparecer.

## R5. Anexar a partir da despesa (US3)

- **Decision**: O mesmo formulário de envio aceita `expenseId` opcional; a despesa também oferece `<select>` com notas do grupo sem vínculo (primeira página, 20).
- **Rationale**: Reaproveita `InvoiceUploadForm` e a action de vínculo; nada novo além de um campo oculto.

## R6. Testes

- **Decision**: Regras puras novas (diferença de valores, filtros de opções) em `lib/invoices.ts` com casos em `lib/invoices.test.mjs` (`pnpm test`). Fluxo ponta a ponta: atualizar `e2e/notes-notifications.spec.ts` para enviar nota pelo grupo e vincular a uma despesa.
- **Rationale**: Mesmo padrão de testes das features 004/007.
