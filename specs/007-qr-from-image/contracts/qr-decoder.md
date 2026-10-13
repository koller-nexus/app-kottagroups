# Contract: `components/receipt/qr-decoder.ts`

Módulo client-only. Nenhum import estático de `jsqr`.

## `createQrDecoder(): Promise<(canvas: HTMLCanvasElement) => Promise<string | null>>`

- Usa `BarcodeDetector` quando `getSupportedFormats()` inclui `"qr_code"`; senão `import("jsqr")`.
- Memoriza a promise no módulo: a segunda chamada não recria o detector nem baixa `jsqr` de novo.
- O decoder lê o canvas como está (quem chama desenha a fonte). Devolve o texto do primeiro QR ou `null`.
- Erro de leitura → `null` (nunca lança).

## `decodeQrFromFile(file: File): Promise<string | null>`

- Pré-condição: `file` é imagem (`image/*`). Imagem que o navegador não abre → `null`.
- Tentativas, em ordem, parando no primeiro texto:
  1. imagem inteira com lado maior ≤ `MAX_PHOTO_SIDE_PX` (1600);
  2. escalas `[1, 0.75, 0.5]` × rotações `[0, 90, 180, 270]` sobre a imagem reduzida;
  3. terço inferior da imagem, lado maior ≤ 1600.
- Teto: `QR_SEARCH_DEADLINE_MS` (1500), conferido antes de cada tentativa; estourou → `null`.
- Cede o main thread entre tentativas.
- Libera o bitmap (`close()`) em qualquer saída.
- Devolve o texto cru do QR; a decisão NFC-e ou não é de `receiptUploadPath` (`lib/receipt.ts`).

## Uso pela câmera (`qr-scanner.tsx`)

O laço de `scan` desenha o quadro do vídeo no canvas oculto (lado maior 640 px, como hoje) e chama
o decoder com esse canvas. Intervalo, validação NFC-e, aviso de QR inválido e ciclo de vida da
câmera não mudam.
