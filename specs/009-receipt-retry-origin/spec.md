# Feature Specification: Tentar de novo a leitura da nota e mostrar de onde veio o resultado

**Feature Branch**: `feature/009-receipt-retry-origin`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Prompt para o front (app-kottagroups) — feature 059 da API: exibir a origem do resultado da leitura da nota, permitir tentar de novo quando a leitura falha, e mostrar itens só quando o resultado é final."

## Contexto

Na página de uma lista de compras, o usuário registra a nota fiscal por QR code, por foto ou por
texto. A nota é processada em segundo plano e a tela acompanha o status (na fila, processando,
concluída, precisa de revisão, falhou). Hoje, quando a leitura falha, o usuário não tem como pedir
nova tentativa e não sabe como o resultado foi obtido (QR, chave impressa ou leitura da foto), o
que importa para decidir se precisa conferir os itens.

A API passou a informar, junto com a nota, a **origem do resultado** e se uma **nova tentativa é
permitida** (e quantas restam). Também passou a entregar itens e correspondências somente quando o
resultado é final. Esta feature faz a tela usar essas informações.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tentar de novo quando a leitura falha (Priority: P1)

Quando a leitura da nota falha e ainda há tentativas, a tela mostra o botão "Tentar de novo" com o
número de tentativas restantes (por exemplo, "2 tentativas restantes"). Ao tocar, a nota volta para
a fila, o botão fica desabilitado enquanto o pedido é enviado, e a tela retoma o acompanhamento de
status que já existe até o resultado final.

**Why this priority**: É a ação nova que destrava o usuário diante de uma falha, sem precisar
reenviar a nota.

**Independent Test**: Com uma nota em falha e nova tentativa permitida, tocar em "Tentar de novo" e
ver o status passar para "na fila" e depois para o resultado final.

**Acceptance Scenarios**:

1. **Given** uma nota com falha e nova tentativa permitida com 2 restantes, **When** a tela é
   exibida, **Then** aparece o botão "Tentar de novo" e o texto "2 tentativas restantes".
2. **Given** o botão "Tentar de novo" visível, **When** o usuário toca nele, **Then** o botão fica
   desabilitado enquanto o pedido está em andamento e, após o pedido ser aceito, o status mostra
   "na fila" e o acompanhamento segue até o resultado final.
3. **Given** uma nota concluída, na fila ou processando, **When** a tela é exibida, **Then** o
   botão "Tentar de novo" não aparece, mesmo que haja tentativas restantes.
4. **Given** uma nota com falha e nova tentativa não permitida, **When** a tela é exibida, **Then**
   o botão não aparece.

---

### User Story 2 - Saber de onde veio o resultado (Priority: P2)

Quando a nota tem resultado, a tela mostra um selo com a origem: "Lido pelo QR code" (QR da foto),
"Lido pela chave de acesso" (chave impressa), "QR code" (QR ou chave enviados como texto) ou
"Lido da foto — confira os itens" (itens lidos do texto da foto). O último sinaliza que a leitura
é menos precisa e que o usuário deve conferir.

**Why this priority**: Dá confiança no resultado e orienta a conferência, mas não bloqueia o uso.

**Independent Test**: Exibir notas com cada uma das quatro origens e uma sem origem; verificar o
texto do selo (ou a ausência dele).

**Acceptance Scenarios**:

1. **Given** uma nota com origem "QR da foto", **When** a tela é exibida, **Then** o selo diz "Lido
   pelo QR code".
2. **Given** uma nota com origem "chave impressa", **Then** o selo diz "Lido pela chave de acesso".
3. **Given** uma nota com origem "QR ou chave enviados como texto", **Then** o selo diz "QR code".
4. **Given** uma nota com origem "texto da foto", **Then** o selo diz "Lido da foto — confira os
   itens".
5. **Given** uma nota sem origem informada, **Then** nenhum selo aparece.

---

### User Story 3 - Só mostrar itens quando o resultado é final (Priority: P2)

