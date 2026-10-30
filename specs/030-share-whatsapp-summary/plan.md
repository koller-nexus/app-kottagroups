# Implementation Plan: Compartilhar cobrança e resumo via WhatsApp e Web Share

**Branch**: `030-share-whatsapp-summary` | **Date**: 2026-10-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/030-share-whatsapp-summary/spec.md`

## Summary

Adicionar um botão "Cobrar" em cada acerto pendente do qual a pessoa logada é a credora, e um
botão "Compartilhar resumo" na página do grupo. Os dois montam um texto PT-BR (via novo
`lib/share-text.ts`, puro e testado) a partir de dados já carregados na página do grupo
(`ApiSettlement`, `names`, `me.pixKey`), e abrem `navigator.share`; sempre oferecem também um link
`https://wa.me/?text=` e "Copiar texto" (reutilizando `CopyTextButton`), em vez de só no fallback —
mais simples que uma máquina de estados de "falhou/sem suporte" e já é o padrão usado em
`components/invites/created-invite.tsx`. Sem rota, endpoint ou dependência nova.

## Technical Context

**Language/Version**: TypeScript, Next.js 16.4.2 (App Router), React 19.2.8 — já em uso no repo.

**Primary Dependencies**: nenhuma nova. Reaproveita `navigator.share`, `navigator.clipboard`
(via `CopyTextButton` existente) e `encodeURIComponent` para montar o link do WhatsApp.

**Storage**: N/A — o texto é montado em memória a partir de dados já buscados pela página do
grupo (settlements, membros, saldo); nada é persistido.

**Testing**: `node --test` (`pnpm test`) para `lib/share-text.test.mjs`, seguindo o padrão de
`lib/money.ts` + `lib/money.test.mjs`. Sem necessidade de E2E novo (Playwright) para esta fatia.

**Target Platform**: Web (navegador mobile e desktop do app Next.js já existente).

**Project Type**: Aplicação web única (Next.js App Router) — sem split frontend/backend.

**Performance Goals**: N/A além da interatividade normal da página; é concatenação de string.

**Constraints**: só front, sem rota ou endpoint novo na API (requisito da issue); deve seguir os
tokens de `DESIGN.md`/`lib/theme.ts` e o piso de acessibilidade da Constituição (IV).

**Scale/Scope**: 1 módulo novo em `lib/` (texto), 1 componente novo em `components/app/`
(botão de compartilhar reutilizável), e os dois pontos de uso já existentes em
`app/(conta)/grupos/[id]/page.tsx`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Simplicity First | PASS — nenhuma dependência nova; reusa `CopyTextButton` e o padrão `canShare` de `created-invite.tsx`; um único componente de botão serve os dois pontos de uso (não é abstração prematura, já são 2 usos reais). |
| II. Clean Code | PASS — `lib/share-text.ts` só com funções puras e nomes de intenção (`buildSettlementShareText`, `buildGroupSummaryShareText`, `buildWhatsAppShareUrl`); nada acima de ~40 linhas. |
| III. Organized Structure | PASS — módulo utilitário fica em `lib/` (mesmo padrão de `money.ts`/`people.ts`), componente de UI genérico fica em `components/app/` (mesmo nível de `copy-text-button.tsx`); nenhum arquivo novo fora desses dois lugares. |
| IV. Best Practices | PASS — componente novo é `"use client"` só onde precisa de `navigator`/estado; usa tokens `kotta-*`/`secondary-action` já existentes; acessibilidade (foco, `aria-label`, `aria-live`) reaproveitada de `CopyTextButton`. |
| V. Testable by Default | PASS — toda a lógica de montagem de texto (regra de negócio) vai para `lib/share-text.ts` com testes `node --test`; o componente de UI só chama essas funções e a Web Share API, sem lógica própria para testar. |

Nenhuma violação; `Complexity Tracking` fica vazio.

**Re-check pós-Phase 1**: `data-model.md` e `contracts/share-text.md` não introduziram nenhuma
dependência, rota ou abstração nova além do previsto aqui — gate continua PASS em todos os itens.

## Project Structure

### Documentation (this feature)

```text
specs/030-share-whatsapp-summary/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── share-text.md    # Assinaturas exportadas por lib/share-text.ts
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/
├── share-text.ts            # NOVO — funções puras: buildSettlementShareText,
│                             #   buildGroupSummaryShareText, buildWhatsAppShareUrl
└── share-text.test.mjs      # NOVO — testes node --test

components/app/
└── share-button.tsx          # NOVO — "use client"; recebe `text`/`shareTitle`/`label`;
                               #   botão "Compartilhar" (quando navigator.share existe),
                               #   link wa.me e CopyTextButton, sempre visíveis

app/(conta)/grupos/[id]/
└── page.tsx                  # EDITADO — usa share-text + <ShareButton> no acerto pendente
                               #   onde settlement.to === me.id ("Cobrar") e uma vez na página
                               #   ("Compartilhar resumo")
```

**Structure Decision**: aplicação web única existente (Next.js App Router); a feature só adiciona
um módulo de lógica pura em `lib/` e um componente de UI genérico em `components/app/`, reusados
nos dois pontos da página de grupo já mapeados no spec — sem nova pasta, rota ou projeto.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Nenhuma violação — tabela vazia.
