# Data Model: Mostrar valor dos itens e desconto na nota

Nenhuma mudança de persistência. Um campo já devolvido pela API passa a ser tipado no web.

## ApiInvoice (web)

| Campo | Tipo | Observação |
|-------|------|------------|
| `resolutionPath` | `string` opcional | Já vem da API: `""`, `ocr`, `ocr_escalated`, `submitted_qr`, `submitted_key`, `photo_qr`, `photo_key` |

## InvoiceSummary (derivado, `lib/invoices.ts`)

| Campo | Tipo | Regra |
|-------|------|-------|
| `itemsCents` | number | soma de `totalCents` das linhas de `parseInvoiceItems` |
| `discountCents` | number | fiscal: `itemsCents − totalCents`; OCR: `itemsCents − reaisToCents(itemsTotal)`. Vale só se `> 5` e `< itemsCents`; senão `0` |
| `totalCents` | number | `reaisToCents(estimatedTotal)` |
| `differenceCents` | number | `itemsCents − discountCents − totalCents`; `0` quando `totalCents = 0` ou não há itens |

**Fiscal** = `resolutionPath` ∈ {`submitted_qr`, `submitted_key`, `photo_qr`, `photo_key`}.

## Exibição

| Situação | Resumo |
|----------|--------|
| Sem itens | Emitida em, Total da nota |
| Com itens, sem desconto | Emitida em, Valor dos itens, Total da nota |
| Com desconto | Emitida em, Valor dos itens, Desconto (−R$), Total da nota |
| `|differenceCents| > 5` | + aviso "Os itens não fecham com o total: diferença de R$ X. Confira com a foto." |
