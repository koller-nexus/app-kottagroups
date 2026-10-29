# Feature Specification: Consultar o status das notas em lote no acompanhamento

**Feature Branch**: `feature/028-batch-invoice-status`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/90"

## Contexto

Item opcional da #81 que ficou fora da spec 026 (research R7). Dependia de
koller-nexus/api-kottagroups#255, entregue na PR api#256.

**Hoje:** enquanto há notas em leitura, a tela consulta periodicamente o status delas no app. Para
cada ciclo, o app faz uma consulta à API por nota, até 20 em paralelo. Cada uma conta no limite de
requisições da API. Quem tem várias notas em leitura gasta o próprio limite rápido.

**Do lado da API (api#255, PR api#256):** existe uma consulta de status em lote, com até 20 notas
numa requisição só, que conta uma vez no limite. A resposta traz só as notas que a pessoa pode ver;
nota excluída, de outra pessoa ou de grupo de que ela saiu simplesmente não aparece. A API recusa a
consulta inteira quando falta id, há mais de 20, um id repetido ou um id fora do formato canônico
das notas.

**O que muda:** o app passa a fazer uma única consulta à API por ciclo. O que a tela recebe do app
continua igual, então o acompanhamento no navegador não muda.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acompanhar várias notas em leitura com uma consulta por ciclo (Priority: P1)

A pessoa envia várias fotos de nota. A tela mostra cada nota "em leitura" e, a cada ciclo do
acompanhamento, o status de todas é atualizado com uma única consulta à API. Quando uma nota termina
de ser lida, ela muda de estado na tela como hoje.

**Why this priority**: é o objetivo da issue. Uma consulta por nota multiplica o uso do limite de
requisições e pode bloquear a pessoa justamente quando ela está enviando várias notas.

**Independent Test**: com a API simulada e várias notas em leitura, abrir a tela e conferir que um
ciclo gera uma única consulta de status à API e que cada nota mostra o status devolvido.

**Acceptance Scenarios**:

1. **Given** três notas em leitura, **When** um ciclo do acompanhamento roda, **Then** o app faz
   exatamente uma consulta de status à API, com as três notas.
2. **Given** a API devolve um status novo para uma das notas, **When** o ciclo termina, **Then** a
   tela mostra o status novo dessa nota e mantém as outras em leitura.
3. **Given** uma única nota em leitura, **When** um ciclo roda, **Then** o app também faz uma única
   consulta à API.
4. **Given** qualquer ciclo, **When** a tela recebe a resposta do app, **Then** o formato é o mesmo
   de hoje: a lista de notas com id e status.

---

### User Story 2 - Nota sem acesso some sem derrubar as demais (Priority: P2)

Uma das notas acompanhadas é excluída ou deixa de estar acessível (por exemplo, a pessoa saiu do
grupo). O acompanhamento continua atualizando as outras notas normalmente.

**Why this priority**: é o comportamento de hoje e não pode piorar; sem ele, uma nota apagada
travaria o acompanhamento de todas.

**Independent Test**: com a API simulada omitindo uma das notas pedidas, conferir que a resposta do
app traz só as notas acessíveis e que a tela continua atualizando as outras.

**Acceptance Scenarios**:

1. **Given** duas notas acompanhadas e a API devolve só uma, **When** o ciclo termina, **Then** a
   resposta do app traz só a nota devolvida, sem erro.
2. **Given** nenhuma das notas pedidas é acessível, **When** o ciclo termina, **Then** a resposta
   do app é uma lista vazia, sem erro.

---

### Edge Cases

- **Id que a API recusaria**: o app recusa a consulta antes de chamar a API quando algum id está
  fora do formato das notas, em vez de mandar à API um pedido que ela vai recusar inteiro.
- **Ids repetidos no pedido da tela**: o app consulta cada nota uma vez só, como hoje; a API nunca
  recebe id repetido.
- **Mais de 20 notas**: o app recusa como hoje, antes de chamar a API.
- **API indisponível ou recusando a consulta**: o app responde com a mesma falha de serviço
  indisponível de hoje; a tela segue o comportamento atual para falhas.
- **Limite de requisições da API atingido**: tratado como API indisponível naquele ciclo; o próximo
  ciclo tenta de novo.
- **Sessão expirada**: continua com o mesmo tratamento de hoje (a tela recarrega e segue o fluxo de
  sessão expirada).
- **Resposta não guardada**: a resposta do app continua sem cache, como hoje.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A cada consulta de status recebida da tela, o app MUST fazer no máximo uma consulta à
  API, com todas as notas pedidas.
- **FR-002**: A resposta do app à tela MUST manter o formato atual: a lista de notas, cada uma com
  id e status.
- **FR-003**: A resposta do app MUST trazer só as notas que a API devolveu; notas omitidas pela API
  MUST ser omitidas também, sem erro.
- **FR-004**: O app MUST recusar com erro de pedido inválido, antes de chamar a API, qualquer
  consulta vazia, com mais de 20 notas ou com id fora do formato aceito pela API.
- **FR-005**: O app MUST enviar cada nota uma única vez à API, mesmo que a tela peça a mesma nota
  mais de uma vez.
- **FR-006**: Quando a API falhar ou recusar a consulta, o app MUST responder com a mesma falha de
  serviço indisponível de hoje.
- **FR-007**: O tratamento de sessão ausente ou expirada MUST continuar igual ao de hoje.
- **FR-008**: O tratamento individual de nota inacessível (consultar nota por nota e ignorar as que
  não existem ou são de outra pessoa) MUST ser removido desta consulta, já que a API passa a fazer
  essa filtragem.
- **FR-009**: Os testes de ponta a ponta MUST cobrir, com a API simulada: um ciclo com várias notas
  em leitura gera uma única consulta de status à API, e o status de cada nota é atualizado na tela.

### Key Entities

- **Status da nota**: o estado de leitura de uma nota (em leitura, lida, falhou etc.), identificado
  pelo id da nota. É o único dado trocado nesta consulta.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um ciclo do acompanhamento com N notas em leitura (1 a 20) gera exatamente 1
  consulta à API, em vez de N.
- **SC-002**: Uma pessoa com 20 notas em leitura gasta 20 vezes menos do limite de requisições por
  ciclo do que hoje.
- **SC-003**: 100% das mudanças de status devolvidas pela API aparecem na tela no mesmo ciclo, como
  hoje.
- **SC-004**: Nenhuma consulta que a API recusaria por formato chega à API.
- **SC-005**: O acompanhamento no navegador não precisa de nenhuma mudança.

## Assumptions

- O contrato da API está fechado (api#255, PR api#256): até 20 ids por consulta; resposta com a
  lista de notas acessíveis com id e status; recusa da consulta inteira para id ausente, repetido,
  fora do formato canônico ou acima de 20.
- O formato aceito pelo app para ids passa a ser o mesmo que a API aceita; ids no formato antigo e
  mais permissivo não vêm da tela, que só pede notas que ela mesma listou.
- A consulta individual de nota continua existindo para a tela de detalhe da nota; só a consulta de
  status do acompanhamento muda.
- A agenda do acompanhamento (intervalos, duração máxima, recarga manual) não muda.
- O app e a API são publicados em ordem: a API já está no ar, então a troca pode ir direto.
