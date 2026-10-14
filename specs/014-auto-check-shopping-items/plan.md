# Implementation Plan: Marcar como comprado, sozinho, o que veio na nota

**Branch**: `feature/014-auto-check-shopping-items` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-auto-check-shopping-items/spec.md`

## Summary

O backend já marca o check de comprado quando cruza a nota com a lista (R1). O problema está na web:
o cruzamento roda depois que a nota vira `done`, e a lista para de recarregar exatamente nesse
momento. Por isso os checks só aparecem quando a pessoa recarrega a página (R2). A correção mantém o
polling enquanto a nota está lida, tem linhas e ainda não tem correspondências, e mostra "Marcando
os itens da lista…" nesse intervalo. A US2 (ligar uma nota do grupo a uma lista) depende de uma rota
que o backend não tem e fica fora desta entrega (R3).

## Technical Context

**Language/Version**: TypeScript 5

**Primary Dependencies**: Next.js App Router, React, Tailwind CSS (já instalados)

**Storage**: N/A (só leitura das respostas atuais da API)

**Testing**: `pnpm test` (`lib/receipt.test.mjs`, `node:test`)

**Target Platform**: navegador, servidor Next.js

**Project Type**: aplicação web

**Performance Goals**: checks visíveis em até 30 s após o envio (SC-002), reaproveitando o intervalo
crescente de `nextPollDelay`

**Constraints**: sem dependência nova, sem mudança na API; polling limitado por `RECEIPT_POLL_TIMEOUT_MS`

**Scale/Scope**: 1 função pura em `lib/receipt.ts`, 1 prop em `receipt-status.tsx`, 1 linha na
página da lista

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|-----------|-------------|--------|
| I. Simplicity First | Reaproveita a regra do backend e o polling existente; nada novo de API, sem dependência | ✅ |
| II. Clean Code | `awaitingMatches` nomeada pela intenção; mensagem como constante; sem parâmetro booleano que troca comportamento de função (a prop é um dado de estado) | ✅ |
| III. Organized Structure | Regra em `lib/receipt.ts`, UI em `components/receipt/`, junto do que já trata a nota | ✅ |
| IV. Best Practices | Página continua Server Component; o único client é o `ReceiptStatus` que já existe; `role="status"` mantido. Regra de `VERSION`: não existe arquivo `VERSION` (pendência da constituição v1.1.0), nada a incrementar | ✅ |
| V. Testable by Default | `awaitingMatches` e a mensagem testadas em `lib/receipt.test.mjs` | ✅ |

Re-check após o Phase 1: sem mudança; nenhuma violação.

## Project Structure

### Documentation (this feature)

```text
specs/014-auto-check-shopping-items/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/receipt-status-ui.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
lib/
├── receipt.ts                 # + awaitingMatches(), + mensagem "Marcando os itens da lista…"
└── receipt.test.mjs           # + testes
components/receipt/
└── receipt-status.tsx         # + prop awaitingMatches: mantém polling e muda a mensagem
app/(conta)/grupos/[id]/listas/[listId]/
└── page.tsx                   # passa awaitingMatches para ReceiptStatus
```

**Structure Decision**: aplicação Next.js única; a mudança fica nos três arquivos que já tratam o
andamento da nota na lista.

## Out of Scope

- **US2** (nota da seção Notas → lista): exige `PUT /invoices/{id}/shopping-list` no backend
  (research.md R3). Abrir issue em `koller-nexus/api-kottagroups` e retomar com nova feature.
- Campo explícito de "cruzamento em andamento" na API: upgrade se o heurístico de R2 falhar.

## Complexity Tracking

Sem violações.
