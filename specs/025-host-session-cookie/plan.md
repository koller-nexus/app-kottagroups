# Implementation Plan: Cookie de sessão preso ao host, sempre seguro

**Branch**: `feature/025-host-session-cookie` (a criar a partir de `main` antes de implementar) |
**Date**: 2026-10-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/025-host-session-cookie/spec.md`

## Summary

Renomear o cookie de sessão para `__Host-kotta_session`, sempre `Secure`, `Path=/`, sem
`Domain`, em todos os ambientes (issue #84). Para não deslogar ninguém, durante a transição a
leitura aceita o nome antigo `kotta_session`, o `proxy.ts` regrava o antigo no novo na primeira
página e toda saída apaga os dois. Um módulo `lib/session-cookie.ts` concentra os nomes, as
opções e a decisão do proxy. Achado da pesquisa (R1): `cookies.delete(nome)` do Next não manda
`Secure`, o que impediria apagar o cookie `__Host-`; o apagar passa as opções explícitas.

## Technical Context

**Language/Version**: TypeScript 5 (strict), Node 20+, Bun no `dev`/`build`

**Primary Dependencies**: Next.js 16.4.2 (App Router, `proxy.ts`, `next/headers` `cookies()`),
React 19.2. Nenhuma dependência nova.

**Storage**: cookie no navegador (ver `data-model.md`); sem banco nem mudança na API

**Testing**: `pnpm test` (node:test, `lib/*.test.mjs`), `pnpm test:e2e` (Playwright 1.64,
Chromium, build de produção em `http://localhost:3002`)

**Target Platform**: Vercel (HTTPS em produção e Preview); dev em `http://localhost`

**Project Type**: web app Next.js (front da `api-kottagroups`)

**Performance Goals**: sem custo mensurável; o proxy já lê o cookie em toda página

**Constraints**: ninguém com sessão válida é deslogado (SC-002); atributos iguais em todo
ambiente (FR-002); `proxy.ts` não importa módulos `server-only`

**Scale/Scope**: 1 módulo novo + teste, 4 arquivos de código alterados, 2 specs e2e, README,
política de privacidade

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Situação |
|-----------|----------|
| I. Simplicity First | ✅ Sem dependência. Um módulo novo justificado por três usos reais (sessão, proxy, `/sair`) e pelo FR-007; elimina a cópia do nome em `proxy.ts`. A transição é temporária com remoção agendada (R7). |
| II. Clean Code | ✅ Nomes em inglês (`readSessionToken`, `clearSessionCookies`, `sessionCookieAction`); nomes de cookie como constantes; decisão do proxy numa função pura, sem flag booleana de comportamento. |
| III. Organized Structure | ✅ Cookie em `lib/session-cookie.ts` (uma responsabilidade); `lib/session-flow.ts` segue só com destinos. |
| IV. Best Practices | ✅ Segue o código instalado do Next (R1–R4); `server-only` mantido em `lib/api/session.ts`; o módulo novo não tem segredo. |
| V. Testable by Default | ✅ `lib/session-cookie.test.mjs` cobre leitura, opções e a tabela de estados; e2e do FR-009 cobre o navegador. |
| Workflow | ⚠️ Estamos em `main`: criar `feature/025-host-session-cookie` antes do primeiro commit. Lint, test, e2e e build no PR. |

Sem violações; Complexity Tracking vazio.

## Project Structure

### Documentation (this feature)

```text
specs/025-host-session-cookie/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── session-cookie.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
lib/
├── session-cookie.ts        # NOVO: SESSION_COOKIE, LEGACY_SESSION_COOKIE (temporário),
│                            #   sessionCookieOptions(token), readSessionToken(cookies),
│                            #   clearSessionCookies(cookies), sessionCookieAction(atual, antigo)
├── session-cookie.test.mjs  # NOVO
├── session-expiry.ts        # sem mudança (sessionExpiresAt, isSessionExpired)
└── api/
    └── session.ts           # usa o módulo; secure sempre; deixa de exportar SESSION_COOKIE
proxy.ts                     # tira a cópia local do nome; aplica sessionCookieAction
app/
├── sair/route.ts            # readSessionToken + clearSessionCookies
└── actions/auth.ts          # sem mudança (usa get/set/clearSessionToken)
e2e/
├── errors.spec.ts           # nome novo (domain/path/secure, R6) + caso do antigo vencido
└── access.spec.ts           # nome novo + 3 testes do FR-009
content/legal/privacy-2026-10.tsx  # nome do cookie
README.md                          # nome e atributos do cookie
```

**Structure Decision**: app Next.js único. A mudança é toda na camada de sessão existente
(`lib/`, `proxy.ts`, `app/sair`), sem nova rota nem componente.

### Desenho

- `sessionCookieOptions(token)`: `{ httpOnly: true, secure: true, sameSite: "lax", path: "/" }`
  mais `expires` do `exp` ou `maxAge` 24 h — a regra que hoje está em `setSessionToken`.
- `readSessionToken(cookies)`: aceita qualquer objeto com `get(name)` (o `request.cookies` do
  proxy/rota e o `cookies()` de `next/headers`); regra em `contracts/session-cookie.md` "Leitura".
- `clearSessionCookies(cookies)`: `delete({ name: SESSION_COOKIE, path: "/", secure: true })` e
  `delete(LEGACY_SESSION_COOKIE)` (R1).
- `sessionCookieAction(atual, antigo, now)`: devolve `"none" | "clear" | "migrate" |
  "drop-legacy"` conforme a tabela de `data-model.md`. O proxy troca `clearingExpiredCookie` por um
  passo que aplica essa ação em toda resposta que devolve (redirects e `next`).
- `setSessionToken`: grava o novo com `sessionCookieOptions` e apaga o antigo.
  `clearSessionToken`: `clearSessionCookies`. `getSessionToken`: `readSessionToken`.
- `LEGACY_SESSION_COOKIE` com comentário: temporário (#84), remover a partir da data da issue de
  acompanhamento (R7).

## Complexity Tracking

Nenhuma violação a justificar.

## Post-design Constitution Check

Reavaliado após `data-model.md`, `contracts/` e `quickstart.md`: continua sem violações. O único
ponto de atenção segue sendo criar a branch antes de commitar.
