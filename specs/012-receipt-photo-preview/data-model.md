# Data Model: Mostrar a foto enviada na tela da nota

Nenhuma tabela nova e nenhuma migração. Só a resposta da nota muda.

## Invoice (resposta de `GET /api/v1/invoices/{id}`)

Campo novo:

| Campo | Tipo | Regra |
|-------|------|-------|
| `file` | `InvoiceFile \| null` | `null` quando a nota não tem arquivo local (criada pelo QR code) |

## InvoiceFile (mesmo formato de `ApiReceiptFile`)

| Campo | Tipo | Regra |
|-------|------|-------|
| `contentType` | string | `MimeType` da nota: `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |
| `sizeBytes` | number | tamanho do arquivo em disco |
| `url` | string, opcional | URL assinada, válida por 15 min; ausente se a assinatura falhar (a API registra em log e devolve `file` sem `url`) |

## Derivado no web: `invoiceFileKind(file)`

| Entrada | Saída |
|---------|-------|
| `null` / `undefined` | `null`: sem coluna |
| `contentType` começa com `image/` | `"image"`: foto |
| `contentType` = `application/pdf` | `"pdf"`: link "Abrir PDF" |
| outro | `null` |

`url` ausente com `file` presente: a coluna mostra "Não foi possível carregar a foto." (FR-008).
