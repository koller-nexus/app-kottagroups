# Contract: arquivo da nota

## 1. `GET /api/v1/invoices/{id}` (alterado)

Autenticação e autorização não mudam (membro do grupo da nota). A resposta ganha `file`:

```json
{
  "id": "01M4XN833FCNV0ERXGB9K4WY73",
  "status": "done",
  "originalName": "IMG_0660.jpeg",
  "file": {
    "contentType": "image/jpeg",
    "sizeBytes": 812345,
    "url": "https://api.kottagroups.com.br/api/v1/invoices/files/01M4XN833FCNV0ERXGB9K4WY73.jpg?exp=1760450000&sig=ab12…"
  }
}
```

- `file: null` quando `StoredPath` não é um arquivo local (nota criada pelo QR code).
- `file.url` ausente quando a assinatura falha (sem chave HMAC configurada). O erro vai para o log
  como `invoice_read_url_failed`.
- O campo aparece também nas respostas de `PUT/DELETE /invoices/{id}/expense`, que reutilizam o
  mesmo `InvoiceView`. Na listagem (`GET /groups/{id}/invoices`) ele pode vir `null` para não
  assinar URLs em lote. O web não depende dele ali.

## 2. `GET /api/v1/invoices/files/{file}?exp=&sig=` (novo)

- Sem Bearer. Válida só com a assinatura HMAC (`SignReadQuery(secret, invoiceID, file, exp)`, a
  mesma chave dos comprovantes). `{file}` = `{invoiceID}{ext}`. O `invoiceID` vem do nome do arquivo
  e é conferido contra o ULID.
- O servidor resolve o caminho como `uploadDir/{file}` e rejeita `..`, `/` e nomes que não sejam
  `ULID + ext permitida`.
- Respostas:
  - `200`: bytes do arquivo, `Content-Type` do `MimeType`, `Cache-Control: private, max-age=60`,
    `X-Content-Type-Options: nosniff`.
  - `401`: assinatura inválida ou expirada.
  - `404`: arquivo não existe (nota excluída).

## 3. Web: `ApiInvoice`

```ts
export interface ApiInvoice {
  // ...campos atuais
  /** null quando a nota veio pelo QR code; url assinada e temporária. */
  file?: ApiReceiptFile | null;
}
```

`file` é opcional para o web continuar funcionando com a API antiga: sem campo, não há coluna.
