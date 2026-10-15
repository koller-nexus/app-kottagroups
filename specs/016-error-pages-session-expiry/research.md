# Research: Páginas de erro padronizadas e logout automático

Fontes: docs instalados em `node_modules/next/dist/docs/01-app/03-api-reference/` (Next 16.3.5),
código atual (`proxy.ts`, `lib/api/*`, `lib/session-flow.ts`, `app/sair/route.ts`,
`components/app/load-error.tsx`), spec 015 (já mesclada).

## R1. Como saber que a credencial venceu sem chamar a API (FR-001, FR-002)

- **Decision**: função pura `sessionExpiresAt(token): number | undefined` em
  `lib/session-expiry.ts`: separa o JWT por `.`, decodifica o payload (base64url → `atob`), lê
  `exp` (segundos) e devolve milissegundos. Qualquer falha (partes faltando, base64 inválido, JSON
  inválido, `exp` não numérico) devolve `undefined`. `isSessionExpired(token, now)` trata
  `undefined` como vencido e aplica a folga `EXPIRY_LEEWAY_MS = 30_000`.
- **Rationale**: só leitura do payload; a assinatura continua sendo verificada pela API em toda
  chamada (`apiRequest`). `atob` existe no Node 16+ e no navegador, então a mesma função serve ao
  `proxy.ts` (Node runtime no Next 16, doc `proxy.md` "Runtime") e a um teste `node --test`.
  Token ilegível = vencido evita que um cookie corrompido deixe a pessoa presa numa tela "logada".
- **Alternatives considered**: `jose`/`jsonwebtoken` para decodificar: dependência nova para ~15
  linhas (Constituição I). Verificar assinatura no front: exigiria distribuir o segredo da API.

## R2. Onde aplicar a checagem: `proxy.ts` (FR-001, FR-003)

- **Decision**: `proxy.ts` passa a calcular `hasValidSession = cookie && !isSessionExpired(token)`.
  Com cookie vencido: a resposta apaga o cookie (`response.cookies.delete`) e, se a rota é
  protegida, redireciona para `/entrar?motivo=expirada&next=<path>`; em rota pública ou guest-only
  só apaga e segue como visitante (assim `/entrar` não é devolvido para `/`). Sem cookie em rota
  protegida, o redirect ganha `motivo=expirada` também.
- **Rationale**: cobre os três buracos da spec (cookie vencido presente, cookie sumido, pingue-pongue
  `/entrar` ↔ `/`) num único lugar que já roda em toda requisição. Com o cookie alinhado ao `exp`
  (R3), "cookie sumiu" passa a significar "sessão venceu", então o aviso é correto; um visitante que
  digita `/grupos` sem nunca ter entrado também vê "Sua sessão expirou", que é um custo aceitável
  frente a manter o `/entrar` mudo para quem de fato perdeu a sessão.
- **Alternatives considered**: checar `exp` só no `apiRequest`: não cobre páginas sem chamada e não
  consegue apagar o cookie (só Route Handler/Server Action/proxy). `experimental.authInterrupts`
  (`unauthorized()` + `app/unauthorized.tsx`): ver R6.

## R3. Cookie com o mesmo vencimento do token (FR-003)

- **Decision**: `setSessionToken` usa `expires: new Date(sessionExpiresAt(token))` quando o `exp`
  for legível e cai para o `maxAge` de 24 h atual quando não for.
- **Rationale**: elimina o desalinhamento que hoje produz `/entrar` sem aviso. O fallback mantém o
  login funcionando se a API um dia emitir token sem `exp`.
- **Alternatives considered**: manter `maxAge` fixo: é a causa do problema.

## R4. Logout automático com a aba aberta (FR-004 a FR-007)

