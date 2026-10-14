# Feature Specification: Marcar como comprado, sozinho, o que veio na nota

**Feature Branch**: `feature/014-auto-check-shopping-items`

**Created**: 2026-10-14

**Status**: Draft

> **Atualização (2026-10-14)**: a US2 foi substituída. Depois de esclarecer com o dono do produto,
> uma nota do grupo lida com itens vira uma **lista nova** com todos os itens marcados, criada pelo
> backend (`api-kottagroups` feature 063). Não há seletor de lista na tela da nota. A web mostra o
> link "Ver lista de compras" e usa `sentFromList` para decidir rótulos e exclusão.

**Input**: User description: "ao preencher a nota, quero que os dados fiquem preenchido com check na lista de compras, de forma automatica"

## Contexto

Hoje, quando a nota de uma lista de compras termina de ser lida, cada item da lista mostra se foi
encontrado na nota ("encontrado", "confere?" ou não encontrado). Mas o check de **comprado** é uma
coisa à parte: a pessoa ainda precisa tocar item por item para marcar o que já está no carrinho,
mesmo quando a nota já provou que o item foi comprado. Além disso, uma nota enviada pela seção
**Notas** do grupo não conversa com nenhuma lista.

O que a pessoa quer: enviou a nota, a lista fica com check nos itens que vieram nela, sem tocar em
nada.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Itens encontrados na nota ficam com check de comprado (Priority: P1)

A pessoa envia a nota pela lista de compras (foto ou QR code). Quando a leitura termina, todo item
que a nota confirma aparece com o check de comprado marcado, riscado como os itens marcados à mão,
e o progresso da lista ("8 de 12 itens") já conta esses itens.

**Why this priority**: É o pedido em si. Sozinha, esta história já elimina a marcação manual no
caso principal.

**Independent Test**: Numa lista com 5 itens pendentes, enviar uma nota que contém 3 deles e
confirmar que, ao fim da leitura, os 3 aparecem com check e o progresso mostra "3 de 5 itens", sem
nenhum toque.

**Acceptance Scenarios**:

1. **Given** uma lista com itens pendentes e uma nota em leitura, **When** a leitura termina,
   **Then** cada item no estado "encontrado" aparece com check de comprado e o progresso da lista é
   atualizado sem recarregar a página.
2. **Given** um item no estado "confere?", **When** a leitura termina, **Then** o item continua sem
   check até a pessoa responder.
3. **Given** um item no estado "confere?", **When** a pessoa toca em **Sim**, **Then** o item passa
   a encontrado e ganha o check de comprado.
4. **Given** um item encontrado e com check automático, **When** a pessoa toca em **Não** (rejeita a
   correspondência), **Then** o check é removido.
5. **Given** um item sem correspondência, **When** a leitura termina, **Then** o check dele fica como
   estava (marcado à mão continua marcado; pendente continua pendente).
6. **Given** um item com check automático, **When** a pessoa desmarca à mão, **Then** o item fica
   desmarcado e uma nova atualização da mesma nota não o marca de novo.

---

### User Story 2 - Nota enviada pela seção Notas do grupo também marca a lista (Priority: P2)

A pessoa envia a nota pela seção **Notas** do grupo, não pela lista. Na tela da nota, ela escolhe
a lista de compras daquela ida ao mercado. A nota passa a ser o comprovante da lista e os itens
encontrados ficam com check, como na US1.

**Why this priority**: Amplia o automático para quem envia a nota pelo caminho do grupo, mas o caso
principal (enviar pela lista) já é coberto pela US1.

**Independent Test**: Enviar uma nota pela seção Notas, escolher uma lista com itens que aparecem
na nota e confirmar que a lista abre com esses itens marcados.

**Acceptance Scenarios**:

1. **Given** uma nota do grupo já lida e sem lista, **When** a pessoa escolhe a lista "Mercado
   sábado", **Then** a lista passa a mostrar a nota como comprovante e os itens encontrados ficam com
   check.
2. **Given** uma nota do grupo ainda em leitura, **When** a pessoa escolhe a lista, **Then** os checks
   aparecem quando a leitura terminar.
