---

description: "Task list for 026-forward-client-ip"
---

# Tasks: Repassar o IP do navegador à API nas chamadas do servidor

**Input**: Design documents from `/specs/026-forward-client-ip/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/bff-client-ip.md, quickstart.md

**Tests**: pedidos pela spec (FR-009, FR-010) e pela Constituição V. Teste novo é escrito e visto
falhar antes da implementação da mesma história.

**Organization**: por história de usuário. US1 e US2 são P1 e saem juntas. A decisão dos
cabeçalhos (função pura) vem da Fase 2 e já garante a regra da US2 (valores do navegador nunca
usados) e da US3 (sem segredo, nada vai); as fases de história ligam essa decisão ao app e provam
cada uma ponta a ponta.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história da spec (US1–US3)

Nomes usados abaixo: cabeçalho de IP = `X-Kotta-Client-IP`, cabeçalho de segredo =
`X-Kotta-Bff-Secret`, variável = `KOTTA_BFF_SECRET`, segredo do e2e = `e2e-bff-secret`.

---

## Phase 1: Setup

- [X] T001 Branch `feature/026-forward-client-ip` criada a partir de `main` (Constituição: nada de commit direto em `main`); conferir `git status` sem mudanças fora de `specs/026-forward-client-ip/` e `.specify/feature.json`

---

## Phase 2: Foundational (bloqueia todas as histórias)

**Purpose**: a função pura que decide os cabeçalhos (data-model.md "Decisão por chamada", research R1/R3/R4).

- [X] T002 Criar `lib/api/client-ip.test.mjs` (node:test + `node:assert/strict`, importando `./client-ip.ts`, como `lib/api/errors.test.mjs`) com, usando `new Headers({...})` como requisição recebida: (a) `CLIENT_IP_HEADER === "X-Kotta-Client-IP"` e `BFF_SECRET_HEADER === "X-Kotta-Bff-Secret"`; (b) segredo `undefined` ou `""` → `{}` mesmo com `x-real-ip: 203.0.113.7`; (c) segredo `"s"` + `x-real-ip: 203.0.113.7` → `{ "X-Kotta-Client-IP": "203.0.113.7", "X-Kotta-Bff-Secret": "s" }`; (d) sem `x-real-ip`, `x-forwarded-for: "198.51.100.4, 10.0.0.1"` → IP `198.51.100.4` (primeiro item, com `trim`); (e) `x-real-ip` vence `x-forwarded-for` quando os dois existem; (f) IPv6 `2001:db8::1` passa como veio; (g) inválidos → `{}`: `"not-an-ip"`, `"203.0.113.7:443"`, `""`, nenhum dos dois cabeçalhos; (h) requisição recebida com `X-Kotta-Client-IP: 6.6.6.6` e `X-Kotta-Bff-Secret: forged` e `x-real-ip: 203.0.113.7`, segredo `"s"` → resultado usa `203.0.113.7` e `"s"` (valores do navegador ignorados, FR-002); a mesma requisição sem segredo → `{}`. Rodar `pnpm test` e ver falhar (módulo não existe)
- [X] T003 Criar `lib/api/client-ip.ts` (sem `server-only`, sem ler `process.env`; importa só `isIP` de `node:net`) com `CLIENT_IP_HEADER`, `BFF_SECRET_HEADER` (comentário: nomes propostos para api#250, ver `specs/026-forward-client-ip/contracts/bff-client-ip.md`) e `clientIpHeaders(incoming: Headers, secret: string | undefined): Record<string, string>`: sem segredo → `{}`; IP = `incoming.get("x-real-ip")` ou o primeiro item de `incoming.get("x-forwarded-for")`, com `trim`; só segue se `isIP(ip)` for 4 ou 6, senão `{}`; senão devolve os dois cabeçalhos. Comentário do porquê: a borda da Vercel sobrescreve `x-real-ip`/`x-forwarded-for`, então o navegador não escolhe o IP (research R1). Função curta, early returns. `pnpm test` passa (depende de T002)

**Checkpoint**: decisão pronta e testada; nenhum comportamento do app mudou ainda.

---

## Phase 3: User Story 1 - O limite de uma pessoa não derruba as outras (Priority: P1) 🎯 MVP

**Goal**: toda chamada servidor→API leva o IP do navegador e o segredo (FR-001).

**Independent Test**: com o mock da API, abrir página logada, entrar e passar por `/sair`; cada chamada recebida pela API traz os dois cabeçalhos (quickstart §2).

### Tests for User Story 1

- [X] T004 [P] [US1] Em `e2e/mock-api-proxy.ts`: lista de módulo `receivedHeaders: { path: string; clientIp?: string; secret?: string }[]`; antes do `fetch` ao upstream, empurrar `{ path: url.pathname, clientIp: req.headers["x-kotta-client-ip"], secret: req.headers["x-kotta-bff-secret"] }` (strings ou `undefined`) para toda requisição com `url.pathname` começando por `/api/v1/` (inclusive as respondidas pelos cenários simulados: registrar logo depois do teste de `/__mock/files`); `GET /__mock/last-headers` → `send(res, 200, { items: receivedHeaders })`; `DELETE /__mock/last-headers` → zera e `204`. Seguir o estilo de `/__mock/fail` (contracts/bff-client-ip.md "Mock e2e")
- [X] T005 [P] [US1] Em `playwright.config.ts`, no `webServer` do Next: `env: { API_ORIGIN: ..., KOTTA_BFF_SECRET: "e2e-bff-secret" }`; exportar `export const E2E_BFF_SECRET = "e2e-bff-secret"` e usar a constante no `env` (os specs importam dela, como `AUTH_FILE`)
- [X] T006 [US1] Criar `e2e/client-ip.spec.ts` (usar `test`/`expect` de `./fixtures`; `MOCK_API_PORT` de `./mock-api-port`; `E2E_BFF_SECRET` de `../playwright.config`; helpers `resetHeaders()` → `DELETE http://localhost:${MOCK_API_PORT}/__mock/last-headers` e `lastHeaders()` → `GET` do mesmo, via `request` do Playwright) com: (a) "página logada repassa IP e segredo": `resetHeaders()`, `page.goto("/")` logado, `lastHeaders()` não vazio e todo item com `secret === E2E_BFF_SECRET` e `clientIp` passando `isIP` (de `node:net`) em 4 ou 6; (b) "entrar repassa IP e segredo": contexto sem `storageState`, `resetHeaders()`, entrar pelo formulário como `signIn` em `e2e/access.spec.ts`, o item com `path === "/api/v1/auth/login"` tem os dois valores; (c) "/sair repassa IP e segredo": logado, `resetHeaders()`, `page.goto("/sair?motivo=expirada")`, existe item com `path === "/api/v1/users/me"` e os dois valores. Rodar `API_ORIGIN=… pnpm test:e2e e2e/client-ip.spec.ts` e ver falhar (depende de T004, T005)

