# Implementation Plan: Páginas de erro padronizadas e logout automático quando a sessão expira

**Branch**: `feature/016-error-pages-session-expiry` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-error-pages-session-expiry/spec.md` (issue #12)

## Summary

Uma função pura lê o `exp` do JWT sem verificar assinatura. O `proxy.ts` usa isso para apagar o
cookie vencido e mandar para `/entrar?motivo=expirada&next=…`; o cookie passa a vencer no mesmo
instante do token. Um `SessionWatcher` client no layout de `(conta)` recebe só o tempo restante,
avisa 2 min antes, desloga no horário e ao voltar do segundo plano, e sincroniza as outras abas por
`BroadcastChannel`. `/sair` com a API fora volta para `next` em vez de `/entrar`, e a página cai no
boundary "fora do ar" já existente. Um `ErrorState` único (Server Component) substitui o
`LoadError` e serve `not-found.tsx` (raiz e `(conta)`), `error.tsx`, `global-error.tsx` e
`/sessao-expirada`; `ApiError.digest` passa a carregar status e código para a tela escolher a
variante. Detalhes e alternativas em [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.3.5 (App Router, `proxy.ts` em Node runtime)

**Primary Dependencies**: as já instaladas (`next`, `react`, `server-only`); nenhuma nova. Sem
biblioteca de ícones no projeto: glifos inline mínimos.

**Storage**: N/A (sessão é o cookie `kotta_session` com o JWT da `api-kottagroups`)

**Testing**: `node --test` (`pnpm test`, `lib/**/*.test.mjs`) + Playwright (`pnpm test:e2e`) com o
proxy `e2e/mock-api-proxy.ts` e cookie forjado para o caso vencido

**Target Platform**: web (Vercel), mobile 375px e desktop; `BroadcastChannel`, `atob`,
`visibilitychange` nativos

**Project Type**: web app Next.js (frontend que fala com a API no servidor)

**Performance Goals**: zero chamadas extras à API para detectar expiração (decode local); logout
automático em ≤ 60 s do `exp` com a aba aberta e ≤ 5 s ao voltar do segundo plano (SC-002); outras
abas em ≤ 2 s (SC-004)

**Constraints**: token nunca chega ao cliente (só `msLeft`); cookie `httpOnly`; folga de 30 s;
`setTimeout` limitado a `2**31 - 1` ms; 403 continua virando 404; sem refresh token
(api-kottagroups#159) — nada de "Continuar logado"

**Scale/Scope**: 1 função de expiração, 1 mudança no proxy, 1 no cookie, 1 watcher client, 1
componente de erro + 1 wrapper client, 2 `not-found`, 1 `global-error`, 1 página
`/sessao-expirada`, 1 ajuste em `/sair`, 3 arquivos de teste, 1 spec e2e

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Situação |
|---|---|
| I. Simplicity First | ✅ Decode do JWT em ~15 linhas com `atob` (sem `jose`); `BroadcastChannel`, `setTimeout`, `visibilitychange` nativos; `/sair` reaproveita o boundary de erro em vez de nova tela; `not-found.tsx` nativo em vez de `global-not-found` experimental; `authInterrupts` rejeitado (R6). `PublicFrame` extraído só porque chega ao 3º uso. `LoadError`/`lib/load-error.ts` removidos. Sem Sentry. |
| II. Clean Code | ✅ Nomes de intenção (`sessionExpiresAt`, `isSessionExpired`, `watcherDeadlines`, `logoutDestination`, `errorKind`); constantes `EXPIRY_LEEWAY_MS`, `EXPIRY_WARNING_MS`, `API_ERROR_DIGEST`; token ilegível tratado explicitamente como vencido; sem booleano de comportamento (`homeHref`/`homeLabel` são dados). |
| III. Organized Structure | ✅ Regras puras em `lib/session-expiry.ts`, `lib/error-state.ts`, `lib/session-flow.ts`; UI em `components/app/`; arquivos de rota nos segmentos (`app/not-found.tsx`, `app/(conta)/not-found.tsx`, `app/(acesso)/sessao-expirada/`); `UNAVAILABLE_CODES` com um único dono. Sem barrel. |
| IV. Best Practices | ✅ `"use client"` só em `session-watcher.tsx`, `route-error.tsx`, `back-button.tsx` e nos boundaries (obrigatório); `ErrorState` e `not-found` são Server Components. `lib/api/session.ts` mantém `server-only`; o layout passa só `msLeft`. `safeNextPath` em todo `next`. Tokens `kotta-*`, `primary-action`/`secondary-action`. `h1`, foco visível, `role="status"`, glifo `aria-hidden`. Docs do Next 16 lidos (`not-found.md`, `error.md`, `proxy.md`, `unauthorized.md`, `authInterrupts.md`). `VERSION` não existe (R13). |
| V. Testable by Default | ✅ `node --test` para expiração (malformado = vencido, folga), prazos do watcher, variante por status/código e destino do `/sair`; e2e para 404 (2), cookie vencido e duas abas. Timer do watcher coberto pela função pura `watcherDeadlines` (R12). |

Resultado: sem violações. Re-checado após a Phase 1: mantém-se.

## Project Structure

### Documentation (this feature)

```text
specs/016-error-pages-session-expiry/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── session-expiry.md
│   └── error-screens.md
├── checklists/requirements.md
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
proxy.ts                                   # cookie vencido: apaga + /entrar?motivo=expirada; sem cookie em PROTECTED ganha motivo
next.config.ts                             # sem mudança (authInterrupts/globalNotFound rejeitados)

