---

description: "Task list for feature 007-qr-from-image"
---

# Tasks: Ler o QR code da imagem enviada antes de cair no OCR

**Input**: Design documents from `/specs/007-qr-from-image/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Pedidos pela issue #48 — unit em `lib/receipt.test.mjs` (seleção de caminho) e E2E Playwright com 3 fixtures.

**Organization**: Tarefas agrupadas por user story (spec.md: US1 QR na imagem, US2 sem QR → OCR, US3 QR não-NFC-e, US4 câmera sem regressão).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: user story da tarefa (US1…US4)

---

## Phase 1: Setup

**Purpose**: Fixtures de imagem usadas pelos testes E2E

- [X] T001 Gerar as 3 fixtures em `tests/fixtures/receipts/` fora do projeto (QR via `npx` sem adicionar dependência; ImageMagick para reduzir/girar), todas JPEG: `qr-nitido.jpg` (cupom com QR NFC-e grande e reto, URL `https://www.nfce.fazenda.sp.gov.br/qrcode?p=<NFCE_KEY>|2|1|1|ABCDEF0123` com a mesma `NFCE_KEY` válida de `lib/receipt.test.mjs`), `qr-pequeno-rotacionado.jpg` (mesmo QR pequeno no rodapé de um cupom longo, imagem girada 90°), `sem-qr.jpg` (cupom sem QR); conferir que `jsqr` decodifica as duas primeiras e não a terceira (+ `qr-nao-nfce.jpg` para US3; o QR pequeno só decodifica acima de 1600 px, exercitando as tentativas extras)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Função pura de caminho e decoder compartilhado — base de todas as stories

**⚠️ CRITICAL**: Nenhuma story começa antes desta fase

- [X] T002 [P] Adicionar testes de `receiptUploadPath` em `lib/receipt.test.mjs`: URL NFC-e válida → `"qr"`; `"https://exemplo.com/?q=1"` e `"PIX 00020126"` → `"not-nfce"`; `null` → `"ocr"` (devem falhar antes de T003)
- [X] T003 Implementar em `lib/receipt.ts`: `export type ReceiptUploadPath = "qr" | "not-nfce" | "ocr"`, `export function receiptUploadPath(qrText: string | null): ReceiptUploadPath` (regra: `null` → `"ocr"`; `accessKeyFromQrUrl(qrText) !== null` → `"qr"`; senão `"not-nfce"`) e `export const QR_SEARCH_DEADLINE_MS = 1500`; `pnpm test` verde
- [X] T004 [P] Criar `components/receipt/qr-decoder.ts` com `createQrDecoder(): Promise<(canvas: HTMLCanvasElement) => Promise<string | null>>` movendo a lógica de `createDecoder` de `components/receipt/qr-scanner.tsx` (interfaces `BarcodeDetectorLike`/`BarcodeDetectorClass`, `BarcodeDetector` quando `getSupportedFormats()` inclui `"qr_code"`, senão `import("jsqr")` dinâmico lendo `getImageData` do canvas); promise memorizada no módulo; erro de leitura → `null` (contrato: `contracts/qr-decoder.md`)

**Checkpoint**: `pnpm test` verde; decoder pronto para câmera e imagem

---

## Phase 3: User Story 1 - Imagem com QR da nota vira leitura por QR (Priority: P1) 🎯 MVP

**Goal**: Imagem com QR de NFC-e é enviada só como `qrUrl` pelo caminho da câmera, sem upload.

**Independent Test**: Selecionar `qr-nitido.jpg` e `qr-pequeno-rotacionado.jpg`; a requisição da server action contém `qrUrl` e nenhum `file`; status "QR code encontrado, enviando…".

### Tests for User Story 1

- [X] T005 [P] [US1] Criar `e2e/receipt-image.spec.ts` seguindo o padrão de `e2e/shopping-list.spec.ts` (criar lista via UI, usar `run-id.ts`): para `qr-nitido.jpg` e `qr-pequeno-rotacionado.jpg`, `setInputFiles` no input "Enviar imagem da nota", capturar requisições POST com header `next-action` e afirmar que o corpo contém `qrUrl` e não contém `filename=`; afirmar status "Procurando QR code…"/"QR code encontrado, enviando…"; se a API local processar a nota, afirmar "via QR code"

### Implementation for User Story 1

- [X] T006 [US1] Adicionar `decodeQrFromFile(file: File): Promise<string | null>` em `components/receipt/qr-decoder.ts`: `createImageBitmap(file)` (falha → `null`); tentativas em ordem — inteira com lado maior ≤ `MAX_PHOTO_SIDE_PX` via `fitWithin`, depois escalas `[1, 0.75, 0.5]` × rotações `[0, 90, 180, 270]`, depois terço inferior ampliado até 1600 px; conferir `performance.now()` contra `QR_SEARCH_DEADLINE_MS` antes de cada tentativa (estourou → `null`); `await new Promise((r) => setTimeout(r))` entre tentativas; `bitmap.close()` no `finally`; constantes nomeadas (`QR_SEARCH_SCALES`, `QR_SEARCH_ROTATIONS`)
- [X] T007 [US1] Em `components/forms/shopping-forms.tsx`, `ReceiptUploadForm` recebe `onQrDetected: (qrUrl: string) => void`; no `onChange` do input (arquivo `image/*`), rodar `decodeQrFromFile` com contador em `useRef` para descartar resultado de arquivo anterior; estado `searching` mostra "Procurando QR code…" em `role="status"` e desabilita o botão; `receiptUploadPath(text) === "qr"` → status "QR code encontrado, enviando…" e `onQrDetected(text)` (sem upload)
- [X] T008 [US1] Copy em `components/forms/shopping-forms.tsx`: label "Enviar imagem da nota", dica "Serve foto ou print. Se tiver QR code, lemos direto.", botão "Enviar imagem"/"Enviando imagem…"; atualizar comentário JSDoc do form
- [X] T009 [US1] Em `components/receipt/receipt-capture.tsx`, passar `onQrDetected={submitQr}` para `<ReceiptUploadForm>`

