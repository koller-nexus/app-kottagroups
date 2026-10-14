# Implementation Plan: Mostrar o andamento da leitura da nota fiscal

**Branch**: `feature/011-receipt-reading-progress` | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/011-receipt-reading-progress/spec.md`

## Summary

Hoje o envio e a leitura da nota têm sinais pequenos e espalhados (texto no botão, um ponto pulsando, selo de status). O plano é criar **um único indicador visual** (`Spinner`, anel girando com texto ao lado) e usá-lo nos quatro pontos onde o usuário espera: etapas do envio, aviso de leitura na tela da nota e na lista de compras, e itens das listas de notas. Não há mudança de API nem de dados: tudo é apresentação sobre o status que já existe. A regra de "qual mensagem mostrar" fica em funções puras em `lib/receipt.ts`, com teste.

## Technical Context

**Language/Version**: TypeScript (strict), React 19, Next.js App Router (ver `node_modules/next/dist/docs/`)

**Primary Dependencies**: Tailwind CSS e tokens `kotta-*` já existentes; nenhuma dependência nova

**Storage**: N/A (nenhum dado novo; "Nota lida" vive só em estado de componente)

**Testing**: `pnpm test` (`node --test lib/*.test.mjs`) para a lógica pura; verificação manual/Playwright já existente (feature 005) para a UI

**Target Platform**: Web (navegadores modernos, mobile e desktop)

**Project Type**: Web application (Next.js único)

**Performance Goals**: indicador em até 200 ms após a ação (SC-001); resultado em até 6 s após terminar a leitura (SC-005, já garantido por `RECEIPT_POLL_MAX_MS` = 5 s)

**Constraints**: movimento reduzido respeitado; texto sempre presente (não depende de animação); português do Brasil; só tokens de `DESIGN.md`/`lib/theme.ts`

**Scale/Scope**: 1 componente novo, 5 arquivos editados, 1 arquivo de lógica estendido

## Constitution Check

*GATE: passa antes da pesquisa e continua passando após o design.*

| Princípio | Avaliação |
|-----------|-----------|
| I. Simplicity First | Passa. Reaproveita `ReceiptStatus`, `AutoRefresh`, `isInvoicePending`, `QR_SEARCH_STATUS`. Um componente novo (`Spinner`) porque hoje não existe nenhum; sem dependência, sem biblioteca de animação. |
| II. Clean Code | Passa. Mensagens em constantes nomeadas; funções pequenas; sem parâmetro booleano que alterna comportamento. |
| III. Organized Structure | Passa. `Spinner` em `components/app/` junto dos outros blocos de UI; regras em `lib/receipt.ts`. |
| IV. Best Practices | Passa. `"use client"` só onde há estado/efeito; `Spinner` e `InvoiceStatus` seguem Server Components; tokens `kotta-*`; `prefers-reduced-motion` e `role="status"`. Sem `VERSION` no repo (follow-up já registrado na constituição). |
| V. Testable by Default | Passa. Escolha de mensagem e transição "viu a leitura terminar" são funções puras testadas em `lib/receipt.test.mjs`. |

Sem violações; **Complexity Tracking** não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/011-receipt-reading-progress/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-states.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
components/app/
├── spinner.tsx                  # NOVO: anel de progresso + texto opcional, sem estado (Server Component)
├── invoice-status.tsx           # editar: mostra Spinner dentro do selo quando pendente
└── group-invoices-card.tsx      # sem mudança (usa InvoiceStatus)

components/receipt/
├── receipt-status.tsx           # editar: Spinner, "Na fila" x "Lendo", "pode sair", "Nota lida"
└── receipt-capture.tsx          # editar: "Enviando nota…" com Spinner

components/forms/
├── shopping-forms.tsx           # editar: etapa "Preparando a foto…" + Spinner no ReceiptUploadForm
└── invoice-upload-form.tsx      # editar: Spinner + role="status" no envio

app/(conta)/grupos/[id]/notas/[notaId]/page.tsx   # editar: aviso de leitura usa Spinner + "pode sair"

lib/
├── receipt.ts                   # editar: mensagens de progresso e regra de "Nota lida"
└── receipt.test.mjs             # editar: testes dessas funções
```

**Structure Decision**: aplicação Next.js única; mudança confinada a `components/` e `lib/`, sem rota nova nem ação de servidor nova.

## Phase 0 / Phase 1

Resolvidos em [research.md](research.md); desenho em [data-model.md](data-model.md), [contracts/ui-states.md](contracts/ui-states.md) e [quickstart.md](quickstart.md). Constitution Check reavaliado após o design: continua sem violações.