Enquanto a nota está na fila ou processando, a tela mostra apenas o status. Itens, correspondências,
estabelecimento e total não são exibidos. Os itens da lista que já estavam marcados por um
resultado anterior continuam marcados até o novo resultado ser gravado.

**Why this priority**: Evita mostrar dados parciais ou vazios que confundem durante o reprocessamento.

**Independent Test**: Com uma nota na fila ou processando, verificar que só o status aparece e que
itens marcados antes seguem marcados.

**Acceptance Scenarios**:

1. **Given** uma nota na fila ou processando, **When** a tela é exibida, **Then** só o status é
   mostrado, sem itens, correspondências, estabelecimento ou total.
2. **Given** itens da lista marcados por um resultado anterior e uma nova tentativa em andamento,
   **When** a tela é exibida, **Then** esses itens continuam marcados.

---

### User Story 4 - Falha sem nova tentativa oferece outros caminhos (Priority: P3)

Quando a leitura falha e nova tentativa não é permitida (por exemplo, a nota já foi importada no
grupo ou as tentativas acabaram), a tela explica que a nota não pode ser lida de novo e oferece
enviar outra foto ou escanear o QR code.

**Why this priority**: Evita beco sem saída, mas só vale quando a falha não tem solução por retry.

**Independent Test**: Com uma nota em falha sem nova tentativa, verificar a explicação e as duas
ações alternativas.

**Acceptance Scenarios**:

1. **Given** uma nota com falha e nova tentativa não permitida, **When** a tela é exibida, **Then**
   aparece uma explicação de que a nota não pode ser lida de novo e as ações "enviar outra foto" e
   "escanear o QR code".

---

### User Story 5 - Mensagens claras quando o pedido de nova tentativa é recusado (Priority: P3)

Se o servidor recusar a nova tentativa, o usuário vê uma mensagem em português que explica o motivo:
"Essa nota não pode ser lida de novo agora", "Essa nota já foi importada neste grupo" ou "Você já
usou todas as tentativas para esta nota".

**Why this priority**: Sem isso o usuário vê um erro genérico depois de tocar no botão.

**Independent Test**: Simular cada recusa e verificar a mensagem exibida.

**Acceptance Scenarios**:

1. **Given** o usuário tocou em "Tentar de novo", **When** o servidor recusa por estado atual
   inadequado, **Then** aparece "Essa nota não pode ser lida de novo agora".
2. **Given** a mesma ação, **When** a recusa é por nota já importada no grupo, **Then** aparece
   "Essa nota já foi importada neste grupo".
3. **Given** a mesma ação, **When** a recusa é por tentativas esgotadas, **Then** aparece "Você já
   usou todas as tentativas para esta nota".

### Edge Cases

- Toque duplo em "Tentar de novo": só um pedido é enviado enquanto o botão está desabilitado.
- Tentativas restantes igual a 1: o texto usa o singular ("1 tentativa restante").
- Nota que precisa de revisão: a mensagem técnica em inglês devolvida pelo servidor nunca é exibida
  ao usuário; a tela mostra texto próprio em português.
- Nota sem permissão (usuário não é membro do grupo), lista sem nota, nota só de arquivo (PDF) ou
  excesso de pedidos: a tela mostra mensagem em português já usada para esses casos nas outras ações
  de nota, sem quebrar a página.
- Origem desconhecida (valor novo que a tela não conhece): nenhum selo aparece.
- Falha de rede ao pedir nova tentativa: o botão volta a ficar habilitado e o usuário vê um erro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela da nota MUST mostrar o botão "Tentar de novo" somente quando a nota está com
  falha e a nova tentativa é permitida; nunca quando a nota está concluída, na fila ou processando.
- **FR-002**: O botão MUST mostrar o número de tentativas restantes, com singular e plural corretos.
- **FR-003**: Ao tocar no botão, a tela MUST pedir nova leitura da nota, mantê-lo desabilitado
  enquanto o pedido está em andamento e atualizar a página da lista.
