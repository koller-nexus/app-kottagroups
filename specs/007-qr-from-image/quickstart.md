# Quickstart: validar a leitura de QR na imagem enviada

## Pré-requisitos

- API local rodando (`API_ORIGIN`, ex.: `http://localhost:8085`) com o usuário seed do E2E.
- Fixtures em `tests/fixtures/receipts/` (ver [research.md](./research.md#r5-testes-ponta-a-ponta-e-fixtures)).

## Checagens automáticas

```bash
pnpm lint
pnpm test                              # inclui receiptUploadPath (qr / not-nfce / ocr)
API_ORIGIN=http://localhost:8085 pnpm test:e2e e2e/receipt-image.spec.ts
pnpm build                             # jsqr continua em chunk separado
```

Resultado esperado: tudo verde.

## Roteiro manual (página de uma lista de compras)

| # | Ação | Esperado |
|---|------|----------|
| 1 | Escolher `qr-nitido.jpg` | "Procurando QR code…" → "QR code encontrado, enviando…"; no DevTools, a requisição da action tem `qrUrl` e nenhum arquivo; nota processada mostra "via QR code" |
| 2 | Escolher `qr-pequeno-rotacionado.jpg` | Mesmo desfecho do #1 |
| 3 | Escolher `sem-qr.jpg` | "Não achei o QR code, vou ler a nota pela imagem."; upload multipart como antes |
| 4 | Escolher imagem com QR que não é de nota | Aviso + botão "Enviar pro OCR mesmo assim"; nada enviado até o clique |
| 5 | Escanear pela câmera | Funciona como antes (detecta e envia) |
| 6 | Network → carregamento inicial da página | `jsqr` não aparece até haver busca sem `BarcodeDetector` |

Contratos: [qr-decoder](./contracts/qr-decoder.md), [receipt-upload-form](./contracts/receipt-upload-form.md).
Estados: [data-model.md](./data-model.md).
