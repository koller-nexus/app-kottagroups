# Implementation Plan: Mostrar valor dos itens e desconto na nota

**Branch**: `feature/013-invoice-discount-summary` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-invoice-discount-summary/spec.md`

## Summary

O resumo da nota passa a seguir a conta "Valor dos itens − Desconto = Total da nota" e avisa quando
ela não fecha. Tudo é calculado no web a partir do que a API já devolve: as linhas (`items`), o
total impresso (`estimatedTotal`), a soma já descontada (`itemsTotal`) e a origem da leitura
(`resolutionPath`). Não há mudança na API nem migração, e notas antigas, como a do exemplo, passam
a mostrar o desconto na hora.

## Technical Context

**Language/Version**: TypeScript 5

**Primary Dependencies**: Next.js App Router, React, Tailwind CSS (todos já instalados)

**Storage**: N/A (só leitura da resposta atual de `GET /invoices/{id}`)

**Testing**: `pnpm test` (`lib/invoices.test.mjs`, `node:test`); e2e da tela em `e2e/notes-notifications.spec.ts`

**Target Platform**: navegador, servidor Next.js

**Project Type**: aplicação web

**Performance Goals**: cálculo síncrono sobre algumas dezenas de linhas, sem custo perceptível

**Constraints**: sem dependência nova e sem mudança na API; centavos inteiros para evitar erro de ponto flutuante

**Scale/Scope**: 1 função pura em `lib/invoices.ts`, ajuste em `components/app/invoice-reading.tsx` e 1 campo no tipo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|-----------|-------------|--------|
| I. Simplicity First | Deriva de dados existentes; reaproveita `parseInvoiceItems`, `reaisToCents`, `invoiceDifferenceCents` (se servir) e `Price`; sem coluna nem endpoint novos | ✅ |
| II. Clean Code | `invoiceSummary(invoice)` faz uma coisa; tolerância como constante nomeada (`TOTAL_TOLERANCE_CENTS = 5`) | ✅ |
| III. Organized Structure | Regra em `lib/invoices.ts`; exibição em `components/app/invoice-reading.tsx` | ✅ |
| IV. Best Practices | Continua Server Component; tokens `kotta-*`; `Price` já formata moeda | ✅ |
| V. Testable by Default | Regra pura com testes cobrindo OCR com desconto, fiscal com desconto, sem desconto, diferença e sem itens | ✅ |

Nenhuma violação. **Re-check pós-design**: mantido.

## Project Structure

### Documentation (this feature)

```text
specs/013-invoice-discount-summary/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── invoice-summary.md
└── tasks.md             # /speckit-tasks
```

### Source Code

```text
lib/api/types.ts                     # ApiInvoice.resolutionPath?: string (a API já devolve)
lib/invoices.ts                      # invoiceSummary(invoice) → { itemsCents, discountCents, totalCents, differenceCents }
lib/invoices.test.mjs                # casos da regra
components/app/invoice-reading.tsx   # resumo: Emitida em, Valor dos itens, Desconto (se houver), Total da nota + aviso
e2e/notes-notifications.spec.ts      # nota simulada com desconto e com diferença
```

**Structure Decision**: a mudança fica toda no web. `invoice-reading.tsx` já concentra o resumo e a tabela (feature 012).

## Complexity Tracking

Sem violações.