### Implementation for User Story 1

- [X] T007 [US1] Em `lib/api/server.ts`: importar `clientIpHeaders` de `@/lib/api/client-ip`; nova `export async function bffHeaders(): Promise<Record<string, string>>` = `clientIpHeaders(await requestHeaders(), process.env.KOTTA_BFF_SECRET)` com docstring curta (segredo só no servidor, FR-004); em `apiRequest`, logo depois de `headers.set("Accept", …)`, `for (const [name, value] of Object.entries(await bffHeaders())) headers.set(name, value);` — `set`, depois dos cabeçalhos do chamador, para nenhum chamador sobrescrever (research R2). Não mexer em `browserHeaders()` de `app/actions/auth.ts` (FR-007) (depende de T003)
- [X] T008 [US1] Em `app/sair/route.ts`: importar `bffHeaders` de `@/lib/api/server`; em `checkToken`, `headers: { Accept: "application/json", Authorization: \`Bearer ${token}\`, ...(await bffHeaders()) }`. `pnpm test:e2e e2e/client-ip.spec.ts` passa (depende de T007)

**Checkpoint**: US1 entregue; com segredo, todas as chamadas do servidor levam IP e segredo.

---

## Phase 4: User Story 2 - Ninguém escolhe o próprio IP nem vê o segredo (Priority: P1)

**Goal**: valores do navegador nunca chegam à API e o segredo nunca chega ao navegador (FR-002, FR-004).

**Independent Test**: navegador com cabeçalhos forjados; API recebe só os valores do servidor; `e2e-bff-secret` ausente do que o navegador recebe.

### Tests for User Story 2

- [X] T009 [US2] Em `e2e/client-ip.spec.ts`, acrescentar: (a) "cabeçalhos forjados pelo navegador não chegam à API": `page.context().setExtraHTTPHeaders({ "X-Kotta-Client-IP": "203.0.113.9", "X-Kotta-Bff-Secret": "forged" })`, `resetHeaders()`, `page.goto("/")` logado; nos itens com `path` de chamadas do servidor (filtrar `path !== "/api/v1/users/recovery-email"`, que é chamada direta do navegador pelo rewrite e fica fora do escopo, spec Edge Cases), nenhum `clientIp === "203.0.113.9"` e todo `secret === E2E_BFF_SECRET`; (b) "o segredo não chega ao navegador": logado, ouvir `page.on("response")` coletando corpo (`await response.text()`, ignorando falhas de corpo) e `JSON.stringify(response.headers())` de documentos, scripts e `fetch`/RSC; `page.goto("/")` e `page.goto("/entrar")` em contexto sem sessão; nenhum texto coletado contém `E2E_BFF_SECRET` (FR-010, SC-003). Não forjar `x-forwarded-for`: fora da Vercel ele é aceito pelo Next (research R6). Rodar e ver passar; se (a) falhar, corrigir T007 (ordem do `set`)
- [X] T010 [US2] Conferir por busca no repositório que `KOTTA_BFF_SECRET` só é lido em `lib/api/server.ts` (fora `playwright.config.ts`, README e `specs/`), que nenhuma variável `NEXT_PUBLIC_*` o expõe e que `lib/api/client-ip.ts` não lê `process.env` (research R4); registrar o resultado no PR