**Checkpoint**: US1 funciona sozinha; T005 verde

---

## Phase 4: User Story 2 - Imagem sem QR continua indo para o OCR (Priority: P1)

**Goal**: Sem QR (ou teto estourado) → aviso e upload multipart como hoje.

**Independent Test**: Selecionar `sem-qr.jpg`; aviso aparece e a requisição da action contém o arquivo.

### Tests for User Story 2

- [X] T010 [P] [US2] Em `e2e/receipt-image.spec.ts`, caso `sem-qr.jpg`: afirmar aviso "Não achei o QR code, vou ler a nota pela imagem." e requisição `next-action` com `filename=` no corpo

### Implementation for User Story 2

- [X] T011 [US2] Em `components/forms/shopping-forms.tsx`, caminho `"ocr"`: mostrar "Não achei o QR code, vou ler a nota pela imagem." e chamar `formRef.current?.requestSubmit()` (a action existente já faz `compressPhoto` + `uploadReceiptAction`); manter a validação "Envie uma foto da nota." para arquivo que não é `image/*` sem disparar busca

**Checkpoint**: US1 e US2 verdes

---

## Phase 5: User Story 3 - QR que não é de nota fiscal (Priority: P2)

**Goal**: QR não-NFC-e → aviso e botão para mandar pro OCR; nada enviado antes do clique.

**Independent Test**: Imagem com QR não-NFC-e mostra aviso e botão; clique envia o arquivo.

### Implementation for User Story 3

- [X] T012 [US3] Em `components/forms/shopping-forms.tsx`, caminho `"not-nfce"`: mostrar "Esse QR não parece de nota fiscal." e botão `type="submit"` "Enviar pro OCR mesmo assim" (submete o form → upload atual); nenhum envio antes do clique

**Checkpoint**: Os três desfechos de `data-model.md` cobertos

---

## Phase 6: User Story 4 - Leitura pela câmera continua igual (Priority: P1)

**Goal**: `QrScanner` usa o decoder extraído sem mudança visível.

**Independent Test**: Abrir a câmera e escanear um QR NFC-e; envia como antes.

### Implementation for User Story 4

- [X] T013 [US4] Em `components/receipt/qr-scanner.tsx`, remover `createDecoder`, tipos `Decode`/`BarcodeDetector*` e o import de `jsqr`; no `scan`, desenhar o quadro do vídeo no canvas oculto com `fitWithin(video.videoWidth, video.videoHeight, DECODE_SIDE_PX)` (pular quando `!video.videoWidth`) e chamar o decoder de `createQrDecoder()`; intervalo, validação NFC-e, `INVALID_QR` e ciclo de vida da câmera inalterados

**Checkpoint**: Todas as stories funcionando

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T014 Rodar `pnpm lint`, `pnpm test` e `pnpm build`; conferir no build que `jsqr` segue em chunk separado (não entra no bundle inicial da página da lista)
- [ ] T015 Rodar `API_ORIGIN=… pnpm test:e2e e2e/receipt-image.spec.ts` e o roteiro manual de `specs/007-qr-from-image/quickstart.md` (incluindo câmera e QR não-NFC-e)

---

## Dependencies & Execution Order

- **Setup (T001)**: sem dependências; bloqueia só os E2E (T005, T010)
- **Foundational (T002–T004)**: T003 depois de T002; T004 independente; bloqueiam todas as stories
- **US1 (T005–T009)**: depende de T003, T004; T006 → T007 → T008/T009
- **US2 (T011)** e **US3 (T012)**: dependem de T007 (mesmo arquivo, sequenciais entre si)
- **US4 (T013)**: depende só de T004; pode rodar em paralelo com US1–US3
- **Polish**: depois de tudo

## Parallel Example

```text
# Depois do Setup:
T002 (lib/receipt.test.mjs)  ‖  T004 (qr-decoder.ts)
# Depois da Foundational:
T005 (e2e US1)  ‖  T006 (decodeQrFromFile)  ‖  T013 (qr-scanner US4)
```

## Implementation Strategy

1. **MVP**: Setup + Foundational + US1 (T001–T009) — imagem com QR já evita o OCR.
2. US2 (T010–T011) — fecha o caminho sem QR com aviso e envio automático.
3. US4 (T013) — remove a duplicação do decoder na câmera.
4. US3 (T012) — trata QR suspeito.
5. Polish (T014–T015) antes do PR.