lib/
├── session-expiry.ts                      # NOVO: sessionExpiresAt, isSessionExpired, watcherDeadlines, constantes
├── session-expiry.test.mjs                # NOVO
├── session-flow.ts                        # + logoutDestination
├── session-flow.test.mjs                  # + casos de logoutDestination
├── error-state.ts                         # NOVO (substitui load-error.ts): ErrorKind, ERROR_COPY, errorKind, apiErrorFromDigest
├── error-state.test.mjs                   # NOVO (substitui load-error.test.mjs)
└── api/
    ├── errors.ts                          # ApiError.digest = API_ERROR:<status>:<code> sempre; UNAVAILABLE_CODES importado
    └── session.ts                         # setSessionToken: expires = exp do JWT

components/app/
├── error-state.tsx                        # NOVO: componente visual único (server)
├── route-error.tsx                        # NOVO: wrapper client dos boundaries (substitui load-error.tsx)
├── session-watcher.tsx                    # NOVO: client; timers, visibilitychange/focus, BroadcastChannel, aviso 2 min
├── back-button.tsx                        # NOVO: client; history.back() com fallback
├── public-frame.tsx                       # NOVO: cartão com logo extraído de (acesso)/layout.tsx
└── load-error.tsx                         # REMOVIDO
components/auth/logout-button.tsx          # onSubmit publica signed-out/saiu

app/
├── not-found.tsx                          # NOVO: 404 pública + metadata (title, robots noindex)
├── error.tsx                              # usa RouteError (Ir para o início)
├── global-error.tsx                       # NOVO: html/body próprios + RouteError
├── sair/route.ts                          # usa logoutDestination; "unknown" volta para next
├── (acesso)/
│   ├── layout.tsx                         # usa PublicFrame
│   └── sessao-expirada/page.tsx           # NOVO
└── (conta)/
    ├── layout.tsx                         # AppShell + SessionWatcher msLeft
    ├── not-found.tsx                      # NOVO: 404 dentro do app
    └── error.tsx                          # usa RouteError (Ir para o Painel)

e2e/
└── errors.spec.ts                         # NOVO: 404 pública/app, cookie vencido, duas abas
```

**Structure Decision**: app Next.js único, estrutura existente. Regras puras em `lib/` (testáveis
sem servidor), UI compartilhada em `components/app/`, arquivos de convenção do App Router nos
segmentos a que pertencem. Nada novo em `app/actions/` (`logoutAction` não muda).

## Complexity Tracking

Sem violações a justificar.