**Checkpoint**: US1 + US2 = MVP de segurança fechado.

---

## Phase 5: User Story 3 - Sem segredo configurado, nada muda (Priority: P2)

**Goal**: sem `KOTTA_BFF_SECRET`, nenhum cabeçalho vai; em produção, um aviso por instância (FR-005, FR-006).

**Independent Test**: o caso (b) de T002 cobre a decisão; quickstart §3 cobre o app sem segredo.

### Implementation for User Story 3

- [X] T011 [US3] Em `lib/api/server.ts`, dentro de `bffHeaders()`: flag de módulo `let warnedMissingSecret = false` (estado do processo, não da requisição: research R5); se `!process.env.KOTTA_BFF_SECRET && process.env.VERCEL_ENV === "production" && !warnedMissingSecret`, marcar a flag e `console.warn("[api] client IP not forwarded: KOTTA_BFF_SECRET is not set")` (sem valores). Sem teste unitário: `server.ts` importa `server-only` e não carrega em `node --test`; motivo escrito no PR (Constituição V) (depende de T007)
- [X] T012 [US3] Validar quickstart §3: `pnpm build && API_ORIGIN=http://localhost:8085 pnpm start --port 3002` sem `KOTTA_BFF_SECRET`, abrir página logada e entrar; o app funciona como hoje e nenhum log de aviso aparece (não é `VERCEL_ENV=production`). Registrar no PR

**Checkpoint**: todas as histórias entregues.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T013 [P] Em `README.md`, na seção "Área logada (integrada à api-kottagroups)" logo após o parágrafo de `API_ORIGIN`: parágrafo curto sobre `KOTTA_BFF_SECRET` — para que serve (a API conta o limite pelo IP do navegador, api#250), só servidor (sem `NEXT_PUBLIC_`), configurar na Vercel em Production e Preview com o mesmo valor da API de cada ambiente, sem ele o app funciona como antes; e na seção "Testes E2E" uma linha dizendo que a suíte usa `e2e-bff-secret` (FR-011)
- [X] T014 Conferir o contrato fechado em api#250 (nomes dos cabeçalhos e mecanismo). Se diferir, ajustar só `lib/api/client-ip.ts`, `lib/api/client-ip.test.mjs`, `e2e/mock-api-proxy.ts` e `specs/026-forward-client-ip/contracts/bff-client-ip.md`; registrar no PR
- [X] T015 Rodar `pnpm lint`, `pnpm test`, `pnpm build` e `API_ORIGIN=http://localhost:8085 pnpm test:e2e` (suíte inteira, SC-005); tudo passa
- [ ] T016 Depois do merge (pessoa responsável pelo deploy): configurar `KOTTA_BFF_SECRET` na Vercel (Production e Preview) com o valor combinado com a API e validar quickstart §4 (logs da API com IPs variados; nenhum aviso "client IP not forwarded" nos logs da Vercel)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)**: feito.
- **Foundational (2)**: T002 → T003. Bloqueia T007.
- **US1 (3)**: T004 e T005 em paralelo (podem começar junto com a Fase 2); T006 depois dos dois; T007 depois de T003; T008 depois de T007.
- **US2 (4)**: T009 depois de T008 (mesmo arquivo de T006); T010 depois de T007.
- **US3 (5)**: T011 depois de T007 (mesmo arquivo); T012 depois de T011.
- **Polish (6)**: T013 a qualquer momento; T014 antes do merge; T015 por último no código; T016 depois do merge.

### Within Each User Story

- Teste escrito e visto falhar antes da implementação (T002 → T003, T006 → T007/T008).
- `lib/api/server.ts` é tocado por T007 e T011: em sequência.

### Parallel Opportunities

- T004, T005 e T002 (arquivos diferentes, sem dependência).
- T013 com qualquer tarefa.
- T010 com T009.

---

## Parallel Example: User Story 1

```text
Task: "T004 [US1] registrar x-kotta-* e expor /__mock/last-headers em e2e/mock-api-proxy.ts"
Task: "T005 [US1] KOTTA_BFF_SECRET no webServer do Next em playwright.config.ts"
Task: "T002 testes de clientIpHeaders em lib/api/client-ip.test.mjs"
```

---

## Implementation Strategy

### MVP (US1 + US2)

1. Fase 2 (T002–T003).
2. US1 (T004–T008): cabeçalhos chegam à API.
3. US2 (T009–T010): prova de que nada forjado entra e nada secreto sai.
4. Parar e validar: quickstart §1–§2.

### Incremental

- US3 (T011–T012) pode sair no mesmo PR; sem ela o app já funciona sem segredo (T003), falta só o
  aviso em produção.
- Polish antes de abrir o PR; T016 é operação pós-merge.

---

## Notes

- Fora do escopo: status em lote (research R7) e chamadas diretas do navegador pelo rewrite
  `/api/v1/*`.
- Commits em inglês, Conventional Commits (`feat(security): …`, `test(e2e): …`, `docs: …`).
