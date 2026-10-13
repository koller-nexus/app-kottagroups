# Feature Specification: Ler o QR code da imagem enviada antes de cair no OCR

**Feature Branch**: `feature/007-qr-from-image`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "implemente essa issue: https://github.com/koller-nexus/app-kottagroups/issues/48"

## Contexto

Na página de uma lista de compras, o usuário tem dois caminhos para registrar a nota fiscal:
apontar a câmera para o QR code da NFC-e, ou enviar uma imagem da nota. Hoje a imagem enviada
vai direto para a leitura por OCR, mesmo quando ela contém um QR code legível. A leitura pelo QR
é mais rápida e mais confiável que o OCR, então o usuário que manda uma foto ou um print com QR
recebe um resultado pior do que poderia.

Esta feature é um follow-up da #8 (PR #44): o requisito foi acrescentado depois do merge. A
leitura do QR acontece no próprio aparelho do usuário; a imagem só é enviada ao servidor quando
não houver QR utilizável.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Imagem com QR da nota vira leitura por QR (Priority: P1)

O usuário escolhe uma foto ou print da nota que contém o QR code da NFC-e. Enquanto o aparelho
procura o QR, a tela mostra "Procurando QR code…". Ao encontrar um QR de nota fiscal, a tela
mostra "QR code encontrado, enviando…" e a nota é processada exatamente como se o QR tivesse sido
lido pela câmera. A imagem em si não é enviada. O resultado indica que a nota foi lida via QR code.

**Why this priority**: É o objetivo da issue. Transforma o caminho mais lento e menos preciso
(OCR) no mais rápido e preciso (QR) sem pedir nada a mais ao usuário.

**Independent Test**: Enviar uma imagem com QR nítido de NFC-e e verificar que o servidor recebe
apenas o endereço do QR (nenhum envio de arquivo) e que o status final indica "via QR code".

**Acceptance Scenarios**:

1. **Given** uma lista aberta e uma imagem com QR de NFC-e nítido, **When** o usuário seleciona a
   imagem, **Then** a tela mostra "Procurando QR code…", depois "QR code encontrado, enviando…",
   e a nota é processada pelo mesmo caminho da leitura pela câmera, sem envio da imagem.
2. **Given** uma imagem em que o QR é pequeno (rodapé de um cupom longo) ou a foto está girada
   90°, **When** o usuário seleciona a imagem, **Then** o QR ainda é encontrado e a nota segue
   pelo caminho do QR.
3. **Given** a nota foi processada via QR a partir da imagem, **When** o resultado aparece,
   **Then** o status indica que a leitura foi "via QR code".

---

### User Story 2 - Imagem sem QR continua indo para o OCR (Priority: P1)

O usuário envia uma imagem sem QR legível (QR cortado, borrado ou ausente). Depois da procura, a
tela avisa "Não achei o QR code, vou ler a nota pela imagem" e a imagem segue para a leitura por
OCR exatamente como acontece hoje.

**Why this priority**: Preserva o comportamento atual. Sem isso, a feature quebraria o único
caminho que funciona para notas sem QR.

**Independent Test**: Enviar uma imagem sem QR e verificar que o aviso aparece e que a imagem é
enviada ao servidor como hoje, com o mesmo resultado de antes.

**Acceptance Scenarios**:

1. **Given** uma imagem sem QR legível, **When** o usuário seleciona a imagem, **Then** a tela
   mostra o aviso "Não achei o QR code, vou ler a nota pela imagem" e a imagem é enviada para OCR.
2. **Given** a procura pelo QR excede o tempo limite, **When** o limite é atingido, **Then** o
   sistema trata como "sem QR" e segue para o OCR.

---

### User Story 3 - QR que não é de nota fiscal (Priority: P2)

O usuário envia uma imagem com um QR code que não é de NFC-e (por exemplo, um QR de cardápio ou
de promoção). A tela avisa "Esse QR não parece de nota fiscal" e oferece o botão "Enviar pro OCR
mesmo assim". Nada é enviado até o usuário decidir.

**Why this priority**: É menos frequente, mas sem esse tratamento o usuário receberia um erro
confuso ou a imagem seria descartada sem explicação.

**Independent Test**: Enviar uma imagem com QR que não é de NFC-e, verificar o aviso e o botão, e
que ao clicar no botão a imagem segue para OCR.

**Acceptance Scenarios**:

1. **Given** uma imagem com QR que não é de NFC-e, **When** a procura termina, **Then** a tela
   mostra "Esse QR não parece de nota fiscal" e o botão "Enviar pro OCR mesmo assim", e nada é
   enviado ao servidor.
2. **Given** o aviso está visível, **When** o usuário clica em "Enviar pro OCR mesmo assim",
   **Then** a imagem é enviada para OCR como no caminho sem QR.

---

### User Story 4 - Leitura pela câmera continua igual (Priority: P1)

