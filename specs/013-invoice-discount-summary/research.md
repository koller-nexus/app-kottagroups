# Research: Mostrar valor dos itens e desconto na nota

## R1. De onde vem o desconto

- **Decision**: derivar no web, de acordo com a origem da leitura (`resolutionPath`):
  - **Leitura por OCR** (`ocr`, `ocr_escalated` ou vazio): `desconto = soma das linhas − itemsTotal`.
    No OCR, a API grava `ComputedItemsTotal = soma das linhas − desconto impresso`
    (`extract.NetOfDiscount`, em `internal/extract/extract.go` e `internal/openrouter/client.go`).
    Então a diferença entre a soma das linhas e `itemsTotal` é exatamente o desconto que a leitura
    achou no cupom.
  - **Leitura fiscal** (`submitted_qr`, `submitted_key`, `photo_qr`, `photo_key`):
    `desconto = soma das linhas − total`. O registro da SEFAZ é a fonte de verdade
    (`ItemsConfirmed = true`), mas a API grava `itemsTotal = soma das linhas` sem desconto
    (`applyRecord` em `internal/service/invoice_nfce.go`). Se o total é menor que os itens, a
    diferença é desconto fiscal.
  - Em ambos os casos, desconto só conta se for maior que a tolerância e menor que a soma das linhas.
- **Rationale**: funciona para notas já gravadas, como a do exemplo (OCR: itens R$ 104,15,
  `itemsTotal` R$ 100,00, desconto R$ 4,15), sem migração. Não exige mudança na API.
- **Alternatives considered**:
  - Coluna `discount_cents` na API. Exigiria migração e backfill com soma de JSON em SQL, e notas
    antigas ficariam sem desconto até o backfill. Rejeitada por enquanto. Se outro cliente (app
    mobile) precisar do mesmo número, vale mover a regra para a API.
  - Uma regra única `soma das linhas − total` para tudo. No OCR, isso transformaria qualquer erro
    de leitura em "desconto" e esconderia o aviso da história 2. Rejeitada.

## R2. Diferença e tolerância

- **Decision**: `diferença = valor dos itens − desconto − total`. O aviso aparece quando
  `|diferença| > 5 centavos` e o total foi identificado (> 0).
- **Rationale**: R$ 0,05 é o `extract.LineDelta` da API, que a leitura usa para conferir somas.

## R3. Rótulos e ordem

- **Decision**: o resumo fica em quatro posições na grade atual (1 coluna no celular, 2 a partir de
  `sm`, 4 a partir de `lg` quando houver desconto), nesta ordem: "Emitida em", "Valor dos itens",
  "Desconto" (como −R$, só quando > 0) e "Total da nota". O rótulo "Soma dos itens" sai.
- **Rationale**: a ordem segue a conta do cupom e termina no valor pago, que é o que importa para
  dividir. O sinal de menos deixa claro que é abatimento.

## R4. Reaproveitamento

- `invoiceDifferenceCents` já existe em `lib/invoices.ts`; o plano verifica na implementação se
  serve para a diferença ou se tem outra semântica (diferença nota × despesa). Se tiver outra
  semântica, não é reaproveitado.
