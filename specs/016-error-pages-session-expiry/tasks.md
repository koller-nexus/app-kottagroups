---

description: "Tasks: páginas de erro padronizadas e logout automático quando a sessão expira (issue #12)"
---

# Tasks: Páginas de erro padronizadas e logout automático quando a sessão expira

**Input**: Design documents from `/specs/016-error-pages-session-expiry/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/session-expiry.md](./contracts/session-expiry.md),
[contracts/error-screens.md](./contracts/error-screens.md), [quickstart.md](./quickstart.md)

**Tests**: pedidos pela spec (FR-022) e pelo plano (Constituição V): `node --test` para regras puras
em `lib/` e Playwright para 404, cookie vencido e duas abas. Em cada história, o teste vem antes da
implementação.

**Regras do repo**: ler o guia em `node_modules/next/dist/docs/` antes de usar API do Next; `pnpm`;
sem dependência nova; `"use client"` só onde o plano lista; tokens `kotta-*` e classes
`primary-action`/`secondary-action`; identificadores em inglês; textos de UI em pt-BR, sentence case.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência pendente)
- **[Story]**: história da spec (US1–US6)

---

## Phase 1: Setup

- [X] T001 Criar a branch `feature/016-error-pages-session-expiry` a partir de `main`, rodar `pnpm test` e `pnpm lint` e anotar falhas pré-existentes (para não confundir com regressões desta feature)

---

## Phase 2: Foundational

**Purpose**: a regra de variante de erro e o componente visual único, usados por US2, US3, US5 e US6;
o cartão público, usado por US2 e US5.

- [X] T002 Escrever `lib/error-state.test.mjs` cobrindo `errorKind` e `apiErrorFromDigest` conforme `data-model.md`: `isOnline: false` → `"offline"` mesmo com digest de API; digest `API_ERROR:503:SERVICE_UNAVAILABLE` e `API_ERROR:200:NETWORK_ERROR` → `"unavailable"`; `API_ERROR:409:GROUP_ARCHIVED` → `"unexpected"` e `apiErrorFromDigest` devolve `{ status: 409, code: "GROUP_ARCHIVED" }`; digest hash `"1234567890"` ou ausente → `"unexpected"` e `apiErrorFromDigest` devolve `undefined`
- [X] T003 Criar `lib/error-state.ts` com `API_ERROR_DIGEST = "API_ERROR:"`, `UNAVAILABLE_CODES` (`NETWORK_ERROR`, `SERVICE_UNAVAILABLE`, `EDGE_BLOCKED`, `INTERNAL_ERROR`), `type ErrorKind = "not-found" | "session-expired" | "offline" | "unavailable" | "unexpected"`, `ERROR_COPY` com os títulos/textos da tabela "Copy" de `contracts/error-screens.md`, `apiErrorFromDigest(digest?)` (parse de `API_ERROR:<status>:<code>`) e `errorKind({ digest, isOnline })` na ordem offline → unavailable (status ≥ 500 ou código em `UNAVAILABLE_CODES`) → unexpected; `pnpm test` passa em T002
- [X] T004 Em `lib/api/errors.ts`, fazer `ApiError.digest` ser sempre `` `${API_ERROR_DIGEST}${status}:${code}` `` e importar `UNAVAILABLE_CODES` de `lib/error-state.ts` (remover a cópia local e o import de `lib/load-error.ts`); ajustar qualquer teste em `lib/api/*.test.mjs` que verifique o digest antigo `API_UNAVAILABLE:`
- [X] T005 [P] Criar `components/app/error-state.tsx` (Server Component, sem `"use client"`) com as props `kind`, `title?`, `text?`, `code?`, `primary`, `secondary?` de `contracts/error-screens.md`: cartão `rounded-card border border-kotta-border bg-kotta-surface`, glifo inline `aria-hidden` por `kind` (um `<svg>` pequeno, sem biblioteca), `<h1>` com o título (padrão `ERROR_COPY[kind].title`), `<p>` texto (padrão `ERROR_COPY[kind].text`), ações em coluna a 375px e em linha a partir de `sm:` com `min-h-11`, e `<p className="text-xs text-kotta-muted">Código: {code}</p>` só quando `code` existir
- [X] T006 [P] Criar `components/app/public-frame.tsx` (Server Component) com o `<main>` + `<section>` cartão + link do logo que hoje estão em `app/(acesso)/layout.tsx`, recebendo `children`; trocar `app/(acesso)/layout.tsx` para `<PublicFrame>{children}</PublicFrame>` sem mudar o visual de `/entrar`

**Checkpoint**: `pnpm test` e `pnpm lint` verdes; `/entrar` igual ao de antes.

---

## Phase 3: User Story 1 - A sessão vence e a pessoa é deslogada na hora, com aviso (P1) 🎯 MVP

**Goal**: cookie vencido (ou ausente) em rota protegida vai para `/entrar?motivo=expirada&next=…` com
o cookie apagado; o cookie vence junto com o token; com a aba aberta, aviso 2 min antes e logout
automático no horário e ao voltar do segundo plano.

**Independent Test**: quickstart §3 (cookie forjado com `exp` no passado) e §4; e2e
`e2e/errors.spec.ts` "cookie vencido".

### Tests for User Story 1

- [X] T007 [P] [US1] Escrever `lib/session-expiry.test.mjs` para `sessionExpiresAt`, `isSessionExpired` e `watcherDeadlines` (`contracts/session-expiry.md`): token com `exp` futuro devolve `exp * 1000`; `exp` em 10 s com folga de 30 s é vencido; `exp` em 60 s não é; tokens malformados (`"abc"`, duas partes, payload base64 inválido, payload sem `exp`, `exp` string) devolvem `undefined` e contam como vencidos; `isSessionExpired(undefined)` é `true`; `watcherDeadlines(300_000)` → `{ warnInMs: 180_000, expireInMs: 300_000 }`, `watcherDeadlines(60_000)` → `warnInMs: 0`, `watcherDeadlines(-5)` → ambos `0`, `watcherDeadlines(2**40)` → `expireInMs: 2**31 - 1`
- [X] T008 [P] [US1] Adicionar em `e2e/errors.spec.ts` (novo arquivo) o teste "cookie vencido leva para /entrar com aviso e apaga o cookie": num contexto novo, `context.addCookies` com `kotta_session` = JWT forjado (`base64url({alg:"HS256"}).base64url({exp: agora - 60}).x`), `page.goto("/grupos")`, esperar URL `/entrar?motivo=expirada&next=%2Fgrupos`, texto "Sua sessão expirou" visível e `context.cookies()` sem `kotta_session`; e o teste "cookie vencido em /entrar não volta para /": mesmo cookie, `goto("/entrar")`, URL continua em `/entrar`

### Implementation for User Story 1

- [X] T009 [US1] Criar `lib/session-expiry.ts` com `EXPIRY_LEEWAY_MS = 30_000`, `EXPIRY_WARNING_MS = 120_000`, `sessionExpiresAt(token)` (split por `.`, `atob` do payload base64url → JSON → `exp` numérico × 1000; qualquer falha → `undefined`), `isSessionExpired(token, now = Date.now())` (`undefined` ou `expiresAt - EXPIRY_LEEWAY_MS <= now`) e `watcherDeadlines(msLeft)` (`warnInMs = max(0, msLeft - EXPIRY_WARNING_MS)`, `expireInMs = max(0, min(msLeft, 2**31 - 1))`); sem `server-only` (roda no proxy, no servidor e no cliente); `pnpm test` passa em T007
- [X] T010 [US1] Em `lib/api/session.ts`, `setSessionToken` passa a usar `expires: new Date(expiresAt)` quando `sessionExpiresAt(token)` for definido e manter `maxAge: SESSION_MAX_AGE` só como fallback; comentar o porquê (cookie e JWT nunca desalinham)
- [X] T011 [US1] Em `proxy.ts`, implementar a tabela de `contracts/session-expiry.md`: `token = cookie`, `hasValidSession = token && !isSessionExpired(token)`; se há token e está vencido → resposta (redirect para `/entrar?motivo=expirada&next=…` em `PROTECTED`, `NextResponse.next` nas demais) com `response.cookies.delete(SESSION_COOKIE)`; sem token em `PROTECTED` → redirect com `motivo=expirada` (manter a exceção de `next` para `/confirme-seu-email`); `GUEST_ONLY` → `/` só quando `hasValidSession`; importar `SESSION_COOKIE` de `lib/api/session.ts` NÃO é possível (`server-only`), então manter a constante local; atualizar o comentário do topo
- [X] T012 [US1] Criar `components/app/session-watcher.tsx` (`"use client"`) com prop `msLeft: number`: `deadline = Date.now() + msLeft` guardado em `useRef` na montagem; `useEffect` que arma `setTimeout` para `warnInMs` (liga `warning` em `useState`) e para `expireInMs` (chama `signOut()`), escuta `visibilitychange` (quando `document.visibilityState === "visible"`) e `focus` para checar `Date.now() >= deadline` e re-armar os timers, e limpa tudo na desmontagem; `signOut()` faz `window.location.assign("/entrar?" + new URLSearchParams({ motivo: "expirada", next: location.pathname + location.search }))`; renderiza `<p role="status" className="mb-6 rounded-control border border-kotta-border bg-kotta-surface px-4 py-3 text-sm text-kotta-text">Sua sessão vai expirar em 2 minutos. Salve o que estiver fazendo.</p>` quando `warning`, senão `null`
- [X] T013 [US1] Em `app/(conta)/layout.tsx`, ler `getSessionToken()`, calcular `msLeft = (sessionExpiresAt(token) ?? 0) - Date.now()` e renderizar `<SessionWatcher msLeft={msLeft} />` dentro do `AppShell`, antes de `{children}` (o aviso aparece no topo do conteúdo); nunca passar o token
- [X] T014 [US1] Rodar `pnpm test:e2e e2e/errors.spec.ts e2e/access.spec.ts` e conferir que o teste "rota protegida leva para /entrar" de `e2e/access.spec.ts` continua passando (a regex `/\/entrar\?next=%2Fgrupos/` precisa casar com o `next` após `motivo`; se a ordem dos parâmetros quebrar a regex, montar a URL com `next` primeiro e `motivo` depois em `proxy.ts`)

**Checkpoint**: quickstart §3 e §4 passam; `access.spec.ts` continua verde.

---

## Phase 4: User Story 2 - Página não encontrada com a cara do Kotta Groups (P1)

**Goal**: `/qualquer-coisa` mostra 404 pública com logo e `noindex`; itens inexistentes na área logada
mostram 404 dentro do app, com "Esse item não existe ou você não tem acesso a ele."

**Independent Test**: quickstart §2; e2e "404 pública" e "404 no app".

### Tests for User Story 2

- [X] T015 [P] [US2] Adicionar em `e2e/errors.spec.ts` os testes: "rota inexistente mostra 404 pública" (contexto sem cookies, `goto("/qualquer-coisa")`, `h1` "Página não encontrada", link "Ir para o início", botão "Voltar", `title` contém "Página não encontrada — Kotta Groups", `meta[name=robots]` contém `noindex`, sem a barra de abas) e "grupo inexistente mostra 404 dentro do app" (sessão padrão, `goto("/grupos/00000000-0000-0000-0000-000000000000")`, `h1` "Página não encontrada", texto "Esse item não existe ou você não tem acesso a ele.", link "Ir para o Painel", e a navegação do app visível)

### Implementation for User Story 2

- [X] T016 [P] [US2] Criar `components/app/back-button.tsx` (`"use client"`) com prop `fallbackHref`: `<button type="button" className="secondary-action">Voltar</button>` que faz `history.length > 1 ? history.back() : location.assign(fallbackHref)`
- [X] T017 [US2] Criar `app/not-found.tsx` (Server Component `async`): `export const metadata: Metadata = { title: "Página não encontrada — Kotta Groups", robots: { index: false, follow: false } }`; lê `getSessionToken()` para rotular a ação primária ("Ir para o Painel" com sessão, "Ir para o início" sem), ambas `<Link href="/" className="primary-action">`; renderiza `<PublicFrame><ErrorState kind="not-found" primary={…} secondary={<BackButton fallbackHref="/" />} /></PublicFrame>`
- [X] T018 [P] [US2] Criar `app/(conta)/not-found.tsx` (Server Component) com `<ErrorState kind="not-found" text="Esse item não existe ou você não tem acesso a ele." primary={<Link href="/" className="primary-action">Ir para o Painel</Link>} secondary={<BackButton fallbackHref="/" />} />`; confirmar que as páginas que chamam `notFound()` (grupos, despesas, listas, notas, categorias) continuam tratando `403` como `404`
- [X] T019 [US2] Rodar `pnpm test:e2e e2e/errors.spec.ts` e conferir visualmente a 404 pública e a do app em 375px e desktop

**Checkpoint**: quickstart §2 passa.

---

## Phase 5: User Story 3 - Serviço fora do ar não vira um loop de redirecionamentos (P2)

**Goal**: `/sair` com a API indisponível volta para `next` mantendo o cookie; a página cai no boundary
"fora do ar" com "Tentar de novo".

**Independent Test**: quickstart §5; `lib/session-flow.test.mjs` para `logoutDestination`.

### Tests for User Story 3

- [X] T020 [P] [US3] Adicionar em `lib/session-flow.test.mjs` testes de `logoutDestination` conforme a tabela de `data-model.md`: `no-token` → `/entrar?motivo=expirada&next=%2Fgrupos`, `clearCookie: false`; `valid` → `/grupos`, `false`; `invalid` → `/entrar?motivo=envio&next=…`, `true`; `unknown` → `/grupos`, `false`; `motivo: "saiu"` ou `null` não vai para `/entrar`; `next: "/"` omite `next`

### Implementation for User Story 3

- [X] T021 [US3] Em `lib/session-flow.ts`, criar `logoutDestination({ check, next, motivo })` devolvendo `{ location, clearCookie }` conforme `contracts/session-expiry.md` (só `expirada` e `envio` são repassados como `motivo`); `pnpm test` passa em T020
- [X] T022 [US3] Em `app/sair/route.ts`, substituir a montagem manual de `entrar` e os `if`s por `logoutDestination` (`check` = `"no-token"` sem cookie, senão o resultado de `checkToken`), redirecionando para `location` (resolvido com `new URL(location, request.nextUrl)`) e apagando o cookie só quando `clearCookie`; atualizar o comentário explicando que `unknown` volta para `next` para não cair no pingue-pongue com o proxy
- [X] T023 [US3] Validar quickstart §5 com a API derrubada: `/sair?motivo=expirada&next=%2Fgrupos` volta para `/grupos` e mostra "O Kotta Groups está fora do ar" com "Tentar de novo" (ainda via `LoadError`, trocado em US5), sem passar por `/entrar`; "Sair da conta" continua indo para `/entrar?motivo=saiu`

**Checkpoint**: sem loop `/sair` ↔ `/entrar` ↔ `/`.

---

## Phase 6: User Story 4 - Sair em uma aba desloga as outras (P2)

**Goal**: sair ou vencer numa aba leva as outras para `/entrar` com o aviso certo.

**Independent Test**: quickstart §6; e2e "sair numa aba desloga a outra".

### Tests for User Story 4

- [X] T024 [P] [US4] Adicionar em `e2e/errors.spec.ts` o teste "sair numa aba desloga a outra": no mesmo contexto, `pageA.goto("/grupos")`, `pageB.goto("/perfil")`, clicar "Sair" em A, esperar `pageB` em `/entrar?motivo=saiu` (timeout 5 s)

### Implementation for User Story 4

- [X] T025 [US4] Em `components/app/session-watcher.tsx`, abrir `new BroadcastChannel("kotta-session")` no `useEffect` (guardar com `typeof BroadcastChannel !== "undefined"`) e no `onmessage` tratar `motivo: "saiu"` → `location.assign("/entrar?motivo=saiu")` e `motivo: "expirada"` → `/entrar?motivo=expirada&next=<própria rota>`; `channel.close()` na limpeza. Constantes e tipo em `lib/session-channel.ts`
- [X] T026 [US4] Criar `components/auth/signed-out-broadcast.tsx` (`"use client"`) que publica `{ type: "signed-out", motivo }` ao montar, e montá-lo em `app/(acesso)/entrar/page.tsx` quando `motivo` é `saiu` (→ `saiu`) ou `expirada`/`envio` (→ `expirada`). Avisar no clique em "Sair" criava corrida: a outra aba chegava em `/entrar` com cookie ainda válido e o proxy a devolvia para `/` (visto no e2e). `LogoutButton` e `logoutAction` não mudam
- [X] T027 [US4] Rodar `pnpm test:e2e e2e/errors.spec.ts` e validar quickstart §6 manualmente para o caso de expiração em duas abas (cookie forjado numa aba: a outra, ao receber a mensagem, vai para `/entrar?motivo=expirada&next=%2Fperfil`)

**Checkpoint**: duas abas sincronizadas.

---

## Phase 7: User Story 5 - Erros inesperados têm uma única tela, com código para suporte (P2)

**Goal**: `error.tsx` (raiz e `(conta)`) e o novo `global-error.tsx` usam `RouteError` → `ErrorState`;
variante por status/código do `digest`, `friendlyMessage` nos textos, "Código:" sempre que houver.

**Independent Test**: quickstart §7; `lib/error-state.test.mjs` (T002) já cobre a escolha da variante.

### Implementation for User Story 5

- [X] T028 [US5] Criar `components/app/route-error.tsx` (`"use client"`) com props `error`, `retry`, `homeHref`, `homeLabel`: `isOnline` via `useSyncExternalStore` (copiar `subscribeOnline` de `components/app/load-error.tsx`), `useEffect` com `console.error("[app] erro na tela", { digest, message })`, `kind = errorKind({ digest: error.digest, isOnline })`, `api = apiErrorFromDigest(error.digest)`, `text = api ? friendlyMessage(api.code) : undefined`, `code = api?.code ?? error.digest`; renderiza `<ErrorState kind text code primary={<button type="button" className="primary-action" onClick={() => retry()}>Tentar de novo</button>} secondary={kind === "unexpected" ? <Link href={homeHref} className="secondary-action">{homeLabel}</Link> : undefined} />`
- [X] T029 [P] [US5] Trocar `app/(conta)/error.tsx` para `<RouteError error={error} retry={retry} homeHref="/" homeLabel="Ir para o Painel" />` e `app/error.tsx` para o `<main>` atual com `<RouteError … homeHref="/" homeLabel="Ir para o início" />`
- [X] T030 [P] [US5] Criar `app/global-error.tsx` (`"use client"`) com `import "./globals.css"`, `<html lang="pt-BR" className="h-full antialiased"><body className="flex min-h-full flex-col bg-kotta-bg font-sans text-kotta-text">`, `<title>Algo deu errado — Kotta Groups</title>`, e o mesmo `<main>` + `<RouteError … homeHref="/" homeLabel="Ir para o início" />` de `app/error.tsx`
- [X] T031 [US5] Remover `components/app/load-error.tsx`, `lib/load-error.ts` e `lib/load-error.test.mjs`; `grep -rn "load-error\|LoadError\|API_UNAVAILABLE" app components lib e2e` não devolve nada; `pnpm lint`, `pnpm test` e `pnpm build` verdes
- [X] T032 [US5] Validar quickstart §7: `throw` temporário numa página de `(conta)` → "Algo deu errado", "Tentar de novo", "Ir para o Painel", "Código: <hash>" e `[app] erro na tela` no console; `throw` em `app/layout.tsx` → `global-error.tsx` com estilos do app; API respondendo 503 → "O Kotta Groups está fora do ar" com a mensagem de `friendlyMessage("SERVICE_UNAVAILABLE")`; remover os `throw` depois

**Checkpoint**: uma única tela de erro em todo o app; nenhum resto de `LoadError`.

---

## Phase 8: User Story 6 - Página "Sua sessão expirou" (P3)

**Goal**: `/sessao-expirada` abre logada ou não e "Entrar de novo" leva a `/entrar` preservando
`motivo` e `next`.

**Independent Test**: quickstart §8.

### Implementation for User Story 6

- [X] T033 [US6] Criar `app/(acesso)/sessao-expirada/page.tsx` (Server Component): `metadata.title = "Sua sessão expirou — Kotta Groups"`; lê `searchParams` (`next` via `safeNextPath`, `motivo` só se `"expirada"` ou `"envio"`, senão `"expirada"`); monta `href = "/entrar?" + new URLSearchParams({ motivo, ...(next !== "/" ? { next } : {}) })`; renderiza `<ErrorState kind="session-expired" primary={<Link href={href} className="primary-action">Entrar de novo</Link>} />` (o cartão vem do layout de `(acesso)`)
- [X] T034 [US6] Confirmar em `proxy.ts` que `/sessao-expirada` não está em `PROTECTED` nem em `GUEST_ONLY` e validar quickstart §8 logado e deslogado

**Checkpoint**: todas as histórias entregues.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T035 Conferir em 375px e desktop todas as telas da feature (404 pública, 404 no app, erro raiz, erro `(conta)`, `global-error`, `/sessao-expirada`, aviso do watcher): um único `h1`, foco visível com Tab nas ações, sem rolagem horizontal, `role="status"` no aviso (quickstart §9)
- [X] T036 [P] Revisar que nenhum componente novo além de `session-watcher.tsx`, `route-error.tsx`, `back-button.tsx`, `global-error.tsx` e os `error.tsx` tem `"use client"`, que `lib/api/session.ts` mantém `server-only`, e que nenhum lugar passa o token ao cliente (`grep -rn "getSessionToken" app components`)
- [X] T037 [P] Atualizar o comentário de abertura de `proxy.ts` e o JSDoc de `expiredSessionUrl`/`logoutDestination` em `lib/session-flow.ts` para refletir o fluxo final (cookie vencido no proxy, `unknown` volta para `next`)
- [X] T038 Rodar `pnpm lint && pnpm test && pnpm build` e a suíte completa `pnpm test:e2e`; abrir o PR `feature/016-error-pages-session-expiry` → `main` com Conventional Commits, referenciando a issue #12 e listando o que ficou fora (refresh token/"Continuar logado" depende de api-kottagroups#159; rascunho de formulários)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende da Phase 1; bloqueia US2, US3 (só a validação T023), US5 e US6.
  US1 e US4 não dependem dela, mas T001 vem antes de tudo.
- **US1 (Phase 3)**: depende só da Phase 1. É o MVP.
- **US2 (Phase 4)**: depende da Phase 2 (`ErrorState`, `PublicFrame`).
- **US3 (Phase 5)**: código depende só da Phase 1; a validação T023 usa o boundary existente.
- **US4 (Phase 6)**: depende de US1 (T012, o `SessionWatcher`).
- **US5 (Phase 7)**: depende da Phase 2 (T002–T005); T031 remove o `LoadError`, então US3/T023 deve
  ter sido validado antes ou revalidado depois.
- **US6 (Phase 8)**: depende da Phase 2 (`ErrorState`) e de T006 (layout de `(acesso)`).
- **Polish (Phase 9)**: depende de todas as histórias desejadas.

### Within Each User Story

- Testes (T002, T007, T008, T015, T020, T024) antes da implementação e falhando.
- `lib/` antes de componentes; componentes antes de arquivos de rota; validação por último.

### Parallel Opportunities

- Phase 2: T005 e T006 em paralelo após T003/T004.
- US1: T007 e T008 em paralelo; T010, T011 e T012 em arquivos diferentes podem ir em paralelo após T009.
- US2: T015, T016 e T018 em paralelo; T017 depende de T016.
- US3 e US4 podem andar em paralelo com US2 (arquivos diferentes).
- US5: T029 e T030 em paralelo após T028.
- Polish: T036 e T037 em paralelo.

---

## Parallel Example: User Story 1

```bash
# Testes primeiro, em paralelo:
Task: "Escrever lib/session-expiry.test.mjs"                  # T007
Task: "Adicionar e2e/errors.spec.ts (cookie vencido)"          # T008

# Depois de T009 (lib/session-expiry.ts), em paralelo:
Task: "lib/api/session.ts: expires do JWT"                     # T010
Task: "proxy.ts: cookie vencido"                               # T011
Task: "components/app/session-watcher.tsx"                     # T012
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 → Phase 3 (US1): logout automático e aviso em `/entrar`. Já fecha os quatro primeiros
   critérios de aceite da issue sem tocar nas telas de erro.
2. Validar com quickstart §3 e §4 e `e2e/errors.spec.ts`.

### Incremental Delivery

1. Phase 2 + US2 → 404 com a cara do Kotta (segundo P1).
2. US3 → sem loop com a API fora.
3. US4 → abas sincronizadas.
4. US5 → tela de erro única, `global-error`, remoção do `LoadError`.
5. US6 → `/sessao-expirada`.
6. Polish → PR.

Cada passo deixa o app funcional e os testes verdes.

---

## Notes

- Nada de `authInterrupts`, `global-not-found`, Sentry ou biblioteca de JWT (research R6, R8, R9).
- O token nunca sai do servidor: o cliente recebe só `msLeft`.
- Textos de UI estão em `contracts/error-screens.md`; não inventar variações.
- Marcar cada tarefa como `[X]` ao concluir.