- **Decision**: `components/app/session-watcher.tsx` (`"use client"`), montado em
  `app/(conta)/layout.tsx`. O layout (Server Component) lê o token com `getSessionToken()` e passa
  só `msLeft = expiresAt - Date.now()` (número; token nunca vai ao cliente). No cliente:
  `deadline = Date.now() + msLeft` na montagem (relativo ao relógio do próprio dispositivo, então
  diferença de relógio com o servidor não importa); `setTimeout` para `deadline` (limitado a
  `2**31 - 1` ms) e outro para `deadline - 2 min` que liga o aviso `role="status"` "Sua sessão vai
  expirar em 2 minutos. Salve o que estiver fazendo."; em `visibilitychange` (visível) e `focus`
  reavalia `Date.now() >= deadline` e re-arma os timers (o navegador suspende timers em segundo
  plano). Ao vencer: publica `{ type: "signed-out", motivo: "expirada" }` no `BroadcastChannel`
  (R7) e faz `window.location.assign("/entrar?motivo=expirada&next=<pathname+search>")`.
- **Rationale**: navegação completa (não `router.push`) garante que o `proxy.ts` rode, veja o cookie
  vencido (folga de 30 s já passou) e o apague na mesma resposta, sem chamar a API. Nenhuma
  biblioteca; só `setTimeout`, `visibilitychange`, `focus`.
