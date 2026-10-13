# Research: Ler o QR code da imagem enviada antes de cair no OCR

Nenhum `NEEDS CLARIFICATION` ficou aberto no Technical Context. As decisões abaixo fecham os
pontos de implementação que a issue #48 deixou em aberto.

## R1. Formato do decoder compartilhado

- **Decision**: `components/receipt/qr-decoder.ts` exporta `createQrDecoder(): Promise<(canvas: HTMLCanvasElement) => Promise<string | null>>`.
  Quem chama desenha a fonte (quadro do vídeo, bitmap, rotação, recorte) no canvas; o decoder só lê
  o canvas. `BarcodeDetector` nativo quando suporta `qr_code`; senão `import("jsqr")` sob demanda.
  O decoder é criado uma vez por módulo (promise memorizada) e reaproveitado entre câmera e imagem.
- **Rationale**: Canvas é a única fonte que serve aos dois leitores (BarcodeDetector aceita canvas;
  jsQR precisa de `ImageData`). Rotação e recorte já exigem desenhar num canvas, então a câmera faz
  o mesmo e o decoder fica sem ramo por tipo de fonte. Atende "aceitar vídeo **ou** ImageBitmap"
  (issue, item 1) sem abstração extra.
- **Alternatives considered**: assinatura `(source: CanvasImageSource, w, h)` — duplicaria o
  desenho/rotação dentro do decoder e exigiria tratar dimensões por tipo de fonte; descartada.

## R2. Estratégia de busca na imagem e teto de tempo

- **Decision**: `decodeQrFromFile(file, { deadlineMs = 1500 })`:
  1. `createImageBitmap(file)`; falha → `null`.
  2. Tentativas em ordem: inteira reduzida (lado maior 1600 px, `MAX_PHOTO_SIDE_PX`) → escalas
     1.0/0.75/0.5 × rotações 0/90/180/270 → terço inferior ampliado (lado maior 1600 px).
  3. Antes de cada tentativa confere o relógio (`performance.now()`); passou do teto → `null`.
  4. Entre tentativas cede o main thread (`await new Promise(r => setTimeout(r))`).
  5. Primeiro texto encontrado encerra a busca; `bitmap.close()` no `finally`.
- **Rationale**: É a ordem da issue (o caso comum resolve na 1ª tentativa). O teto é checado entre
  tentativas porque uma leitura jsQR em 1600 px leva dezenas de ms; o pior caso estoura o teto por
  no máximo uma tentativa. Ceder entre tentativas mantém a UI responsiva sem worker.
- **Alternatives considered**: Web Worker com `OffscreenCanvas` — mais arquivos e setup de bundle
  para ganho que o teto de 1,5 s já limita; fica para quando medição mostrar travamento.
  `Promise.race` com timeout — não interrompe o jsQR síncrono, então não economiza CPU.

## R3. Seleção do caminho (função pura testável)

- **Decision**: `receiptUploadPath(qrText: string | null): "qr" | "not-nfce" | "ocr"` em
  `lib/receipt.ts`, usando `accessKeyFromQrUrl`. Coberta em `lib/receipt.test.mjs`.
- **Rationale**: A constituição (V) exige teste em `lib/*.test.mjs`; a decisão de caminho é a única
  lógica de ramo que roda fora do navegador.
- **Alternatives considered**: testar só no E2E — mais lento e não isola a regra.

## R4. Integração com o formulário

- **Decision**: `ReceiptUploadForm` ganha a prop `onQrDetected(qrUrl)`; `ReceiptCapture` passa o
  seu `submitQr` (o mesmo usado pela câmera). Estados do form: `idle → searching →
  (qr | not-nfce | no-qr)`. Em `no-qr` o form faz `requestSubmit()` sozinho (compressão + multipart
  como hoje); em `not-nfce` espera o clique em "Enviar pro OCR mesmo assim" (que submete o form).
  Troca de arquivo invalida a busca anterior via contador em `useRef`.
- **Rationale**: Mantém o form onde está (diff menor que movê-lo). Envio automático em `no-qr` deixa
  os três desfechos simétricos: ninguém precisa clicar depois de escolher a imagem, exceto quando o
  QR é suspeito.
- **Alternatives considered**: manter clique obrigatório em "Enviar" no caminho sem QR — o caminho
  com QR já envia sozinho, então o usuário ficaria esperando sem saber que precisa clicar.

## R5. Testes ponta a ponta e fixtures

- **Decision**: `e2e/receipt-image.spec.ts` com `tests/fixtures/receipts/{qr-nitido,
  qr-pequeno-rotacionado,sem-qr}.jpg`. O teste observa as requisições de server action
  (`Next-Action` header) e confere o corpo: caminho QR envia `qrUrl` e nenhum `file`; caminho sem QR
  envia `file`. Também confere os textos de status.
  Fixtures geradas uma única vez, fora do projeto (gerador de QR via `npx`, sem virar dependência;
  rotação/redução com ImageMagick), com uma URL NFC-e de chave válida (a mesma do teste unitário).
- **Rationale**: O E2E roda contra a API real (`API_ORIGIN`); o processamento da nota pela SEFAZ
  pode não acontecer no ambiente de teste, então o critério verificável é o payload enviado e o
  status "QR code encontrado, enviando…". "via QR code" é conferido quando a API local processa a
  nota; o rótulo vem de `extractionMethodLabel`, que já existe.
- **Alternatives considered**: `page.route` para mockar a API — server actions chamam a API pelo
  servidor Next, fora do alcance do `page.route`.
