---

description: "Task list for 025-host-session-cookie"
---

# Tasks: Cookie de sessão preso ao host, sempre seguro

**Input**: Design documents from `/specs/025-host-session-cookie/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/session-cookie.md, quickstart.md

**Tests**: pedidos pela spec (FR-009) e pela Constituição V. Teste novo é escrito e visto falhar
antes da implementação da mesma história.

**Organization**: por história de usuário. US1 e US2 são P1 e saem juntas. O fallback de leitura
do nome antigo vem da Fase 2, então a US1 sozinha não desloga ninguém, mas só a US2 passa o cookie
antigo para o novo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história da spec (US1–US4)

Nomes usados abaixo: novo = `__Host-kotta_session`, antigo = `kotta_session`.

---

## Phase 1: Setup

- [X] T001 Criar e trocar para a branch `feature/025-host-session-cookie` a partir de `main` (Constituição: nada de commit direto em `main`); conferir `git status` limpo

---

## Phase 2: Foundational (bloqueia todas as histórias)

**Purpose**: o módulo `lib/session-cookie.ts` que sessão, proxy e `/sair` vão usar (plan.md "Desenho", research R1/R3/R8).

- [X] T002 Criar `lib/session-cookie.test.mjs` (node:test + `node:assert/strict`, importando `./session-cookie.ts`, helper `token(payload)` igual ao de `lib/session-expiry.test.mjs`) com: (a) `SESSION_COOKIE === "__Host-kotta_session"` e `LEGACY_SESSION_COOKIE === "kotta_session"`; (b) `sessionCookieOptions(token({ exp }))` devolve exatamente `{ httpOnly: true, secure: true, sameSite: "lax", path: "/", expires: new Date(exp * 1000) }`, sem chave `domain`; (c) sem `exp` devolve `maxAge: 86400` no lugar de `expires`; (d) `readSessionToken` com um fake `{ get(name) }`: novo com valor → novo; novo ausente ou `""` + antigo com valor → antigo; os dois com valor → novo; nenhum ou ambos `""` → `undefined`; (e) `clearSessionCookies` com um fake que grava as chamadas de `delete`: recebe `{ name: "__Host-kotta_session", path: "/", secure: true }` e `"kotta_session"`; (f) `sessionCookieAction(atual, antigo, NOW)` cobre as 6 linhas da tabela "Estados da requisição" de `specs/025-host-session-cookie/data-model.md` (`antigo` `undefined` = ausente, `""` = presente vazio): sem sessão → `"none"`; antigo vazio → `"drop-legacy"`; vencida (incluindo token ilegível, em qualquer dos dois) → `"clear"`; só antiga válida → `"migrate"`; nova + antiga → `"drop-legacy"`; só nova → `"none"`. Rodar `pnpm test` e ver falhar (módulo não existe)
- [X] T003 Criar `lib/session-cookie.ts` (sem `server-only`; importa só `sessionExpiresAt` e `isSessionExpired` de `@/lib/session-expiry`) com: `SESSION_COOKIE`; `LEGACY_SESSION_COOKIE` com comentário "temporário (#84): lido só para não deslogar quem entrou antes do deploy; remover a partir da data da issue de acompanhamento" (FR-007); `SESSION_MAX_AGE = 24 * 60 * 60` movido de `lib/api/session.ts` com o comentário atual; `sessionCookieOptions(token)`; `readSessionToken(cookies: { get(name: string): { value: string } | undefined })` (regra de `contracts/session-cookie.md` "Leitura"); `clearSessionCookies(cookies: { delete(...) })` apagando o novo com `{ name: SESSION_COOKIE, path: "/", secure: true }` e o antigo com `delete(LEGACY_SESSION_COOKIE)` — comentário do porquê do `secure` (research R1); `sessionCookieAction(current, legacy, now = Date.now())` devolvendo `"none" | "clear" | "migrate" | "drop-legacy"`. Identificadores em inglês, funções curtas, sem flag booleana. `pnpm test` passa (depende de T002)

**Checkpoint**: módulo pronto e testado; nenhum comportamento do app mudou ainda.

---

## Phase 3: User Story 1 - Sessão nova não pode ser plantada por outro subdomínio (Priority: P1) 🎯 MVP

**Goal**: o app grava, lê e apaga só o cookie novo com os atributos do FR-001, em todo ambiente.

**Independent Test**: entrar e ver só `__Host-kotta_session` com Secure, HttpOnly, SameSite Lax, Path `/`, sem domínio (quickstart passos 1–2).

### Tests for User Story 1

- [X] T004 [P] [US1] Em `e2e/access.spec.ts`, no `describe("sair")` (que já usa `storageState` vazio): no teste "sair revoga a sessão na API", trocar `"kotta_session"` por `"__Host-kotta_session"`. Acrescentar o teste "entrar grava só o cookie novo, preso ao host": `signIn(page)`; `const cookies = await page.context().cookies()`; o cookie `__Host-kotta_session` existe com `secure: true`, `httpOnly: true`, `sameSite: "Lax"`, `path: "/"`, `domain: "localhost"`, `expires > Date.now() / 1000`; nenhum cookie `kotta_session` (FR-001, FR-009). Rodar `pnpm test:e2e e2e/access.spec.ts` e ver o teste novo falhar
- [X] T005 [P] [US1] Em `e2e/errors.spec.ts`: `SESSION_COOKIE = "__Host-kotta_session"`; `useExpiredSession` passa a usar `{ name: SESSION_COOKIE, value: expiredToken(), domain: "localhost", path: "/", secure: true }` (forma `domain`/`path`, não `url`: research R6); a asserção de cookie apagado checa que não sobra nem `__Host-kotta_session` nem `kotta_session`. Se o Chromium recusar o `addCookies` do novo, aplicar o plano B do R6 (semear só o antigo neste teste) e registrar no PR

### Implementation for User Story 1

- [X] T006 [US1] Em `lib/api/session.ts`: importar de `@/lib/session-cookie`; remover `export const SESSION_COOKIE` e `SESSION_MAX_AGE` locais; `getSessionToken` = `readSessionToken(await cookies())`; `setSessionToken` grava `cookies().set(SESSION_COOKIE, token, sessionCookieOptions(token))` e apaga o antigo com `delete(LEGACY_SESSION_COOKIE)` (contrato "Gravar": sem `NODE_ENV`, FR-002); `clearSessionToken` = `clearSessionCookies(await cookies())`; manter `server-only` e o comentário de vencimento junto do JWT (depende de T003)
- [X] T007 [P] [US1] Em `app/sair/route.ts`: importar `readSessionToken` e `clearSessionCookies` de `@/lib/session-cookie` (no lugar de `SESSION_COOKIE` de `@/lib/api/session`); `const token = readSessionToken(request.cookies)`; `if (clearCookie) clearSessionCookies(response.cookies)` (depende de T003)
- [X] T008 [US1] Em `proxy.ts`: apagar a constante local `SESSION_COOKIE` e o trecho do comentário do topo que a explica; `const token = readSessionToken(request.cookies)`; em `clearingExpiredCookie`, trocar `response.cookies.delete(SESSION_COOKIE)` por `clearSessionCookies(response.cookies)` (depende de T003). A migração fica para a US2
- [X] T009 [US1] Rodar `pnpm lint`, `pnpm test` e `pnpm test:e2e e2e/access.spec.ts e2e/errors.spec.ts`: T004 e T005 passam, e os testes de sair continuam passando

**Checkpoint**: login grava só o cookie novo; leitura já aceita o antigo (Fase 2), mas ainda não o migra.

---

## Phase 4: User Story 2 - Quem já estava logado continua logado (Priority: P1)

**Goal**: uma página aberta com só o cookie antigo válido sai logada e com o cookie novo (FR-004, FR-005).

**Independent Test**: só `kotta_session` com token válido → `/grupos` abre logada e depois só existe `__Host-kotta_session` com o mesmo valor e vencimento (quickstart passo 3).

### Tests for User Story 2

- [X] T010 [P] [US2] Em `e2e/access.spec.ts`, novo `test.describe("cookie antigo", …)` com `test.use({ storageState: { cookies: [], origins: [] } })` e o teste "cookie antigo válido continua logado e vira o novo": `signIn(page)`; ler `value` e `expires` do `__Host-kotta_session`; `context.clearCookies()`; `context.addCookies([{ name: "kotta_session", value, expires, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }])`; `page.goto("/grupos")`; `expect(page).toHaveURL(/\/grupos$/)`; depois, `__Host-kotta_session` com o mesmo `value` e `expires` igual ao lido (diferença ≤ 1 s) e nenhum `kotta_session` (US2-AS1, FR-009). Ver falhar
- [X] T011 [P] [US2] Em `e2e/errors.spec.ts`, no `describe("sessão vencida")`, o teste "cookie antigo vencido leva para /entrar com aviso e apaga o cookie": `addCookies` de `{ name: "kotta_session", value: expiredToken(), domain: "localhost", path: "/" }`; `goto("/grupos")`; mesmas asserções de URL (`motivo=expirada`, `next=/grupos`) e texto do teste existente; nenhum dos dois cookies sobra (US2-AS2)

### Implementation for User Story 2

- [X] T012 [US2] Em `proxy.ts`: calcular `const action = sessionCookieAction(request.cookies.get(SESSION_COOKIE)?.value, request.cookies.get(LEGACY_SESSION_COOKIE)?.value)`; substituir `clearingExpiredCookie(response, expired)` por `syncingSessionCookies(response, action, token)` que: `"clear"` → `clearSessionCookies(response.cookies)`; `"migrate"` → `response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(token))` e `response.cookies.delete(LEGACY_SESSION_COOKIE)`; `"drop-legacy"` → `response.cookies.delete(LEGACY_SESSION_COOKIE)`; `"none"` → nada. Aplicar em todas as respostas que o proxy devolve (redirect de rota protegida, redirect de `GUEST_ONLY` para `/`, e o `NextResponse.next`). Manter `expired`/`hasValidSession` derivados de `token` para o roteamento. Atualizar o comentário do topo: o proxy também passa o cookie antigo para o novo (research R2) (depende de T008)
- [X] T013 [US2] Rodar `pnpm test:e2e e2e/access.spec.ts e2e/errors.spec.ts`: T010 e T011 passam

**Checkpoint**: US1 + US2 = entregável mínimo em produção (ninguém deslogado, SC-002).

---

## Phase 5: User Story 3 - Sair apaga as duas sessões (Priority: P2)

**Goal**: nenhuma saída deixa cookie de sessão, de nome nenhum (FR-006). A implementação já veio de T006–T008 (`clearSessionCookies`); esta fase prova os casos com os dois cookies.

**Independent Test**: com os dois cookies, "Sair" não deixa nenhum e `/grupos` pede login (quickstart passo 5).

### Tests for User Story 3

- [X] T014 [P] [US3] Em `e2e/access.spec.ts`, no `describe("sair")`, o teste "sair com os dois cookies não deixa nenhum": `signIn(page)`; `addCookies` de `{ name: "kotta_session", value: "antigo", domain: "localhost", path: "/" }`; clicar `getByRole("button", { name: "Sair" })`; `expect(page).toHaveURL(/\/entrar\?motivo=saiu/)`; nenhum `__Host-kotta_session` nem `kotta_session` em `context.cookies()`; `goto("/grupos")` vai para `/entrar` (US3-AS1, FR-009; prova a ordem de `Set-Cookie` do research R4)
- [X] T015 [P] [US3] Em `e2e/access.spec.ts`, no mesmo `describe`, o teste "sessão recusada pela API em /sair apaga os dois cookies": `signIn(page)`; ler o `value` do novo; revogar com `fetch(\`${process.env.API_ORIGIN}/api/v1/auth/logout\`, { method: "POST", headers: { Authorization: \`Bearer ${value}\` } })`; `addCookies` do antigo com o mesmo `value`; `goto("/sair?motivo=expirada")`; URL em `/entrar`; nenhum dos dois cookies (US2-AS4, US3-AS2)

### Implementation for User Story 3

- [X] T016 [US3] Rodar `pnpm test:e2e e2e/access.spec.ts`. Se T014 ou T015 falhar, corrigir no ponto que apaga (`clearSessionCookies` em `lib/session-cookie.ts`, ou a ordem em `proxy.ts`/`app/sair/route.ts`) sem caso especial por rota, e registrar a causa em `specs/025-host-session-cookie/research.md` R4

**Checkpoint**: saídas cobertas com os dois nomes.

---

## Phase 6: User Story 4 - Fim da transição (Priority: P3)

**Goal**: a remoção do nome antigo fica agendada (FR-008). A remoção em si é outra entrega.

- [ ] T017 [US4] Depois do merge e do deploy em produção, abrir a issue `security(hardening): remover leitura do cookie kotta_session` com `gh issue create --label security`, corpo citando #84 e este PR, a data mais cedo = data do deploy + 7 dias (research R7), e o que remover: `LEGACY_SESSION_COOKIE`, o fallback de `readSessionToken`, os casos `"migrate"`/`"drop-legacy"` de `sessionCookieAction`, o `delete(LEGACY_SESSION_COOKIE)` em `lib/session-cookie.ts`/`lib/api/session.ts`/`proxy.ts` e os e2e T010, T011 e o cookie antigo de T014/T015
- [ ] T018 [US4] Pôr o número e a data da issue de T017 no comentário de `LEGACY_SESSION_COOKIE` em `lib/session-cookie.ts` (FR-007) num commit `docs:` no mesmo PR, se ainda aberto, ou num PR curto logo depois

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T019 [P] Em `README.md` linha 24, trocar por: o token JWT da API fica no cookie `__Host-kotta_session` (`httpOnly`, `Secure` também em dev, sem domínio; 24 h, igual ao token); acrescentar que no dev local é preciso Chromium ou Firefox, porque o Safari pode recusar `Secure` em `http://localhost` (research R5)
- [X] T020 [P] Em `content/legal/privacy-2026-10.tsx`, seção "cookies": trocar `kotta_session` por `__Host-kotta_session`, sem mudar o resto do texto (FR-010; o documento segue `draft: true`)
- [X] T021 Conferir com `git grep -n "kotta_session" -- ':!specs'` que o nome antigo só aparece em `lib/session-cookie.ts` (código) e nos e2e/README/política onde for o nome novo ou o teste do antigo (FR-007)
- [X] T022 Rodar `pnpm lint`, `pnpm test`, `pnpm build` e `pnpm test:e2e` inteiro (SC-005)
- [ ] T023 Validar à mão os passos 1–5 de `specs/025-host-session-cookie/quickstart.md` em `pnpm dev` com Chromium
- [X] T024 Abrir o PR para `main` com Conventional Commits, citando `Closes #84`, a decisão do R1 (apagar com `Secure`) e o passo pós-deploy T017

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependência
- **Foundational (Fase 2)**: depende de T001; bloqueia tudo
- **US1 (Fase 3)**: depende de T003
- **US2 (Fase 4)**: depende de T008 (mesmo arquivo `proxy.ts`); e2e de US2 podem ser escritos junto com os de US1
- **US3 (Fase 5)**: depende de T006–T008 e, para a ordem dos `Set-Cookie`, de T012
- **US4 (Fase 6)**: depende do merge e do deploy
- **Polish (Fase 7)**: T019–T021 a qualquer momento depois de T003; T022–T024 no fim

### Within Each User Story

- e2e novo escrito e visto falhar antes do código da história
- `lib/session-cookie.ts` antes de qualquer consumidor
- `proxy.ts`: T008 antes de T012 (mesmo arquivo)

### Parallel Opportunities

- T004 ∥ T005 (arquivos e2e diferentes)
- T006 ∥ T007 depois de T003; T008 em seguida (ou junto, outro arquivo)
- T010 ∥ T011; T014 e T015 no mesmo arquivo (sequenciais na escrita, [P] em relação ao resto)
- T019 ∥ T020

---

## Parallel Example: User Story 1

```bash
Task: "T004 e2e de login grava só o cookie novo em e2e/access.spec.ts"
Task: "T005 nome novo no e2e de sessão vencida em e2e/errors.spec.ts"

Task: "T006 lib/api/session.ts usa lib/session-cookie.ts"
Task: "T007 app/sair/route.ts usa readSessionToken e clearSessionCookies"
```

---

## Implementation Strategy

### MVP (US1 + US2)

1. Fase 1 e Fase 2
2. US1 (T004–T009) e US2 (T010–T013)
3. **Parar e validar**: quickstart passos 1–4; só então seguir
4. Esse é o mínimo que pode ir para produção (US1 sem US2 deixa o cookie antigo vivo até vencer)

### Incremental

1. US3 (T014–T016) prova as saídas com os dois nomes
2. Polish (T019–T024) e PR
3. Depois do deploy: US4 (T017–T018)

---

## Notes

- Nunca apagar o cookie novo com `delete(nome)` puro: sem `Secure` o navegador ignora (research R1)
- Nada de condição por ambiente nos atributos (FR-002)
- Commit por grupo lógico, em inglês, Conventional Commits