- **FR-004**: Após o pedido ser aceito, a tela MUST retomar o acompanhamento de status já existente
  até o resultado final, sem criar um segundo acompanhamento.
- **FR-005**: Quando a nota tem origem do resultado, a tela MUST mostrar o selo: "Lido pelo QR code",
  "Lido pela chave de acesso", "QR code" ou "Lido da foto — confira os itens", conforme a origem;
  sem origem (ou origem desconhecida), MUST NOT mostrar selo.
- **FR-006**: Na fila ou processando, a tela MUST mostrar apenas o status, sem itens, correspondências,
  estabelecimento ou total.
- **FR-007**: Itens da lista marcados por um resultado anterior MUST permanecer marcados enquanto a
  nova leitura está em andamento.
- **FR-008**: Com falha e nova tentativa não permitida, a tela MUST explicar que a nota não pode ser
  lida de novo e oferecer enviar outra foto e escanear o QR code.
- **FR-009**: As recusas de nova tentativa MUST aparecer com as mensagens: "Essa nota não pode ser
  lida de novo agora", "Essa nota já foi importada neste grupo" e "Você já usou todas as tentativas
  para esta nota".
- **FR-010**: A tela MUST NOT exibir o texto técnico em inglês de mensagens de erro da leitura,
  inclusive quando a nota precisa de revisão.
- **FR-011**: A leitura de QR code no aparelho e o envio da foto quando ela falha MUST continuar como
  hoje, sem mudanças.
- **FR-012**: A regra de quando mostrar o botão e o mapeamento da origem para o texto do selo MUST
  ter testes automatizados, e o fluxo falha → tentar de novo → na fila → concluída com itens e selo,
  mais o caso de tentativas esgotadas, MUST ter um teste de ponta a ponta com o servidor simulado.

### Key Entities

- **Nota da lista (leitura)**: status, origem do resultado (QR da foto, chave impressa, QR/chave
  enviados como texto, texto da foto, ou nenhuma), permissão de nova tentativa e tentativas
  restantes, itens, correspondências, estabelecimento e total (estes só quando o resultado é final).
- **Pedido de nova tentativa**: ação do usuário sobre uma nota com falha; resulta em nota na fila ou
  em uma recusa com motivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário com nota em falha e tentativas restantes consegue pedir nova leitura em um
  único toque, sem reenviar a nota.
- **SC-002**: Em 100% das telas com nota na fila ou processando, nenhum item, correspondência,
  estabelecimento ou total é exibido.
- **SC-003**: Em 100% das notas com origem conhecida, o selo exibido corresponde ao texto definido;
  em 100% das notas sem origem, nenhum selo é exibido.
- **SC-004**: O botão "Tentar de novo" aparece em 0% das telas de nota concluída, na fila ou
  processando.
- **SC-005**: Em 100% das recusas de nova tentativa, o usuário vê uma mensagem em português; nenhum
  texto em inglês do servidor chega à tela.
- **SC-006**: Os testes automatizados da regra do botão, do mapeamento do selo e do fluxo de nova
  tentativa (incluindo tentativas esgotadas) passam.

## Assumptions

- O servidor já entrega os novos dados da nota e a rota de nova tentativa; nenhuma mudança no
  servidor faz parte desta feature.
- O acompanhamento de status existente reinicia sozinho quando o status volta a "na fila" após a
  página ser atualizada; não é criado outro.
- Mensagens para nota inexistente/só de arquivo, falta de permissão e excesso de pedidos reutilizam
  os textos em português já existentes para as demais ações de nota.
- Os textos de selo e de erro acima são os definitivos; o texto da explicação da falha sem nova
  tentativa segue o mesmo tom e é definido na implementação.
- Fora de escopo: mudar a leitura de QR no aparelho, criar outro acompanhamento de status e qualquer
  mudança no servidor.
