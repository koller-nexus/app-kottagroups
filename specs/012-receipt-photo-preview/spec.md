# Feature Specification: Mostrar a foto enviada na tela da nota

**Feature Branch**: `feature/012-receipt-photo-preview`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "http://localhost:3002/grupos/01M4XN5SCGCG992H3QXMH9G7YZ/notas/01M4XN833FCNV0ERXGB9K4WY73 do lado direito quero que exiba a foto tb que foi feito o upload"

## Contexto

A tela de detalhe da nota (`/grupos/{grupo}/notas/{nota}`) mostra o estado da leitura, os totais, os
itens e o vínculo com a despesa, mas não mostra a imagem que foi enviada. Para conferir uma leitura
(principalmente quando a tela avisa "Confira os dados antes de usar") ou entender uma falha, a pessoa
precisa ter a foto em mãos fora do app. O pedido é exibir essa foto do lado direito da tela.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a foto ao lado da leitura (Priority: P1)

Ao abrir uma nota que foi enviada como imagem, a pessoa vê a foto enviada numa coluna à direita,
enquanto os dados lidos (totais, itens, despesa) ficam à esquerda. Assim dá para comparar item a
item sem sair da tela.

**Why this priority**: É o pedido central e o que permite conferir uma leitura com aviso de revisão.

**Independent Test**: Abrir uma nota enviada como foto, em tela de computador, e ver a imagem à
direita dos dados lidos.

**Acceptance Scenarios**:

1. **Given** uma nota lida que foi enviada como foto, **When** a tela é aberta em tela larga,
   **Then** a foto aparece numa coluna à direita dos dados da nota, inteira (sem corte) e com texto
   alternativo que identifica a nota.
2. **Given** uma nota na fila, processando ou com falha, enviada como foto, **When** a tela é aberta,
   **Then** a foto aparece do mesmo jeito, junto do aviso de leitura ou do erro.
3. **Given** uma tela estreita (celular), **When** a tela é aberta, **Then** a foto aparece numa
   única coluna junto dos dados, sem rolagem horizontal.
4. **Given** uma nota longa, **When** a pessoa rola a lista de itens em tela larga, **Then** a foto
   continua visível ao lado enquanto houver espaço.

---

### User Story 2 - Ampliar a foto (Priority: P2)

A pessoa toca ou clica na foto e ela abre em tamanho original, para ler valores pequenos.

**Why this priority**: Fotos de cupom têm letras pequenas; a miniatura da coluna nem sempre basta.

**Independent Test**: Clicar na foto e ver a imagem em tamanho original; voltar à tela da nota.

**Acceptance Scenarios**:

1. **Given** a foto exibida, **When** a pessoa ativa a foto (clique, toque ou teclado), **Then** a
   imagem abre em tamanho original numa nova aba.

---

### User Story 3 - Nota sem imagem ou com PDF (Priority: P3)

Notas enviadas pelo QR code (sem upload de imagem) não têm foto: a coluna não aparece e a tela fica
como hoje. Notas enviadas como PDF mostram, no lugar da foto, um link para abrir o arquivo.

**Why this priority**: Evita espaço vazio ou imagem quebrada nos casos que não têm foto.

**Independent Test**: Abrir uma nota criada pelo QR code e ver a tela sem coluna de foto; abrir uma
nota enviada em PDF e ver o link "Abrir PDF".

**Acceptance Scenarios**:

1. **Given** uma nota criada pelo QR code, **When** a tela é aberta, **Then** não há coluna de foto
   nem espaço reservado.
2. **Given** uma nota enviada em PDF, **When** a tela é aberta, **Then** aparece um link para abrir
   o arquivo em vez da pré-visualização.

---

### Edge Cases

- A imagem não carrega (link expirado, arquivo removido, rede): a coluna mostra "Não foi possível
  carregar a foto." em vez de imagem quebrada, e o resto da tela segue normal.
- A nota é excluída: a foto some junto (comportamento já descrito na confirmação de exclusão).
- O link de acesso à foto expira enquanto a tela está aberta (ex.: página de nota pendente que se
  atualiza sozinha): a próxima atualização da página traz um link novo.
- Pessoa que não é membro do grupo: não vê a nota nem a foto (mesma regra de acesso da nota).
- Foto muito alta (cupom comprido): é exibida inteira, reduzida para caber na largura da coluna.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de detalhe da nota MUST exibir a imagem enviada sempre que a nota tiver um
  arquivo de imagem, em qualquer estado (na fila, processando, lida, revisão, falha).
- **FR-002**: Em telas largas, a imagem MUST ficar numa coluna à direita do conteúdo da nota; em
  telas estreitas, MUST ficar numa única coluna com o conteúdo, sem rolagem horizontal.
- **FR-003**: A imagem MUST ser exibida inteira, sem corte, ajustada à largura disponível.
- **FR-004**: A imagem MUST ter texto alternativo que identifique a nota (ex.: "Foto da nota
  {nome do arquivo}").
- **FR-005**: Ativar a imagem (clique, toque ou teclado) MUST abri-la em tamanho original numa nova aba.
- **FR-006**: Notas sem arquivo (criadas pelo QR code) MUST NOT exibir coluna nem espaço reservado.
- **FR-007**: Notas em PDF MUST exibir um link "Abrir PDF" no lugar da pré-visualização.
  *Implementação: não se aplica, porque a API só cria nota a partir de imagem (JPEG, PNG, WebP,
  TIFF); um PDF enviado à lista fica só como arquivo da lista. Uma imagem que o navegador não abre
  (TIFF) cai no FR-008, com o link "Abrir foto".*
- **FR-008**: Se a imagem não carregar, a tela MUST mostrar "Não foi possível carregar a foto." no
  lugar dela, sem afetar o restante.
- **FR-009**: Só membros do grupo da nota MUST conseguir ver a imagem; o acesso ao arquivo MUST ser
  temporário, sem link público permanente.

### Key Entities

- **Nota fiscal**: já existente; passa a informar se tem arquivo enviado, o tipo do arquivo (imagem
  ou PDF) e um endereço temporário para vê-lo.
- **Arquivo da nota**: a imagem ou PDF enviado; tipo, tamanho e endereço de acesso temporário.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das notas enviadas como imagem, a foto aparece na tela de detalhe sem ação
  extra.
- **SC-002**: A pessoa consegue comparar um item da leitura com a foto sem sair da tela nem abrir
  outro app.
- **SC-003**: Em tela de celular (360 px de largura), a tela não tem rolagem horizontal com a foto
  exibida.
- **SC-004**: A foto aparece em até 2 segundos após a tela abrir, em conexão comum.
- **SC-005**: Nenhuma nota sem arquivo mostra imagem quebrada ou espaço vazio.

## Assumptions

- "Lado direito" vale para telas largas; no celular a foto fica empilhada logo depois dos dados
  lidos, para não empurrar os totais para baixo de uma foto alta (ver research R4).
- O objetivo da foto é conferir a leitura: em tela larga ela acompanha a rolagem dos itens.
- Ampliar a foto abre o arquivo em nova aba; visualizador com zoom dentro da tela fica fora do
  escopo.
- Dependência: hoje a resposta da nota (`GET /invoices/{id}`) não informa o arquivo enviado, embora
  o servidor guarde o caminho. A API precisa passar a devolver tipo e endereço temporário assinado do
  arquivo, como já faz no comprovante da lista de compras (`file.url`). Sem isso, a feature não
  pode ser entregue só no app web.
- O comprovante da lista de compras já tem foto própria e não muda nesta feature.
