# Data Model: Ler o QR code da imagem enviada

Não há dados persistidos novos. O único modelo é o estado do formulário de imagem no navegador.

## ReceiptUploadPath (lib/receipt.ts)

Desfecho da busca, derivado do texto do QR (`string | null`) por `receiptUploadPath`:

| Valor | Regra | Ação |
|-------|-------|------|
| `"qr"` | `accessKeyFromQrUrl(text) !== null` | `onQrDetected(text)` — envia só `qrUrl` |
| `"not-nfce"` | texto existe, mas sem chave válida | aviso + botão "Enviar pro OCR mesmo assim" |
| `"ocr"` | `text === null` (sem QR, imagem ilegível ou teto estourado) | aviso + upload multipart atual |

## Estado do formulário (ReceiptUploadForm)

```text
idle ──(arquivo escolhido)──▶ searching
searching ──"qr"──────▶ qr-found      (status "QR code encontrado, enviando…"; chama onQrDetected)
searching ──"not-nfce"─▶ not-nfce     (aviso; espera clique → submit OCR)
searching ──"ocr"─────▶ no-qr         (aviso; requestSubmit → compressPhoto + upload)
qualquer ──(novo arquivo)──▶ searching (resultado anterior descartado: contador em useRef)
```

Validação mantida: arquivo que não é `image/*` mostra "Envie uma foto da nota." e não dispara busca.
