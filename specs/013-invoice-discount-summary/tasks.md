---

description: "Task list for 013-invoice-discount-summary"
---

# Tasks: Mostrar valor dos itens e desconto na nota

**Input**: Design documents from `/specs/013-invoice-discount-summary/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/invoice-summary.md, quickstart.md

**Tests**: incluídos porque a constituição (Princípio V) exige teste para regra nova. Casos de
referência em [contracts/invoice-summary.md](./contracts/invoice-summary.md).

**R4 resolvido**: `invoiceDifferenceCents` em `lib/invoices.ts` compara nota × despesa e não é
reaproveitado.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Criar a branch `feature/013-invoice-discount-summary` a partir de `feature/012-receipt-photo-preview`, porque `components/app/invoice-reading.tsx` nasceu na 012 — as mudanças da 012, ainda não commitadas, vieram junto no working tree

---

## Phase 2: Foundational

- [X] T002 Adicionar `resolutionPath?: string` a `ApiInvoice`, com comentário "Origem da leitura: \"\", ocr, ocr_escalated, submitted_qr, submitted_key, photo_qr, photo_key", em `lib/api/types.ts`

---

## Phase 3: User Story 1 - Entender de onde vem o total (Priority: P1) 🎯 MVP

**Goal**: o resumo mostra "Valor dos itens", "Desconto" (se houver) e "Total da nota".

**Independent Test**: na nota 01M4XREAWVHESAGCY3RCN5WFFZ aparecem R$ 104,15, −R$ 4,15 e R$ 100,00.

- [X] T003 [US1] Escrever os testes de `invoiceSummary` em `lib/invoices.test.mjs`, com todos os casos da tabela de `contracts/invoice-summary.md`: exemplo OCR com desconto (10415/415/10000/0), OCR sem desconto, OCR com item faltando (diferença −500), fiscal `submitted_qr` com desconto (10000/1000/9000/0), arredondamento (diferença 3), total não identificado (diferença 0) e sem itens (0/0/4200/0)
- [X] T004 [US1] Implementar `invoiceSummary(invoice: Pick<ApiInvoice, "items" | "itemsTotal" | "estimatedTotal" | "resolutionPath">)` em `lib/invoices.ts`, retornando `{ itemsCents, discountCents, totalCents, differenceCents }`:
  - `itemsCents` = soma de `totalCents` de `parseInvoiceItems(items)`.
  - **Fiscal** = `resolutionPath` ∈ {`submitted_qr`, `submitted_key`, `photo_qr`, `photo_key`}: desconto bruto = `itemsCents − totalCents`. **Caso contrário** (OCR): desconto bruto = `itemsCents − reaisToCents(itemsTotal)`.
  - `discountCents` = desconto bruto se `> TOTAL_TOLERANCE_CENTS (5)` e `< itemsCents`; senão `0`.
  - `differenceCents` = `itemsCents − discountCents − totalCents`; `0` quando `totalCents === 0` ou `itemsCents === 0`.
  - Exportar a constante `TOTAL_TOLERANCE_CENTS = 5`. Fazer T003 passar.
- [X] T005 [US1] Em `components/app/invoice-reading.tsx`, trocar o `<dl>` atual (Emitida em / Total da nota / Soma dos itens) por um resumo a partir de `invoiceSummary(invoice)`, nesta ordem: — `Price` já tem `sign="−"` (aria-label "menos R$ 4,15"); grade sem célula vazia via `SUMMARY_COLUMNS` (2 → `sm:grid-cols-2`, 3 → `sm:grid-cols-3`, 4 → `sm:grid-cols-2 lg:grid-cols-4`); total zerado mostra "Não identificado"
  - "Emitida em".
  - "Valor dos itens", só se `itemsCents > 0`.
  - "Desconto", só se `discountCents > 0`, com `<Price cents={-discountCents} …>`. Antes, conferir se `Price` formata negativo como "−R$ 4,15"; se não, prefixar "−" e passar o valor positivo.
  - "Total da nota".
  - Grade `grid-cols-1 sm:grid-cols-2`, com `lg:grid-cols-4` quando houver desconto e `lg:grid-cols-3` quando não houver. Manter as classes `kotta-*` atuais.
  - Remover o rótulo "Soma dos itens".
- [X] T006 [US1] Cenário e2e em `e2e/notes-notifications.spec.ts` simulando, via `setInvoice`, `status: "done"`, `resolutionPath: "ocr"`, `items` com linhas de 89,40 e 14,75, `itemsTotal: 100` e `estimatedTotal: 100`. Esperar "Valor dos itens", o texto "104,15", "Desconto", "4,15" e "Total da nota", e nenhum "Soma dos itens". Resetar com `setInvoice(id, {})` — escrito; não rodou localmente (credenciais de e2e só no CI)

**Checkpoint**: MVP: a nota do exemplo mostra a conta completa.

---

## Phase 4: User Story 2 - Perceber quando os números não fecham (Priority: P2)

**Goal**: aviso com a diferença quando `|differenceCents| > 5`.

**Independent Test**: uma nota simulada com itens de R$ 10,00 e total de R$ 15,00 mostra o aviso de R$ 5,00.

- [X] T007 [US2] Em `components/app/invoice-reading.tsx`, quando `Math.abs(differenceCents) > TOTAL_TOLERANCE_CENTS`, mostrar logo após o resumo o aviso `<p className="rounded-card bg-kotta-danger-bg p-6 text-sm text-kotta-danger">` com o texto "Os itens não fecham com o total: diferença de {Price de Math.abs(differenceCents)}. Confira com a foto."
- [X] T008 [US2] No cenário e2e de `e2e/notes-notifications.spec.ts`, simular `items` com uma linha de 10,00, `itemsTotal: 10`, `estimatedTotal: 15` e `resolutionPath: "ocr"`, e esperar "Os itens não fecham com o total". Na simulação de T006 (desconto), esperar que o aviso não apareça — no mesmo cenário de T006; não rodou localmente

---

## Phase 5: Polish & Cross-Cutting

- [X] T009 Rodar `pnpm lint && pnpm test && pnpm build` e corrigir falhas — `pnpm lint`, `pnpm test` (78/78), `tsc --noEmit` e `pnpm build` passam
- [ ] T010 Validar manualmente os cenários 1–5 de `specs/013-invoice-discount-summary/quickstart.md` em `http://localhost:3002` — **Pendente**: precisa de login no dev server para abrir a nota real

---

## Dependencies & Execution Order

- T001 → T002 → US1 (T003 → T004 → T005 → T006) → US2 (T007 → T008) → Polish.
- US2 usa `differenceCents` de T004 e o mesmo componente de T005, então vem depois de US1.

### Parallel Opportunities

- T002 e T003 são arquivos diferentes e podem ir juntos.
- T006 (e2e) pode ser escrito em paralelo com T005, depois que T004 estiver pronto.

## Implementation Strategy

1. MVP = US1: o resumo com valor dos itens, desconto e total resolve a nota do exemplo.
2. US2 entra no mesmo PR, porque é pequena e mexe no mesmo componente.
3. Commit (inglês, Conventional Commits): `feat: show item subtotal and discount on the invoice`.
