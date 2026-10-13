# Implementation Plan: Ler o QR code da imagem enviada antes de cair no OCR

**Branch**: `feature/007-qr-from-image` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-qr-from-image/spec.md` (issue #48)

## Summary

A imagem da nota escolhida no formulário passa primeiro por um leitor de QR no navegador. QR de
NFC-e → envio pelo mesmo caminho da câmera (`submitQr`, só `qrUrl`, sem upload). QR que não é de
nota → aviso e opção de mandar pro OCR. Sem QR (ou teto de 1,5 s estourado) → compressão + upload
multipart como hoje. O decoder de `qr-scanner.tsx` é extraído para `qr-decoder.ts` e passa a ler
um canvas, servindo câmera e imagem.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.3 (App Router)

**Primary Dependencies**: `jsqr` 1.4.0 (já instalada, import dinâmico); `BarcodeDetector` nativo quando existe. Nenhuma dependência nova.

**Storage**: N/A

**Testing**: `node --test` (`pnpm test`, `lib/*.test.mjs`); Playwright (`pnpm test:e2e`, `e2e/*.spec.ts`)

**Target Platform**: Navegadores móveis e desktop (Chrome/Android com BarcodeDetector; Safari/iOS com jsQR)

**Project Type**: Web app Next.js (frontend da API `api-kottagroups`)

**Performance Goals**: Busca do QR ≤ 1,5 s no pior caso; caso comum (QR nítido) resolve na 1ª tentativa

**Constraints**: `jsqr` fora do bundle inicial; UI responsiva durante a busca (cede o main thread entre tentativas); nenhuma mudança na API

**Scale/Scope**: 1 módulo novo, 3 componentes alterados, 1 função pura em `lib/receipt.ts`, 1 spec E2E + 3 fixtures

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Situação |
|-----------|----------|
| I. Simplicity First | ✅ Reusa `submitQr`, `compressPhoto`, `fitWithin`, `MAX_PHOTO_SIDE_PX`, `accessKeyFromQrUrl`, `jsqr`. Sem dependência nova, sem worker, sem interface de uma implementação. O decoder sai de `qr-scanner.tsx` porque agora tem 2 usos reais. |
| II. Clean Code | ✅ Constantes nomeadas (`QR_SEARCH_DEADLINE_MS`, escalas, rotações); nomes em inglês; funções < 40 linhas; erros de decode viram `null` explícito (caminho seguro = OCR, nada se perde). |
| III/IV. Best Practices | ✅ Componentes client só onde já eram; tokens de design existentes; status com `role="status"`; botão com rótulo visível; copy da UI em pt-BR como o resto do app. |
| V. Testable by Default | ✅ `receiptUploadPath` coberta em `lib/receipt.test.mjs`; E2E com 3 fixtures. |
| Workflow | ✅ `pnpm lint`, `pnpm test`, `pnpm build` no fim. |

Sem violações → Complexity Tracking vazio.

**Re-check pós-design**: mantido ✅. O design (contratos em `contracts/`) não adiciona camadas além
do módulo `qr-decoder.ts` e da função pura.

## Project Structure

### Documentation (this feature)

```text
specs/007-qr-from-image/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── qr-decoder.md
│   └── receipt-upload-form.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
components/receipt/
├── qr-decoder.ts            # NOVO: createQrDecoder + decodeQrFromFile
├── qr-scanner.tsx           # usa createQrDecoder; câmera inalterada
└── receipt-capture.tsx      # passa submitQr como onQrDetected
components/forms/
└── shopping-forms.tsx       # ReceiptUploadForm: busca QR, 3 caminhos, nova copy
lib/
├── receipt.ts               # + receiptUploadPath, QR_SEARCH_DEADLINE_MS
└── receipt.test.mjs         # + casos qr / not-nfce / ocr
e2e/
└── receipt-image.spec.ts    # NOVO: 3 fixtures
tests/fixtures/receipts/
├── qr-nitido.jpg
├── qr-pequeno-rotacionado.jpg
└── sem-qr.jpg
```

**Structure Decision**: Mantém a estrutura atual do app (`components/receipt`, `lib`, `e2e`). As
fixtures ficam em `tests/fixtures/receipts/`, caminho definido na issue.

## Complexity Tracking

Nenhuma violação a justificar.
