# Implementation Plan: Repassar o IP do navegador à API nas chamadas do servidor

**Branch**: `feature/026-forward-client-ip` | **Date**: 2026-10-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/026-forward-client-ip/spec.md`

## Summary

Toda chamada servidor→API passa a levar `X-Kotta-Client-IP` (IP do navegador definido pela borda
da Vercel) e `X-Kotta-Bff-Secret` (de `KOTTA_BFF_SECRET`, só servidor), para a API de api#250
contar o limite por pessoa e não pelo IP de saída da Vercel (issue #81). Uma função pura em
`lib/api/client-ip.ts` decide os cabeçalhos; `apiRequest` e o `checkToken` de `/sair` os aplicam
por último. Sem segredo, nada muda. O mock e2e passa a registrar os cabeçalhos recebidos.

## Technical Context

**Language/Version**: TypeScript 5 (strict), Node 20+, Bun no `dev`/`build`

**Primary Dependencies**: Next.js 16.4.2 (App Router, `next/headers` `headers()`), `node:net`
`isIP`. Nenhuma dependência nova (`@vercel/functions` descartado, research R1).

**Storage**: N/A

**Testing**: `pnpm test` (node:test, `lib/api/*.test.mjs`), `pnpm test:e2e` (Playwright 1.64,
Chromium, build de produção, API atrás de `e2e/mock-api-proxy.ts`)

**Target Platform**: Vercel (Production e Preview); dev e e2e em `next start` local

**Project Type**: web app Next.js (BFF da `api-kottagroups`)

**Performance Goals**: sem custo mensurável (leitura de dois cabeçalhos por chamada)

**Constraints**: o IP nunca vem de cabeçalho escolhido pelo navegador (FR-002); o segredo nunca
chega ao navegador (FR-004); sem segredo o comportamento é o de hoje (FR-005)

**Scale/Scope**: 1 módulo novo + teste, 2 arquivos de código alterados, mock e2e, 1 spec e2e,
config da Playwright, README

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Situação |
|-----------|----------|
| I. Simplicity First | ✅ Sem dependência: ler `x-real-ip` é uma linha (R1). Um módulo novo, justificado por dois usos (`apiRequest`, `/sair`) e pelo teste unitário do FR-009. Status em lote fora (R7). |
| II. Clean Code | ✅ Nomes em inglês (`clientIpHeaders`, `bffHeaders`); nomes de cabeçalho como constantes; sem flag booleana; segredo ausente tratado explicitamente. |
| III. Organized Structure | ✅ `lib/api/client-ip.ts` ao lado de `server.ts`, uma responsabilidade. |
| IV. Best Practices | ✅ Segredo lido só em `lib/api/server.ts` (`server-only`); sem `NEXT_PUBLIC_` (R4); `headers()` sempre em escopo de requisição (R2). |
| V. Testable by Default | ✅ `lib/api/client-ip.test.mjs` cobre a tabela do `data-model.md`; `e2e/client-ip.spec.ts` cobre FR-010. |
| Workflow | ✅ Branch `feature/026-forward-client-ip` já criada. Lint, test, e2e e build no PR. Sem arquivo `VERSION` (follow-up da constituição). |

Sem violações; Complexity Tracking vazio. Re-check pós-design: mantido.

## Project Structure

### Documentation (this feature)

```text
specs/026-forward-client-ip/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── bff-client-ip.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
lib/api/
├── client-ip.ts         # NOVO: CLIENT_IP_HEADER, BFF_SECRET_HEADER,
│                        #   clientIpHeaders(incoming, secret)  (puro)
├── client-ip.test.mjs   # NOVO
└── server.ts            # bffHeaders() (lê KOTTA_BFF_SECRET, aviso único em produção);
                         #   apiRequest aplica com headers.set depois dos do chamador
app/sair/route.ts        # checkToken envia bffHeaders()
e2e/
├── mock-api-proxy.ts    # registra x-kotta-* por chamada; GET/DELETE /__mock/last-headers
└── client-ip.spec.ts    # NOVO: cabeçalhos chegam, forjados não chegam, segredo não vaza
playwright.config.ts     # KOTTA_BFF_SECRET=e2e-bff-secret no webServer do Next
README.md                # documenta KOTTA_BFF_SECRET
```

**Structure Decision**: tudo em `lib/api/` (camada de chamadas à API), sem tocar em `proxy.ts` nem
nas Server Actions: `browserHeaders()` em `app/actions/auth.ts` fica como está (FR-007), e os
cabeçalhos novos chegam lá pelo `apiRequest`.

## Riscos

- **Contrato aberto (api#250)**: nomes ou mecanismo podem mudar; só `client-ip.ts` muda. Conferir
  antes de mergear.
- **Ordem de deploy**: front antes da API → API ignora os cabeçalhos; API antes do front → limite
  continua por IP de saída. Nenhuma ordem quebra.
- **Local/e2e**: `x-forwarded-for` é controlável pelo cliente fora da Vercel (R6); por isso o
  segredo só existe na Vercel e no e2e.

## Complexity Tracking

Vazio.
