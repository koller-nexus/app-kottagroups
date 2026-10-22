# Implementation Plan: Endurecimento da re-auditoria de segurança (run-2)

**Branch**: `feature/023-reaudit-run2-hardening` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/023-reaudit-run2-hardening/spec.md`

## Summary

Cinco endurecimentos independentes que fecham a run-2 (#63), cada um num PR próprio:

1. **#67** `next`/`eslint-config-next` 16.3.5 → 16.3.8. Se `sharp` ou `source-map-js` continuarem
   na versão antiga no lockfile, atualizar só essa dependência transitiva
   ([research](research.md) R1).
2. **#66** `logoutAction` chama `POST /auth/logout` com `auth: false`, bearer explícito e tempo
   limite de 3 s, ignorando o erro (R2). Os dois e2e que saem da conta com a sessão compartilhada
   passam a entrar com login próprio, senão a revogação derruba a suíte (R3).
3. **#65** `redactAnalyticsUrl` tira query e hash e mascara `/convite/…` (R4). As telas de
   redefinir senha e confirmar e-mail guardam o token em estado e limpam a barra com
   `replaceState`, já que `useSearchParams` acompanha a barra (R5). As duas páginas ganham
   `referrer: "no-referrer"` (R6).
4. **#64** `headers()` em `next.config.ts` com 5 cabeçalhos para `/:path*` (R7,
   [contrato](contracts/security-headers.md)).
5. **#68** `friendlyMessage` só mostra o código bruto se ele casar `^[A-Z0-9_]{1,64}$` (R8).
   `httpsUrl()` filtra as URLs de foto de nota, avatar e nota da lista: só `https:`, ou `http:` em
   loopback para o desenvolvimento e o e2e (R9).

## Technical Context

**Language/Version**: TypeScript 5 (strict), Next.js 16.3 (App Router), Node 24

**Primary Dependencies**: `next` 16.3.8 (atualização); nenhuma dependência nova. Usa `URL`,
`AbortSignal.timeout` e `history.replaceState` da plataforma.

**Storage**: N/A

**Testing**: `pnpm test` (node:test em `lib/*.test.mjs` e `lib/api/*.test.mjs`); `pnpm test:e2e`
(Playwright, build de produção, API real atrás de `e2e/mock-api-proxy.ts`)

**Target Platform**: web (Next na Vercel)

**Project Type**: web application (front de `api-kottagroups`)

**Performance Goals**: saída da conta espera no máximo 3 s pela API (`LOGOUT_TIMEOUT_MS`)

**Constraints**: nenhuma mudança visível para quem usa; os e2e existentes continuam com as mesmas
expectativas (SC-007)

**Scale/Scope**: cerca de 12 arquivos de código, 3 de teste unitário e 4 de e2e, em 5 PRs pequenos

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Nota |
|-----------|--------|------|
| I. Simplicity First | ✅ | Sem dependência nova; menor versão corretiva do `next` (R1); `httpsUrl` e `e2e/sign-in.ts` só existem porque têm 3 e 4 usos reais (R9, R3); CSP completa fora do escopo. |
| II. Clean Code | ✅ | Constantes nomeadas (`LOGOUT_TIMEOUT_MS`, `ERROR_CODE_PATTERN`); o `.catch` do logout tem comentário com o porquê, e `apiRequest` já registra a falha no log (R2); nomes em inglês. |
| III. Organized Structure | ✅ | Cada regra fica no dono atual (`lib/invites.ts`, `lib/api/errors.ts`, `app/actions/auth.ts`, `next.config.ts`); um único arquivo novo em `lib/` (`https-url.ts`) com um único propósito. |
| IV. Best Practices | ✅ | Validação no limite de entrada (`?erro=`, URLs da API); `"use client"` só nas telas que já são cliente; docs instaladas do Next consultadas para `headers()` e `replaceState` (R5, R7). Sem arquivo `VERSION`, nada a incrementar. |
| V. Testable by Default | ✅ | Tabelas de [contracts/pure-rules.md](contracts/pure-rules.md) viram testes unitários; revogação e cabeçalhos ganham e2e. A atualização do `next` é coberta por lint, testes, build e e2e, sem teste próprio. A limpeza da barra (R5) fica sem teste automatizado porque exige um token real de e-mail; vale o roteiro do [quickstart](quickstart.md) §4.3. |

Pós-design: sem mudança; nenhuma violação.

## Project Structure

### Documentation (this feature)

```text
specs/023-reaudit-run2-hardening/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── security-headers.md
│   └── pure-rules.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
# US1 (#67)
package.json, pnpm-lock.yaml              # next + eslint-config-next 16.3.8

# US2 (#66)
app/actions/auth.ts                        # logoutAction: POST /auth/logout antes de clearSessionToken
e2e/sign-in.ts                             # novo: login reaproveitado
e2e/auth.setup.ts                          # usa sign-in.ts
e2e/access.spec.ts, e2e/errors.spec.ts     # testes de saída com login próprio + teste de revogação

# US3 (#65)
lib/invites.ts, lib/invites.test.mjs       # redactInviteUrl → redactAnalyticsUrl
components/app/vercel-insights.tsx         # usa redactAnalyticsUrl
components/forget-password/forget-password-screen.tsx   # token em estado + replaceState
components/confirm-email/confirm-email-screen.tsx       # idem
app/(acesso)/redefinir-senha/page.tsx      # referrer: "no-referrer"
app/(acesso)/confirmar-email/page.tsx      # idem

# US4 (#64)
next.config.ts                             # headers()
e2e/security-headers.spec.ts               # novo

# US5 (#68)
lib/api/errors.ts, lib/api/errors.test.mjs # ERROR_CODE_PATTERN no caso padrão
lib/https-url.ts, lib/https-url.test.mjs   # novo
components/app/invoice-photo.tsx
components/app/avatar.tsx
app/(conta)/grupos/[id]/listas/[listId]/page.tsx
```

Sem mudança: `app/sair/route.ts` (FR-006), `lib/api/server.ts`, `components/app/avatar-photo.tsx`,
`vercel.json`.

**Structure Decision**: app Next.js único na raiz; cada história mexe só nos arquivos do seu bloco
acima, e por isso pode virar um PR separado.

## Complexity Tracking

Sem violações.
