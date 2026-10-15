# Feature Specification: Mostrar valor dos itens e desconto na nota

**Feature Branch**: `feature/013-invoice-discount-summary`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "http://localhost:3002/grupos/01M4XR232WCQ9HCM087DKD4DA2/notas/01M4XREAWVHESAGCY3RCN5WFFZ precisa mostrar valor itens e desconto"

## Contexto

A nota do exemplo tem dois itens: 6 × COPO PAPEL 110ML PRETO a R$ 14,90 (R$ 89,40) e 1 × MEXEDOR
PDRINK CRISTAL a R$ 14,75. Os itens somam R$ 104,15, e o total pago foi R$ 100,00. A leitura achou o
desconto de R$ 4,15 impresso no cupom, mas a tela mostra só:

- "Total da nota": R$ 100,00
- "Soma dos itens": R$ 100,00, que já é o valor depois do desconto

Quem confere vê na tabela itens que somam R$ 104,15, enquanto o resumo diz "Soma dos itens R$ 100,00".
O desconto não aparece em lugar nenhum, e os números parecem não bater.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entender de onde vem o total (Priority: P1)

Ao abrir uma nota lida, a pessoa vê no resumo o valor dos itens (a soma das linhas, antes do
desconto), o desconto e o total pago, na ordem da conta: valor dos itens − desconto = total.

**Why this priority**: É o pedido. Sem isso, o resumo contradiz a tabela de itens e a pessoa
desconfia da leitura.

**Independent Test**: Abrir a nota do exemplo e ver "Valor dos itens R$ 104,15", "Desconto
−R$ 4,15" e "Total da nota R$ 100,00".

**Acceptance Scenarios**:

1. **Given** uma nota lida cujos itens somam mais que o total por causa de um desconto, **When** a
   tela é aberta, **Then** o resumo mostra o valor dos itens (soma das linhas), o desconto como valor
   negativo e o total da nota.
2. **Given** a nota do exemplo, **When** a tela é aberta, **Then** aparecem R$ 104,15, −R$ 4,15 e
   R$ 100,00, e a soma das linhas da tabela é igual ao valor dos itens.
3. **Given** uma nota lida sem desconto, **When** a tela é aberta, **Then** o resumo mostra o valor
   dos itens e o total, sem linha de desconto.

---

### User Story 2 - Perceber quando os números não fecham (Priority: P2)

Quando valor dos itens − desconto não dá o total da nota (leitura parcial ou errada), a tela aponta
a diferença, para a pessoa conferir com a foto.

**Why this priority**: Conferir a leitura é o motivo de mostrar os valores; uma diferença
escondida leva a dividir errado.

**Independent Test**: Abrir uma nota cujos itens somam menos que o total, sem desconto, e ver o
aviso com a diferença.

**Acceptance Scenarios**:

1. **Given** uma nota em que valor dos itens − desconto difere do total em mais de R$ 0,05,
   **When** a tela é aberta, **Then** aparece "Os itens não fecham com o total: diferença de R$ X.
   Confira com a foto."
2. **Given** uma diferença de até R$ 0,05 (arredondamento), **When** a tela é aberta, **Then** não
   aparece aviso.

---

### Edge Cases

- Nota sem itens separados: o resumo mostra só o total da nota; valor dos itens e desconto não
  aparecem, e a mensagem "Não conseguimos separar os itens desta nota." continua.
- Total da nota não identificado (zero): mostra "Não identificado" no total e não calcula diferença.
- Desconto maior ou igual ao valor dos itens (leitura errada): não é exibido como desconto; a
  diferença aparece pelo aviso da história 2.
- Acréscimo (total maior que os itens, como taxa de serviço ou frete): não é desconto; cai no aviso
  de diferença.
- Nota na fila, processando ou com falha: o resumo não aparece (como hoje).
- Itens com desconto por linha já embutido no valor da linha: o valor dos itens usa o valor da
  linha como lido.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O resumo de uma nota lida MUST mostrar "Valor dos itens", igual à soma dos valores
  totais das linhas exibidas na tabela de itens.
- **FR-002**: Quando a leitura identificou um desconto, o resumo MUST mostrar "Desconto" como valor
  negativo, entre o valor dos itens e o total.
- **FR-003**: O resumo MUST mostrar "Total da nota", o valor pago impresso no cupom, como hoje.
- **FR-004**: Sem desconto, a linha "Desconto" MUST NOT aparecer.
- **FR-005**: O rótulo "Soma dos itens" com o valor já descontado MUST deixar de existir, para não
  contradizer a tabela.
- **FR-006**: Quando |valor dos itens − desconto − total| > R$ 0,05, a tela MUST mostrar a
  diferença em reais e pedir para conferir com a foto.
- **FR-007**: Sem itens separados, o resumo MUST mostrar só a data e o total da nota.
- **FR-008**: Os valores MUST usar o formato de moeda já usado no app (R$, vírgula decimal).

### Key Entities

- **Leitura da nota**: itens (descrição, quantidade, valor unitário, valor da linha), total pago e
  desconto identificado no cupom.
- **Resumo da nota**: valor dos itens, desconto e total, mais a diferença quando a conta não fecha.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das notas lidas com itens, o "Valor dos itens" do resumo é igual à soma da
  coluna Total da tabela.
- **SC-002**: Na nota do exemplo, a pessoa vê R$ 104,15 − R$ 4,15 = R$ 100,00 sem fazer conta.
- **SC-003**: Nenhuma nota exibe "Valor dos itens" e "Total" diferentes sem mostrar o desconto ou
  o aviso de diferença.
- **SC-004**: O aviso de diferença não aparece em notas cuja conta fecha com até R$ 0,05.

## Assumptions

- O desconto é o do cupom inteiro (linha "Desconto"/"Descontos"), que a leitura já identifica.
  Hoje esse valor não é guardado separadamente: o servidor guarda só a soma dos itens já
  descontada. Decisão do plano (research R1): o desconto é derivado no web, conforme a origem da
  leitura (OCR: soma das linhas − soma descontada; leitura fiscal pelo QR/chave: soma das linhas −
  total), sem mudança na API.
- Desconto por item, quando impresso numa linha própria, fica fora do escopo. Vale o que a leitura
  já entrega por linha.
- A tolerância de R$ 0,05 é a mesma que a leitura usa para conferir valores.
- A tela é a de detalhe da nota do grupo, incluindo a coluna de foto da feature 012. Comprovante da
  lista de compras fica fora do escopo.