A leitura do QR pela câmera passa a compartilhar o mesmo leitor de QR usado para imagens, mas o
comportamento visível para o usuário não muda.

**Why this priority**: Regressão na câmera quebraria o caminho principal da #8.

**Independent Test**: Repetir o fluxo de leitura pela câmera e verificar que ele detecta e envia
o QR como antes.

**Acceptance Scenarios**:

1. **Given** a câmera aberta apontada para um QR de NFC-e, **When** o QR é detectado, **Then** a
   nota é processada como antes desta feature.

---

### Edge Cases

- Arquivo selecionado não é uma imagem que o navegador consegue abrir: tratar como "sem QR" e
  seguir para o envio atual, que já valida o arquivo.
- Navegador sem leitor nativo de QR: usar o leitor alternativo, carregado só quando necessário.
- Imagem muito grande: reduzir antes de procurar o QR para não travar a tela.
- Usuário troca o arquivo enquanto a procura anterior ainda roda: só o resultado do arquivo mais
  recente vale.
- Mais de um QR na imagem: usar o primeiro QR de NFC-e encontrado.
- Envio via QR falha no servidor: mostrar o mesmo erro do caminho de QR pela câmera.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao selecionar uma imagem da nota, o sistema MUST procurar um QR code na imagem no
  aparelho do usuário antes de qualquer envio ao servidor.
- **FR-002**: Durante a procura, o sistema MUST exibir "Procurando QR code…" e manter a tela
  responsiva.
- **FR-003**: A procura MUST tentar a imagem inteira reduzida (lado maior de até 1600px) e, se
  falhar, variações de escala (100%, 75%, 50%), de rotação (0°, 90°, 180°, 270°) e o terço
  inferior da imagem ampliado.
- **FR-004**: A procura MUST terminar em no máximo ~1,5 segundo; ao estourar o limite, o
  resultado é "sem QR".
- **FR-005**: Quando o QR encontrado for de NFC-e (tiver chave de acesso válida), o sistema MUST
  exibir "QR code encontrado, enviando…" e processar a nota pelo mesmo caminho da leitura pela
  câmera, sem enviar a imagem.
- **FR-006**: Quando o QR encontrado não for de NFC-e, o sistema MUST exibir "Esse QR não parece
  de nota fiscal" e o botão "Enviar pro OCR mesmo assim", sem enviar nada até o clique.
- **FR-007**: Quando nenhum QR for encontrado, o sistema MUST exibir "Não achei o QR code, vou ler
  a nota pela imagem" e enviar a imagem para OCR exatamente como hoje.
- **FR-008**: O resultado de uma nota processada via QR a partir de imagem MUST indicar "via QR
  code".
- **FR-009**: O campo de envio MUST se chamar "Enviar imagem da nota" e exibir a dica "Serve foto
  ou print. Se tiver QR code, lemos direto."
- **FR-010**: A leitura pela câmera MUST usar o mesmo leitor de QR das imagens, sem mudança de
  comportamento visível.
- **FR-011**: O leitor alternativo de QR (para navegadores sem leitor nativo) MUST continuar sendo
  carregado apenas quando necessário, sem aumentar o carregamento inicial da página.
- **FR-012**: Quando o usuário trocar de arquivo durante uma procura, o sistema MUST descartar o
  resultado da procura anterior.

### Key Entities

- **Resultado da procura de QR**: um de três desfechos para a imagem selecionada — QR de NFC-e
  (com o endereço do QR), QR que não é de NFC-e, ou sem QR (inclui tempo esgotado e imagem
  ilegível). Determina qual caminho de envio é seguido.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Para imagens com QR de NFC-e nítido, 100% dos envios seguem pelo caminho do QR, sem
  envio da imagem ao servidor.
- **SC-002**: As três imagens de referência (QR nítido, QR pequeno e girado 90°, sem QR) produzem
  o desfecho esperado em todos os testes automatizados.
- **SC-003**: A procura do QR termina em até 1,5 segundo em todos os casos, inclusive quando não
  encontra nada.
- **SC-004**: Imagens sem QR produzem o mesmo resultado de OCR que antes desta feature.
- **SC-005**: A leitura pela câmera passa nos mesmos testes de antes, sem regressão.
- **SC-006**: O tamanho do carregamento inicial da página da lista não aumenta por causa do
  leitor alternativo de QR.

## Assumptions

- A validação "é QR de NFC-e" usa a mesma regra já existente para o QR lido pela câmera (extração
  da chave de acesso).
- O envio via QR reaproveita o caminho já existente da câmera; nenhuma mudança no backend é
  necessária.
- Os textos visíveis ao usuário seguem em português, como o restante da interface.
- Os testes cobrem a escolha do caminho (QR válido / QR inválido / sem QR) e um fluxo ponta a
  ponta com três imagens de referência guardadas no repositório.
- Fora de escopo: leitura de QR no servidor e envio de várias imagens de uma vez.
