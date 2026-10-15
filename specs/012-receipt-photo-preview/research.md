# Research: Mostrar a foto enviada na tela da nota

## R1. Como o navegador obtém a foto

- **Decision**: a API devolve `file.url` assinada (HMAC, TTL de 15 min), no mesmo formato de
  `ApiReceiptFile` do comprovante da lista. O `<img>` carrega essa URL direto.
- **Rationale**: o navegador não envia o token Bearer, porque o web chama a API do lado do
  servidor. O padrão já existe para comprovantes (`SignedReceiptURL` e `receiptSignedFile`) e
  avatares. O controle de acesso continua num lugar só: a URL só é emitida depois de
  `InvoiceService.readable`.
- **Alternatives considered**:
  - Route handler no Next que busca o arquivo com o token da sessão e repassa os bytes. Precisaria
    de um endpoint autenticado de download na API do mesmo jeito, e todo byte da imagem passaria pelo
    servidor Next. Rejeitado.
  - Data URL/base64 embutido no HTML. Pesa até 10 MiB por página e não tem cache. Rejeitado.

## R2. Onde está o arquivo de uma nota de grupo

- **Decision**: em `InvoiceService.uploadDir/{invoiceID}{ext}` (`StoredPath`, `MimeType`). Há
  `file` quando `StoredPath` aponta para um arquivo local. Notas criadas pelo QR code guardam a URL
  do QR em `StoredPath` e devolvem `file: null`.
- **Rationale**: confirmado em `internal/service/invoice.go:150-185` e
  `internal/service/receipt_invoice.go:103`.
- **Alternatives considered**: mover as notas para o object storage, como os comprovantes. Fica
  fora do escopo, porque a assinatura funciona igual para arquivo local.

## R3. Notas de lista de compras (`shoppingListId`)

- **Decision**: usam a mesma regra. Se `StoredPath` é uma foto, `file` vem preenchido.
- **Rationale**: a tela de detalhe é a mesma, e a pessoa confere qualquer nota do mesmo jeito.

## R4. Layout "do lado direito" para conferir

- **Decision**: quando há `file`, a página usa `width="view"` (até 1120 px) com grid
  `lg:grid-cols-[minmax(0,1fr)_22rem]`. A coluna da foto é `lg:sticky lg:top-6`, e a imagem usa
  `object-contain` com altura máxima de `100vh − 3rem`, para continuar visível enquanto a lista de
  itens rola. Abaixo de `lg`, uma coluna só, com a foto **depois** dos dados lidos (ordem do DOM).
  Sem `file`, a página continua `width="reading"`, como hoje.
- **Rationale**: o objetivo é comparar linha a linha, então a foto precisa ficar ao lado da tabela
  e acompanhar a rolagem. No celular, a ordem do DOM (dados, depois foto) mantém a leitura do leitor
  de tela coerente e evita empurrar os totais para baixo de uma foto alta.
- **Spec impact**: a Assumption "acima dos totais" passa a ser "depois dos dados lidos". Atualizado
  na spec.
- **Alternatives considered**: miniatura pequena com lightbox. É mais código, e a miniatura não
  serve para conferir. Rejeitado.

## R5. Falha ao carregar (FR-008)

- **Decision**: componente cliente `InvoicePhoto` com estado `failed` em `onError`, que troca a
  imagem pelo texto "Não foi possível carregar a foto." e mantém o link "Abrir foto".
- **Rationale**: `onError` exige cliente. O componente é pequeno, e a página continua Server Component.
- **Alternatives considered**: `<object>` com fallback nativo. O comportamento varia entre
  navegadores e ele captura o clique do link. Rejeitado.

## R6. `next/image` vs `<img>`

- **Decision**: `<img>` nativo, com o mesmo comentário e eslint-disable de `ReceiptPreview`.
- **Rationale**: a URL é assinada, temporária e de host variável. O otimizador do Next não ajuda e
  ainda exigiria `remotePatterns`.

## R7. Expiração da URL

- **Decision**: TTL de 15 min, o padrão da API. Notas pendentes já se atualizam via `AutoRefresh`
  e recebem URL nova. Numa nota lida aberta por mais de 15 min, a imagem já está carregada.
  Recarregar a página resolve o link "Abrir foto" vencido.
