# Implementation Plan: Tentar de novo a leitura da nota e mostrar a origem do resultado

**Branch**: `feature/009-receipt-retry-origin` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-receipt-retry-origin/spec.md`

## Summary

A API passou a devolver `resolutionPath` e `retry` em `GET /shopping-lists/{id}/receipt` e ganhou
`POST /shopping-lists/{id}/receipt/retry`. O front ganha: tipos novos, uma Server Action de retry,
três mensagens de erro em pt-BR, um botão "Tentar de novo" (componente cliente pequeno), um selo de
origem no cartão da nota e regras puras em `lib/receipt.ts` com testes. O polling existente em
`ReceiptStatus` não muda: depois do 202 a página é revalidada, o status vira `queued` e o
componente passa a consultar sozinho. Para o e2e, um proxy mínimo entre o Next e a API real
sobrescreve só os endpoints da nota (ver [research.md](./research.md)).

## Technical Context

**Language/Version**: TypeScript (strict), React 19 / Next.js App Router (versão do `package.json`; ler `node_modules/next/dist/docs/` antes de usar APIs)

**Primary Dependencies**: já instaladas — Next.js, React, Tailwind, `@playwright/test`. Nenhuma nova.

**Storage**: N/A (estado vive na API)

**Testing**: `pnpm test` (node:test em `lib/*.test.mjs`); `pnpm test:e2e` (Playwright, 1 worker)

**Target Platform**: Web (Next.js server + browser), mobile-first

**Project Type**: web-application (front-end apenas; API em outro repositório)

**Performance Goals**: N/A (sem carga nova; reaproveita o polling com intervalo crescente)

**Constraints**: sem mudanças na API; sem segundo polling; sem tocar a leitura de QR no aparelho; textos de UI em pt-BR, identificadores em inglês; tokens `kotta-*` de `DESIGN.md`

**Scale/Scope**: 1 tela (lista de compras), ~6 arquivos de produção, 2 de teste

## Constitution Check

*GATE: passou antes da Fase 0 e foi reavaliada após a Fase 1.*

| Princípio | Avaliação |
|-----------|-----------|
| I. Simplicity First | OK. Sem dependências novas, sem abstrações. Reusa `FormState`/`failure`, `useActionState`, polling de `ReceiptStatus`, `ReceiptCapture`. Proxy de e2e é o menor meio de simular a API (Next chama a API no servidor; `page.route` não alcança). |
| II. Clean Code | OK. Regras em funções pequenas e nomeadas (`canRetryReceipt`, `resolutionPathLabel`); constantes nomeadas para textos; erros tratados via `failure`. |
| III. Organized Structure | OK. Regra em `lib/receipt.ts`, UI em `components/receipt/`, ação em `app/actions/shopping.ts`. Sem barrel. |
| IV. Best Practices | OK. Server Component por padrão; `"use client"` só em `receipt-retry.tsx`. Ação valida `listId` e a API autoriza (403). Botão com foco visível e `min-h-11`. Tokens de design. Não há arquivo `VERSION` (nota já registrada na constituição). |
| V. Testable by Default | OK. Regras puras testadas em `lib/receipt.test.mjs`; fluxo coberto em e2e. |

Sem violações → Complexity Tracking vazio.

## Project Structure

### Documentation (this feature)

```text
specs/009-receipt-retry-origin/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── receipt-api.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
lib/api/types.ts                      # + ApiReceiptResolutionPath, ApiReceiptRetry; campos em ApiShoppingReceipt
lib/api/errors.ts                     # + 3 códigos em friendlyMessage
lib/receipt.ts                        # + resolutionPathLabel, canRetryReceipt, retriesLeftLabel
lib/receipt.test.mjs                  # + testes das três regras
app/actions/shopping.ts               # + retryReceiptAction
components/receipt/receipt-retry.tsx  # NOVO (client): botão + tentativas restantes + erro
components/receipt/receipt-summary.tsx# selo de origem
app/(conta)/grupos/[id]/listas/[listId]/page.tsx  # ReceiptArea monta ReceiptRetry; texto de falha sem retry
e2e/receipt-retry.spec.ts             # NOVO
e2e/mock-api-proxy.ts                 # NOVO: proxy que sobrescreve só endpoints da nota
playwright.config.ts                  # 2º webServer (proxy) e API_ORIGIN do app apontando para ele
```

**Structure Decision**: App Next.js único; mudanças ficam ao lado do fluxo da nota
(`components/receipt/`, `lib/receipt.ts`). `ReceiptStatus` permanece intocado.

## Complexity Tracking

Sem violações a justificar.