- **Alternatives considered**: navegar para `/sair?motivo=expirada`: faz uma chamada à API que, se
  estiver fora, devolve "unknown"; com R5 isso voltaria para a página e o watcher dispararia de
  novo. Passar `expiresAt` absoluto: sensível a relógio adiantado no cliente (dispararia cedo, o
  proxy veria a sessão válida, devolveria para `/` e o watcher dispararia de novo).
  `setInterval` de 1 s: desperdício; os dois timers + reavaliação ao focar bastam. Aviso com botão
  "Continuar": depende de refresh token (api-kottagroups#159), fora de escopo.

## R5. `/sair` com a API fora do ar (FR-010, FR-011)

- **Decision**: no caso `"unknown"`, `/sair` redireciona de volta para `next` (sem apagar o
  cookie, sem passar por `/entrar`). A página de destino chama a API, falha com `NETWORK_ERROR`/5xx
  e cai no boundary de erro já existente com a variante "fora do ar" e "Tentar de novo" (o `retry()`
  re-renderiza a página). A decisão de destino vira a função pura
  `logoutDestination({ check, next, motivo })` em `lib/session-flow.ts`, coberta por teste
  (FR-022). `logoutAction` (POST) não muda: apaga o cookie local sem consultar a API.
- **Rationale**: é o caminho mais curto que satisfaz a spec reutilizando o boundary de erro; sem
  loop porque `next` é uma página, não um redirect. Se o token também estiver vencido por `exp`, o
  `proxy.ts` (R2) intercepta antes e manda para `/entrar` com aviso.
- **Alternatives considered**: renderizar a tela "fora do ar" dentro do Route Handler: handler não
  renderiza React; redirecionar para `/sessao-expirada`: mentiria (a sessão pode estar válida).

## R6. `experimental.authInterrupts` (`unauthorized()`) como alternativa ao redirect

- **Decision**: não adotar nesta entrega.
- **Rationale**: a doc marca `authInterrupts` como `version: canary`/experimental e exige flag em
  `next.config.ts`. `app/unauthorized.tsx` renderiza dentro do layout da rota, mas o layout de
  `(conta)` (`AppShell`) chama `getMe()` e falharia antes; e nenhum deles apaga o cookie, que só um
  Route Handler, Server Action ou o proxy conseguem. O fluxo atual (`apiRequest` → `/sair` →
  `/entrar?motivo=…`) já está testado e cobre o 401 vindo da API.
- **Alternatives considered**: `forbidden()` para 403: a spec mantém 403 → 404 de propósito.

## R7. Logout em outras abas (FR-008)

- **Decision**: `BroadcastChannel("kotta-session")` dentro do `SessionWatcher`. Mensagem
  `{ type: "signed-out", motivo: "saiu" | "expirada" }`. Emissor: `SignedOutBroadcast`,
  montado em `/entrar` quando há `motivo` (cookie já apagado; avisar no clique em "Sair" ou no
  timer criava uma corrida em que a outra aba chegava em `/entrar` com sessão válida e era devolvida
  para `/`). Receptor: o watcher de cada aba, que faz `location.assign("/entrar?motivo=<motivo>&next=<própria rota>")`
  (para `saiu`, sem `next`, igual ao `logoutAction`). Abas em `/entrar` não têm watcher, logo não
  há cascata.
- **Rationale**: API nativa, suportada em todos os navegadores atuais; sem `storage` event hacks.
- **Alternatives considered**: evento `storage` em `localStorage`: funciona, mas exige gravar e
  limpar chave e é menos legível. Polling do cookie: `httpOnly`, invisível ao JS.

## R8. Um componente de erro para tudo (FR-016 a FR-020)

- **Decision**:
  - `lib/error-state.ts` substitui `lib/load-error.ts`: `type ErrorKind = "not-found" |
    "session-expired" | "offline" | "unavailable" | "unexpected"`, `errorKind({ digest, isOnline })`
    e `ERROR_COPY[kind] = { title, text }`. `ApiError.digest` passa a ser sempre
    `API_ERROR:<status>:<code>` (hoje só para indisponibilidade). `errorKind` lê status/código do
    digest: ≥ 500 ou código em `UNAVAILABLE_CODES` → `unavailable`; outro código da API →
    `unexpected` com descrição `friendlyMessage(code)`; sem digest da API → `unexpected` com o texto
    padrão. Teste `lib/error-state.test.mjs` cobre a escolha por código/status.
  - `components/app/error-state.tsx` (Server Component, sem estado): `ErrorState({ kind, title?,
    text?, code?, primary, secondary? })`, renderiza glifo inline por `kind`, `h1`, descrição, ações
    e "Código: {code}" discreto. Usado por 404, sessão expirada e boundaries.
  - `components/app/route-error.tsx` (`"use client"`): o que `LoadError` faz hoje (online/offline
    via `useSyncExternalStore`, `console.error` com `digest`) + escolha da variante + `ErrorState`
    com "Tentar de novo" (`retry()`) e "Ir para o Painel"/"Ir para o início" (`homeHref`). Usado por
    `app/error.tsx`, `app/(conta)/error.tsx` e `app/global-error.tsx`.
  - `components/app/load-error.tsx` e `lib/load-error.ts` são removidos (deleção sobre adição).
- **Rationale**: em produção o Next só manda `digest` ao cliente e respeita um `digest` já presente
  (spec 015, R3); carregar status+código no digest é a única forma de a tela escolher a mensagem
  por código sem vazar a mensagem bruta do servidor. Um componente visual + um wrapper client mantém
  `"use client"` no menor componente possível (Constituição IV).
- **Alternatives considered**: manter `LoadError` e criar outro componente para 404: duplicaria
  layout e textos. Sentry no front: dependência nova, não configurada no projeto; `console.error` +
  `digest` já liga ao log da Vercel.

## R9. Páginas 404 (FR-012 a FR-015)

- **Decision**:
  - `app/not-found.tsx` (Server Component): atende rota inexistente em todo o app (doc
    `not-found.md`: "the root `app/not-found.js` … handle any unmatched URLs"). Renderiza dentro de
    `PublicFrame` (ver abaixo) a variante `not-found` com "Ir para o início" (`/`) e "Voltar"
    (`history.back()`, com fallback para `/` quando não há histórico, num botão client mínimo
    `components/app/back-button.tsx`). Exporta `metadata = { title: "Página não encontrada — Kotta
    Groups", robots: { index: false, follow: false } }` (suportado em `not-found.js`, doc linha 84).
    Lê o cookie de sessão para rotular a ação como "Ir para o Painel" quando há sessão; o destino
    é `/` nos dois casos (que já decide painel vs. landing).
  - `app/(conta)/not-found.tsx`: atende `notFound()` dos recursos; renderiza dentro do `AppShell`
    (cabeçalho + abas vêm do layout) com o texto "Esse item não existe ou você não tem acesso a
    ele." e ações "Ir para o Painel" e "Voltar". `notFound()` já injeta `noindex`.
  - 403 → 404 continua como está nas páginas.
  - `PublicFrame` (`components/app/public-frame.tsx`, Server Component): o cartão com logo que hoje
    vive em `app/(acesso)/layout.tsx`, extraído porque passa a ter três usos (layout de acesso,
    `app/not-found.tsx`, `app/global-error.tsx`). `(acesso)/layout.tsx` passa a usá-lo.
- **Rationale**: `global-not-found.js` é experimental e exige flag; o root `not-found.tsx` já cobre
  URLs não casadas e renderiza dentro do root layout (fontes e `globals.css` incluídos).
- **Alternatives considered**: catch-all `app/(conta)/[...rest]/page.tsx` para mostrar 404 com
  abas em `/grupos/abc/xyz`: capturaria também `/qualquer-coisa` de visitantes e o `AppShell`
  chamaria `getMe()`, mandando quem não tem conta para `/entrar` por causa de um erro de digitação.
  Rejeitado; a spec foi ajustada: URL não casada mostra a página pública, com "Ir para o Painel"
  quando há sessão.

## R10. `global-error.tsx` (FR-019)

- **Decision**: `app/global-error.tsx` (`"use client"`) com `<html lang="pt-BR">`/`<body>` próprios,
  `import "./globals.css"`, `<title>` via React e `RouteError` com `homeHref="/"`. Sem a fonte
  `DM_Mono` (só é usada em chaves/valores; o erro não os mostra).
- **Rationale**: doc `error.md` "Global Error": substitui o root layout, precisa do próprio
  documento e não suporta `metadata`.
- **Alternatives considered**: nenhuma; é o único mecanismo para falha no root layout.

## R11. Página `/sessao-expirada` (FR-021)

- **Decision**: `app/(acesso)/sessao-expirada/page.tsx` (Server Component) dentro do layout de
  acesso (cartão com logo). Lê `next` e `motivo` dos `searchParams` (`safeNextPath`), mostra a
  variante `session-expired` e o link "Entrar de novo" para `/entrar?motivo=<expirada|envio>&next=…`.
  Não entra em `PROTECTED` nem em `GUEST_ONLY`, então abre logada ou não.
- **Rationale**: reusa layout e `loginNotice` existentes; zero lógica nova além de montar a URL.
- **Alternatives considered**: rota em `app/sessao-expirada/` fora do grupo: perderia o cartão.

## R12. Testes (FR-022)

- **Decision**:
  - `lib/session-expiry.test.mjs`: `exp` futuro/passado, folga de 30 s, token malformado/sem
    `exp`/base64 inválido = vencido.
  - `lib/error-state.test.mjs` (substitui `load-error.test.mjs`): offline vence tudo; digest com
    status ≥ 500 ou código indisponível → `unavailable`; código conhecido → `unexpected` com
    `friendlyMessage`; sem digest → `unexpected`.
  - `lib/session-flow.test.mjs`: `logoutDestination` para `valid` (volta a `next`), `invalid`
    (`/entrar` com motivo/next), `unknown` (volta a `next`, cookie mantido) e sem token.
  - e2e (`e2e/errors.spec.ts`): cookie `kotta_session` forjado com `exp` no passado → `/grupos`
    cai em `/entrar?motivo=expirada&next=%2Fgrupos` e o cookie some; `/qualquer-coisa` e
    `/grupos/00000000-0000-0000-0000-000000000000` mostram os dois 404; sair numa aba leva a outra
    a `/entrar`. O timer do watcher não é testado em e2e (precisaria de token válido com `exp`
    curto); a lógica de prazo fica numa função pura `watcherDeadlines(msLeft)` testada em
    `lib/session-expiry.test.mjs`.
- **Rationale**: Constituição V; tudo roda em `pnpm test` sem servidor.
- **Alternatives considered**: mockar a API para emitir token curto: o proxy de e2e só intercepta
  caminhos específicos e o login do setup usa a API real.

## R13. `VERSION`

- **Decision**: não existe arquivo `VERSION` no repositório (spec 015, R9); nenhuma ação.