3. **Given** o seletor de listas, **When** a pessoa o abre, **Then** só aparecem listas do mesmo grupo
   que ainda não têm nota.

---

### Edge Cases

- Nota cuja leitura falhou ou ficou "precisa revisar" sem itens: nenhum check é alterado.
- A mesma linha da nota corresponde a dois itens da lista: só o item que recebeu a correspondência
  ganha check; o outro segue a regra do seu próprio estado.
- Quantidade na nota menor que na lista (lista pede 3, nota traz 1): o item ganha check; a
  quantidade da nota aparece no texto da correspondência, como já acontece.
- Item excluído da lista enquanto a nota está em leitura: ignorado, sem erro.
- Nota reenviada ("tentar de novo"): os checks seguem o resultado da leitura nova; checks
  automáticos da leitura anterior que não se confirmarem são removidos, checks feitos à mão ficam.
- Grupo arquivado: a lista não muda e o seletor de lista fica indisponível.
- Lista já tem nota: não aparece no seletor da US2.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao fim da leitura de uma nota ligada a uma lista, todo item no estado "encontrado"
  MUST ficar com o check de comprado marcado, sem ação da pessoa.
- **FR-002**: Itens no estado "confere?" MUST permanecer sem check automático até a pessoa
  confirmar; confirmar com **Sim** MUST marcar o check.
- **FR-003**: Rejeitar uma correspondência (**Não**) MUST remover o check que veio da nota.
- **FR-004**: Itens sem correspondência MUST manter o check que já tinham.
- **FR-005**: Um check desmarcado à mão MUST NOT ser marcado de novo por uma atualização da mesma
  leitura.
- **FR-006**: O progresso da lista MUST contar os checks automáticos como os manuais.
- **FR-007**: A lista aberta durante a leitura MUST mostrar os checks ao fim da leitura sem a
  pessoa recarregar a página.
- **FR-008**: Item com check automático MUST ter a mesma aparência de um item marcado à mão
  (check e texto riscado), e continuar mostrando o que veio na nota.
- **FR-009**: Na tela de uma nota do grupo sem lista, a pessoa MUST poder escolher uma lista do
  mesmo grupo sem nota; a escolha MUST aplicar FR-001 a FR-007 a essa lista.
- **FR-010**: Em grupo arquivado, nenhum check MUST ser alterado e o seletor de lista MUST ficar
  indisponível.

### Key Entities

- **Item da lista**: nome, quantidade, check de comprado e, quando há nota, a correspondência com
  uma linha da nota (encontrado / confere?).
- **Nota**: comprovante do grupo, lido automaticamente (estabelecimento, data, itens, total); pode
  estar ligada a no máximo uma lista.
- **Origem do check**: se o check veio da nota ou da pessoa, para saber o que a rejeição ou uma
  nova leitura pode desfazer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Numa nota lida com sucesso, 100% dos itens "encontrado" aparecem com check sem
  nenhum toque.
- **SC-002**: Com o serviço respondendo normalmente, os checks aparecem em até 30 s após a nota
  ser enviada, sem recarregar a página.
- **SC-003**: Nenhum item marcado à mão perde o check por causa de uma leitura ou releitura de nota.
- **SC-004**: Uma ida ao mercado com nota legível termina com zero toques de marcação para os itens
  encontrados.

## Assumptions

- O cruzamento nota × lista e os estados "encontrado" / "confere?" já existem (feature 004) e são
  reaproveitados; esta feature só liga esses estados ao check de comprado.
- Quem grava o check é o serviço de backend ao concluir a leitura e ao confirmar/rejeitar; a web
  reflete o estado vindo dele. Se o backend ainda não faz isso, é uma dependência
  (koller-nexus/api-kottagroups).
- A US2 depende do backend permitir ligar uma nota existente do grupo a uma lista e reprocessar o
  cruzamento; hoje a nota só nasce ligada à lista quando enviada por ela.
- Uma lista tem no máximo uma nota, como hoje.
- A ligação nota → despesa (feature 008) não muda.
