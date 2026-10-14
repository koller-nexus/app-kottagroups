# Implementation Plan: Corrigir a tela de nota fiscal com leitura falhada

**Branch**: `010-failed-receipt-screen` | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-failed-receipt-screen/spec.md`

## Summary

A página de nota do grupo (`/grupos/[id]/notas/[notaId]`) não oferece saída quando a leitura falha e
mostra a seção "Despesa" em notas sem leitura. O plano: (1) esconder "Despesa" fora de nota lida (ou
falha já vinculada), com a regra numa função pura testada; (2) na falha, mostrar a explicação e o
envio de outra foto reaproveitando `InvoiceUploadForm`; (3) unificar as mensagens da seção "Despesa"
numa nota lida sem despesas livres. Escanear o QR code direto e "Tentar de novo" dependem de suporte
da API de notas do grupo que hoje não existe (ver research.md) e ficam fora desta entrega.

## Technical Context

**Language/Version**: TypeScript, Next.js (App Router, versão do repo; ler `node_modules/next/dist/docs/`), React

**Primary Dependencies**: já instaladas; nenhuma nova

**Storage**: N/A (dados vêm da API Kotta)

**Testing**: `pnpm test` (`lib/invoices.test.mjs`), Playwright com API simulada (`e2e/notes-notifications.spec.ts`)

**Target Platform**: web mobile-first (PWA no iPhone, como na captura)

**Project Type**: web app (frontend; backend é outro repositório)

**Performance Goals**: sem mudança; nenhuma chamada de API nova

**Constraints**: textos em português; tokens de `DESIGN.md`/`lib/theme.ts`; foco visível; alvos de toque 44px

**Scale/Scope**: 1 página, 1 componente de seção, 1 componente de recuperação novo, 1 módulo de regras

## Constitution Check

| Princípio | Avaliação |
|-----------|-----------|
| I. Simplicity First | OK. Reusa `InvoiceUploadForm`; nenhuma dependência; não cria QR/retry sem API. |
| II. Clean Code | OK. Regra de visibilidade em função nomeada (`canLinkInvoice`), sem booleano que troca comportamento. |
| III. Organized Structure | OK. Regras em `lib/invoices.ts`, UI em `components/app/`. |
| IV. Best Practices | OK. Server Component por padrão; sem `"use client"` novo (o form de upload já é client). Tokens e foco. Regra do `VERSION`: arquivo não existe (pendência já registrada na constituição). |
| V. Testable | OK. Teste unitário da regra + e2e do estado de falha. |

Sem violações; Complexity Tracking vazio. Reavaliado após o design: sem mudança.

## Project Structure

### Documentation (this feature)

```text
specs/010-failed-receipt-screen/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/ui.md
```

### Source Code (repository root)

```text
lib/invoices.ts                                  # + canLinkInvoice, recovery rule
lib/invoices.test.mjs                            # + casos
components/app/invoice-expense-section.tsx       # mensagem única; não renderiza sem vínculo possível
components/app/invoice-failed-recovery.tsx       # NOVO: explicação + InvoiceUploadForm (não arquivado)
app/(conta)/grupos/[id]/notas/[notaId]/page.tsx  # condiciona Despesa e mostra recuperação
e2e/notes-notifications.spec.ts                  # + estado falhou
```

**Structure Decision**: mudança local à rota da nota do grupo; nenhum diretório novo.

## Complexity Tracking

Sem violações a justificar.
