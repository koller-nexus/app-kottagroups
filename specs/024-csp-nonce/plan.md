# Implementation Plan: Política de segurança de conteúdo completa, com nonce por requisição

**Branch**: `feature/024-csp-nonce` | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/024-csp-nonce/spec.md`

## Summary

O `proxy.ts` gera um nonce de 128 bits por requisição e manda a política completa no cabeçalho da
requisição (o Next lê o nonce dali e o aplica sozinho nos próprios scripts) e no da resposta
([research](research.md) R1, R2). A política é montada por uma função pura em `lib/csp.ts`:
`script-src` com nonce e `'strict-dynamic'`, `style-src` com nonce mais `style-src-attr
'unsafe-inline'` para os `style=` (R5), `img-src` com `self`, `blob:` e a origem da API (R4),
`connect-src 'self'` e `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` e
`frame-ancestors 'none'` (R3, [contrato](contracts/csp-header.md)).

`CSP_REPORT_ONLY=1` troca o cabeçalho para relato sem mudar a política (R9). O `next.config.ts`
continua com a política só de frame para estáticos e redirecionamentos (R8). No servidor do Next, o
cabeçalho do proxy sobrescreve o do config. Na Vercel isso é conferido no preview antes do merge.

Nenhuma rota muda de modo, porque as 29 já são dinâmicas. `connection()` no layout raiz deixa essa
dependência explícita (R7).

Testes:
- `lib/csp.test.mjs` cobre as regras puras.
- O e2e de cabeçalhos é atualizado.
- Um fixture faz toda a suíte falhar se houver violação de política.
- Uma spec nova cobre as telas que faltam e o bloqueio de script injetado (R10).

## Technical Context

- **Language/Version**: TypeScript 5 (strict), Next.js 16.4.2 (App Router). Scripts rodam com Bun (`bun --bun next …`), e os testes com Node 24.
- **Primary Dependencies**: nenhuma nova. Usa `crypto.getRandomValues`, `btoa` e `connection()` de `next/server`.
- **Storage**: N/A
- **Testing**:
  - `pnpm test`, com node:test em `lib/*.test.mjs`.
  - `pnpm test:e2e`, com Playwright em build de produção e a API real atrás de `e2e/mock-api-proxy.ts`.
- **Target Platform**: web (Next na Vercel). Navegadores atuais com CSP3 (Chrome/Edge, Firefox, Safari 15.4+).
- **Project Type**: web application (front de `api-kottagroups`)
- **Performance Goals**: "HTML completo" p75 no máximo 20% pior que o de `main` (SC-006, R7).
- **Constraints**:
  - Nenhuma mudança visível para quem usa.
  - Zero violações de política na suíte e2e.
  - Nada de `unsafe-*` em script ou style em produção.
- **Scale/Scope**:
  - 2 arquivos novos em `lib/` (`csp.ts`, `api/origin.ts`) e 1 teste unitário.
  - Edição em `proxy.ts`, `app/layout.tsx`, `next.config.ts` e `lib/api/server.ts`.
  - E2e: 2 arquivos novos (`fixtures.ts`, `csp.spec.ts`), mudança de import nas 13 specs e reescrita de `security-headers.spec.ts`.
  - 1 PR.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Nota |
|-----------|--------|------|
| I. Simplicity First | ✅ | Nenhuma dependência nova. O nonce sai do proxy que já existe, sem camada nova. `lib/api/origin.ts` só existe porque o proxy é o 3º uso da origem da API (R11). A única configuração nova, `CSP_REPORT_ONLY`, muda por ambiente e serve para voltar atrás (R9). Os `style=` ficam como estão, com o risco documentado (R5). O fixture de violação reaproveita os fluxos que a suíte já percorre (R10). |
| II. Clean Code | ✅ | Funções puras e curtas (`createNonce`, `contentSecurityPolicy`) e nomes em inglês. O tamanho do nonce fica numa constante nomeada (`NONCE_BYTES`). O modo é um valor de ambiente, não um parâmetro booleano que muda o comportamento da função de política. |
| III. Organized Structure | ✅ | A política mora em `lib/csp.ts` e a origem da API em `lib/api/origin.ts`, cada um com um propósito só. O proxy só orquestra. |
| IV. Best Practices | ✅ | Segue o guia instalado do Next (nonce no proxy, renderização dinâmica, `'unsafe-eval'` só em dev). `lib/api/origin.ts` não lê segredo, por isso não importa `server-only`. Não há arquivo `VERSION`, então não há nada a incrementar. |
| V. Testable by Default | ✅ | As regras da política e do nonce têm teste unitário, e cabeçalhos, nonce único, zero violações e bloqueio de injeção têm e2e. Duas checagens ficam sem teste automatizado e vão para o [quickstart](quickstart.md): o comportamento na Vercel (§4) e o erro no layout raiz (§5). |

Pós-design: sem mudança; nenhuma violação.

## Project Structure

### Documentation (this feature)

```text
specs/024-csp-nonce/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── performance.md        # preenchido na implementação (R7, quickstart §6)
├── contracts/
│   └── csp-header.md
├── checklists/requirements.md
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
lib/api/origin.ts                     # novo: apiOrigin() (sai de server.ts)
lib/api/server.ts                     # importa apiOrigin de origin.ts
lib/csp.ts, lib/csp.test.mjs          # novo: createNonce, contentSecurityPolicy
proxy.ts                              # nonce + cabeçalho (bloqueio ou relato) na requisição e na resposta
app/layout.tsx                        # await connection()
next.config.ts                        # usa apiOrigin(); comentário da CSP aponta para o proxy

e2e/fixtures.ts                       # novo: test com fixture automático de violações
e2e/*.spec.ts, e2e/auth.setup.ts      # importam test de ./fixtures
e2e/security-headers.spec.ts          # política completa em página, só frame em estático, nonce único
e2e/csp.spec.ts                       # novo: telas extras + script injetado bloqueado
```

Sem mudança:
- `vercel.json`
- Componentes com `style=`, que ficam como estão (R5).
- `components/app/vercel-insights.tsx`, que não precisa de origem extra (R6).
- O matcher do proxy.

**Structure Decision**: o app Next.js único na raiz, com tudo num PR. A ativação gradual
(relato no Preview, depois bloqueio) acontece por variável de ambiente no mesmo PR
([quickstart](quickstart.md) §4), não por PRs separados.

## Complexity Tracking

Sem violações.
