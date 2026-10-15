# Contract: resumo da nota (UI)

Sem contrato novo de API. Esta página registra o que a tela promete, para os testes.

## Entrada (já existente em `GET /api/v1/invoices/{id}`)

`items[].line_total`, `estimatedTotal`, `itemsTotal`, `resolutionPath`

## `invoiceSummary(invoice)`, casos de referência

| Caso | resolutionPath | linhas | itemsTotal | estimatedTotal | itens | desconto | total | diferença |
|------|----------------|--------|-----------|----------------|-------|----------|-------|-----------|
| Exemplo (OCR com desconto) | `ocr_escalated` | 89,40 + 14,75 | 100,00 | 100,00 | 10415 | 415 | 10000 | 0 |
| OCR sem desconto | `ocr` | 10,00 + 5,00 | 15,00 | 15,00 | 1500 | 0 | 1500 | 0 |
| OCR com item faltando | `ocr` | 10,00 | 10,00 | 15,00 | 1000 | 0 | 1500 | −500 |
| Fiscal com desconto | `submitted_qr` | 50,00 + 50,00 | 100,00 | 90,00 | 10000 | 1000 | 9000 | 0 |
| Arredondamento | `ocr` | 10,03 | 10,03 | 10,00 | 1003 | 0 | 1000 | 3 (sem aviso) |
| Total não identificado | `ocr` | 10,00 | 10,00 | 0 | 1000 | 0 | 0 | 0 |
| Sem itens | `ocr` | — | 0 | 42,00 | 0 | 0 | 4200 | 0 |

## Tela (`/grupos/{id}/notas/{notaId}`, nota lida)

- Rótulos: "Emitida em", "Valor dos itens", "Desconto", "Total da nota".
- O desconto aparece como "−R$ 4,15".
- Aviso (quando `|diferença| > 5`): "Os itens não fecham com o total: diferença de R$ 5,00. Confira com a foto."
- "Soma dos itens" não existe mais.
