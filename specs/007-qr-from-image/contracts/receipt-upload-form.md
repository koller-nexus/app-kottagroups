# Contract: `ReceiptUploadForm` (UI)

## Props

```ts
{ listId: string; onQrDetected: (qrUrl: string) => void }
```

`ReceiptCapture` passa o seu `submitQr` (mesmo caminho da câmera → `submitReceiptCodeAction` com `qrUrl`).

## Copy

| Elemento | Texto |
|----------|-------|
| Label do input | Enviar imagem da nota |
| Dica | Serve foto ou print. Se tiver QR code, lemos direto. |
| Status durante a busca | Procurando QR code… |
| QR de NFC-e | QR code encontrado, enviando… |
| QR que não é NFC-e | Esse QR não parece de nota fiscal. |
| Botão nesse caso | Enviar pro OCR mesmo assim |
| Sem QR | Não achei o QR code, vou ler a nota pela imagem. |

Status em elemento `role="status"`; o botão de envio fica desabilitado durante a busca.

## Requisições observáveis (server actions)

| Caminho | Action chamada | Corpo contém |
|---------|----------------|--------------|
| `qr` | `submitReceiptCodeAction` | `listId`, `qrUrl` — **sem** `file` |
| `not-nfce` + clique | `uploadReceiptAction` | `listId`, `file` |
| `ocr` | `uploadReceiptAction` | `listId`, `file` (comprimido) |

Nenhuma mudança nos endpoints da API (`POST /shopping-lists/:id/receipt` e o de código).
