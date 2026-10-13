# Feature Specification: Escanear NFC-e e marcar itens da lista encontrados na nota

**Feature Branch**: `feature/004-receipt-scan-matching`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "implement this issue: https://github.com/koller-nexus/app-kottagroups/issues/8"

## Contexto

Hoje, na página de uma lista de compras, o usuário pode enviar a foto da nota fiscal, mas o envio
só guarda o arquivo e mostra uma prévia: nada é lido da nota e nada é cruzado com a lista. Marcar o
que foi comprado é um trabalho manual, item por item.

O caso principal é uma pessoa no mercado, com o celular na mão, logo depois de pagar. Ela quer
apontar a câmera para o QR code da NFC-e e ver, sem digitar nada, quais itens da lista vieram na
nota, quais precisam de uma conferida e quais ficaram de fora.

A leitura da nota e o cruzamento com a lista são feitos pelo serviço de backend
(koller-nexus/api-kottagroups#156). Esta feature cobre a experiência na web.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver os itens da lista marcados conforme a nota (Priority: P1)

Depois que uma nota foi processada para a lista, cada item aparece em um de três estados:
encontrado na nota, "confere?" (o sistema achou um item parecido, mas não tem certeza) ou não
encontrado. Itens encontrados mostram o que veio na nota (quantidade, descrição e valor). Itens
"confere?" têm botões **Sim** e **Não**; um toque resolve. O topo da lista mostra um resumo, por
exemplo "12 de 15 itens encontrados na nota · 2 para conferir".

**Why this priority**: É o valor da feature: a lista se marca sozinha. Funciona e pode ser
demonstrada com uma nota já processada, mesmo antes do fluxo de captura existir.

**Independent Test**: Abrir uma lista que já tem nota processada com itens nos três estados e
confirmar que cada linha mostra o estado certo por ícone, texto e cor, e que Sim/Não atualizam a
linha.

**Acceptance Scenarios**:

1. **Given** uma lista com nota processada, **When** o usuário abre a lista, **Then** cada item
   encontrado aparece destacado como encontrado, com ícone de confirmação e o texto da nota (ex.:
   "2x LEITE INTEG 1L · R$ 9,98").
2. **Given** um item no estado "confere?", **When** o usuário toca em **Sim**, **Then** a linha
   passa a encontrado sem recarregar a página inteira.
3. **Given** um item no estado "confere?", **When** o usuário toca em **Não**, **Then** a linha
   passa a não encontrado e deixa de contar como comprado.
4. **Given** um item sem correspondência na nota, **When** o usuário marca o item manualmente,
   **Then** a marcação manual funciona como hoje.
5. **Given** uma lista com nota processada, **When** o usuário olha o topo da lista, **Then** vê
   quantos itens foram encontrados, do total, e quantos faltam conferir.

---

### User Story 2 - Escanear o QR code da nota e acompanhar o processamento (Priority: P1)

Na página da lista, o usuário toca em **Escanear QR code**. A câmera abre, lê o QR da NFC-e e envia
a nota sozinha. A página mostra o andamento ("Lendo sua nota…") e, quando termina, a lista aparece
marcada (US1). Se algo der errado, a mensagem diz o que aconteceu e oferece um caminho: tentar de
novo ou enviar foto.

**Why this priority**: É a forma mais rápida e confiável de trazer a nota para a lista; sem ela, o
usuário depende de foto.

**Independent Test**: Em um celular, abrir uma lista sem nota, escanear o QR de uma NFC-e real e
ver a lista ficar marcada sem digitar nada.

**Acceptance Scenarios**:

1. **Given** uma lista sem nota e um dispositivo com câmera, **When** o usuário toca em
   **Escanear QR code** e aponta para o QR de uma NFC-e, **Then** a nota é enviada sem o usuário
   digitar ou confirmar nada.
2. **Given** um QR que não é de nota fiscal, **When** ele é lido, **Then** nada é enviado e aparece
   "Esse QR não parece de nota fiscal", com o leitor ainda aberto.
3. **Given** uma nota enviada, **When** ela está na fila ou sendo lida, **Then** a página mostra
   "Lendo sua nota…" e continua utilizável.
4. **Given** uma nota em processamento, **When** o processamento termina, **Then** a lista é
   atualizada com os itens marcados sem o usuário recarregar a página.
5. **Given** uma nota que falhou, **When** o processamento termina com erro, **Then** aparece uma
   mensagem clara com **Tentar de novo** e **Enviar foto**.
6. **Given** uma nota já usada no grupo, **When** o usuário a envia de novo, **Then** aparece "Essa
   nota já foi usada neste grupo" e nada é duplicado.
7. **Given** o leitor aberto, **When** o usuário toca em fechar ou aperta Esc, **Then** o leitor
   fecha e a câmera é liberada.

---

### User Story 3 - Enviar foto ou digitar a chave quando o QR não dá (Priority: P2)

Se o dispositivo não tem câmera, a permissão foi negada ou o QR está ilegível, o usuário pode
enviar uma foto da nota ou digitar a chave de acesso de 44 dígitos. A chave aparece agrupada em
blocos de 4 para facilitar a digitação. A foto é reduzida no próprio aparelho antes do envio.

**Why this priority**: Garante que ninguém fica sem caminho, mas é o fluxo secundário.

**Independent Test**: Negar a permissão de câmera, digitar uma chave válida e ver a nota ser
processada; em outra lista, enviar uma foto e ver o processamento começar.

**Acceptance Scenarios**:

1. **Given** o usuário negou a câmera ou o dispositivo não tem câmera, **When** tenta escanear,
   **Then** vê o campo para digitar a chave de acesso e a opção de enviar foto.
2. **Given** o campo da chave, **When** o usuário digita, **Then** os dígitos aparecem em blocos de
   4 e o envio só é liberado com 44 dígitos.
3. **Given** uma foto grande da nota, **When** o usuário envia, **Then** o arquivo enviado é menor
   que o original e o processamento começa como no QR.

---

### User Story 4 - Ver o resumo da nota (Priority: P3)

Abaixo da lista, um cartão mostra o estabelecimento, a data da compra, o total em reais e como a
nota foi lida ("via QR code" ou "via foto"). Itens da nota que não correspondem a nada da lista
ficam em uma seção recolhida "Também na nota (N)".

**Why this priority**: Útil para conferir e dividir gastos, mas a lista marcada já entrega o
principal.

**Independent Test**: Abrir uma lista com nota processada e conferir os dados do cartão e a
contagem de itens extras.

**Acceptance Scenarios**:

1. **Given** uma nota processada, **When** o usuário abre a lista, **Then** vê estabelecimento,
   data, total formatado em reais e o método de leitura.
2. **Given** uma nota com itens que não estão na lista, **When** o usuário abre "Também na nota
   (N)", **Then** vê esses itens; a seção começa recolhida.
3. **Given** uma nota em que todos os itens estão na lista, **When** o usuário abre a lista,
   **Then** a seção "Também na nota" não aparece.

---

### Edge Cases

- QR lido de uma nota de outro estado ou com formato inesperado: tratado como "não parece de nota
  fiscal" se não tiver a chave de 44 dígitos; se o backend recusar, cai no estado de falha.
- Processamento demora mais que o limite de espera (~2 min): a página para de consultar e mostra que
  a nota ainda está sendo lida, com opção de verificar de novo, sem travar a lista.
- Usuário sai da página durante o processamento e volta: o estado atual da nota é mostrado ao abrir.
- Toque duplo em Sim/Não ou erro de rede ao confirmar: a linha não fica em estado inconsistente; em
  erro, volta ao estado anterior e informa a falha.
- Nota processada sem nenhum item correspondente: todos os itens aparecem como não encontrados e o
  resumo diz "0 de N itens encontrados na nota".
- Lista vazia com nota processada: o cartão da nota e "Também na nota" aparecem normalmente.
- Leitor aberto e usuário troca de aba ou bloqueia a tela: a câmera é liberada.

## Requirements *(mandatory)*

### Functional Requirements

**Captura**

- **FR-001**: A página da lista MUST oferecer **Escanear QR code** como ação principal e **Enviar
  foto** como ação secundária quando a lista ainda não tem nota ou a última nota falhou.
- **FR-002**: O leitor MUST enviar a nota automaticamente ao ler um QR de NFC-e válido, sem ação
  adicional do usuário.
- **FR-003**: Antes de enviar, o sistema MUST verificar que o QR contém uma chave de acesso de 44
  dígitos; caso contrário MUST mostrar "Esse QR não parece de nota fiscal" e não enviar.
- **FR-004**: O leitor MUST poder ser fechado por um botão visível e pela tecla Esc, e MUST liberar a
  câmera ao fechar.
- **FR-005**: Sem câmera disponível ou com permissão negada, o sistema MUST oferecer a digitação
  manual da chave de acesso (44 dígitos, exibidos em blocos de 4) e o envio de foto.
- **FR-006**: Fotos MUST ser reduzidas no aparelho antes do envio (lado maior até 1600 px), mantendo
  a nota legível.
- **FR-007**: O recurso de leitura de QR MUST ser carregado só quando o usuário pede para escanear,
  sem pesar no carregamento inicial da página.

**Processamento**

- **FR-008**: Após o envio, a página MUST mostrar o estado da nota — na fila/lendo ("Lendo sua
  nota…"), concluída, para conferir ("Confira alguns itens") ou falhou — e consultá-lo
  periodicamente (a cada ~2 s, espaçando até ~5 s, por no máximo ~2 min).
- **FR-009**: Mudanças de estado do processamento MUST ser anunciadas a leitores de tela sem
  interromper o usuário.
- **FR-010**: Ao sair do estado de processamento, a lista MUST ser atualizada com as marcações sem
  recarregar a página inteira.
- **FR-011**: Em falha, o sistema MUST mostrar o motivo em português e oferecer **Tentar de novo** e
  **Enviar foto**.
- **FR-012**: Se a nota já foi usada no grupo, o sistema MUST mostrar "Essa nota já foi usada neste
  grupo" e não criar duplicata.

**Itens marcados**

- **FR-013**: Cada item da lista MUST mostrar um de três estados: encontrado (inclui confirmados pelo
  usuário), "confere?" ou não encontrado. Cada estado MUST ter ícone e texto próprios além da cor
  ("Encontrado", "Confere?", "Não encontrado").
- **FR-014**: Itens encontrados MUST mostrar o que veio na nota: quantidade, descrição e valor da
  linha em reais.
- **FR-015**: Itens "confere?" MUST ter ações **Sim** (confirma) e **Não** (rejeita); o resultado
  MUST aparecer na linha sem recarregar a página inteira.
- **FR-016**: Rejeitar uma correspondência MUST fazer o item deixar de contar como comprado.
- **FR-017**: Itens sem correspondência MUST continuar com a marcação manual de comprado.
- **FR-018**: O topo da lista MUST mostrar o resumo "X de Y itens encontrados na nota · Z para
  conferir" (omitindo a parte "para conferir" quando Z = 0) e o total da nota quando concluída.
- **FR-019**: Somente membros com acesso à lista MUST poder enviar notas e confirmar ou rejeitar
  correspondências.

**Resumo da nota**

- **FR-020**: Com nota processada, a página MUST mostrar estabelecimento, data da compra, total em
  reais e método de leitura ("via QR code" ou "via foto").
- **FR-021**: Itens da nota sem correspondência na lista MUST aparecer em uma seção recolhida "Também
  na nota (N)", omitida quando N = 0.

**Qualidade**

- **FR-022**: Todo o fluxo MUST funcionar em telas de celular, ser operável por teclado com foco
  visível e usar as cores do sistema de design do produto.

### Key Entities

- **Nota fiscal da lista**: a NFC-e associada a uma lista. Atributos: estado do processamento,
  método de leitura (QR ou foto), estabelecimento, data, total, itens da nota.
- **Item da nota**: uma linha da nota. Descrição, quantidade, valor da linha.
- **Correspondência**: liga um item da lista a um item da nota. Estado (encontrado, confirmado,
  para conferir, rejeitado) e grau de confiança. Um item da lista tem no máximo uma.
- **Chave de acesso**: identificador de 44 dígitos da NFC-e; impede usar a mesma nota duas vezes no
  grupo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Do toque em "Escanear QR code" até a lista marcada, o usuário não digita nada e não
  confirma nada, em 100% dos QR de NFC-e válidos.
- **SC-002**: Com o backend respondendo normalmente, a lista aparece marcada em até 30 s após a
  leitura do QR.
- **SC-003**: Resolver um item "confere?" leva um toque e a linha muda de estado em até 1 s.
- **SC-004**: Fotos enviadas têm no máximo 1600 px no lado maior e são menores que o original.
- **SC-005**: Todo estado de item é identificável sem depender de cor (verificável com a tela em
  tons de cinza).
- **SC-006**: Todo estado de erro (QR inválido, nota repetida, falha, demora) mostra mensagem em
  português e pelo menos uma ação para continuar.
- **SC-007**: O carregamento inicial da página da lista não fica mais pesado por causa do leitor de
  QR.
- **SC-008**: As regras de validação da chave e do QR têm testes automatizados, e as verificações
  de qualidade do projeto passam.

## Assumptions

- Depende do contrato definido em koller-nexus/api-kottagroups#156 (método de leitura, itens da
  nota, correspondência por item e confirmação/rejeição), já entregue na spec 053 do backend
  (`api-kottagroups/specs/053-nfce-shopping-match/contracts/http-api.md`).
- Uma lista tem no máximo uma nota ativa. Depois de concluída, a área de captura dá lugar ao resumo;
  trocar a nota de uma lista concluída fica fora do escopo.
- Quem decide e desfaz a marcação de comprado ao rejeitar é o backend; a web só reflete o
  resultado.
- Qualquer membro do grupo com acesso à lista pode escanear e conferir itens, sem papel especial.
- A interface é em português; o público é brasileiro e as notas são NFC-e.
- Detalhes técnicos sugeridos no issue (bibliotecas de leitura, formato de envio, nomes de
  componentes) ficam para o plano.

### Fora de escopo

- Ler o QR de uma foto já tirada.
- Atualização em tempo real por canal aberto; consulta periódica basta.
- Editar itens da nota.
- App mobile nativo.
