# Research: Cookie de sessão preso ao host, sempre seguro

Fontes lidas: `lib/api/session.ts`, `proxy.ts`, `app/sair/route.ts`, `app/actions/auth.ts`,
`lib/session-expiry.ts`, `e2e/errors.spec.ts`, `e2e/access.spec.ts`, `playwright.config.ts`,
`next.config.ts`, e o código instalado de `next@16.4.2` (`dist/compiled/@edge-runtime/cookies`,
`dist/server/send-response.js`, `dist/server/async-storage/request-store.js`) e de
`playwright-core@1.64.0` (`rewriteCookies`).

## R1. Apagar um cookie `__Host-`

- **Decision**: apagar o cookie novo sempre com `{ name, path: "/", secure: true }`, nunca com
  `delete(name)` puro.
- **Rationale**: no Next instalado, `delete(name)` vira `set({ name, value: "", expires: 1970 })`
  e o `normalizeCookie` só acrescenta `Path=/`. Sai `__Host-kotta_session=; Path=/; Expires=…`,
  sem `Secure`. O navegador recusa qualquer `Set-Cookie` com prefixo `__Host-` sem `Secure`, então
  o cookie **não seria apagado**: sair, sessão vencida e `/sair` deixariam a sessão viva. O
  `delete` aceita o objeto (`[args[0].name, args[0]]`), então basta passar as opções.
- **Alternatives considered**: `set(nome, "", { maxAge: 0, secure: true, path: "/" })` — igual em
  efeito, mais verboso.

## R2. Onde a migração do cookie antigo roda

- **Decision**: no `proxy.ts`. Quando a requisição tem só o cookie antigo com token não vencido,
  a resposta do proxy grava o novo (mesmo token, mesmo vencimento) e apaga o antigo.
- **Rationale**: Server Components (onde `getSessionToken` é lido em páginas e layouts) não podem
  gravar cookie. O proxy roda antes de toda página, Server Action (POST na rota da página) e de
  `/sair`; o matcher só deixa de fora `/api`, `_next` e estáticos. Ele já apaga o cookie vencido
  hoje, então ganha um caso, não um mecanismo novo.
- **Alternatives considered**: migrar só no próximo login — não cumpre FR-005 e mantém o antigo
  vivo por até 24 h; migrar em `getSessionToken` — impossível em render.

## R3. Leitura durante a transição

- **Decision**: uma função `readSessionToken(cookies)` que devolve o valor do cookie novo, ou o do
  antigo quando o novo está ausente ou vazio. Usada em `getSessionToken`, no proxy e em `/sair`.
- **Rationale**: o Next mescla nos `cookies()` do render o que o proxy gravou
  (`mergeMiddlewareCookies` via `x-middleware-set-cookie`), mas o próprio código tem um TODO
  dizendo que isso não cobre todo tipo de `Headers`, e `/api/notas/status` não passa pelo proxy.
  O fallback explícito não depende desse detalhe e cobre a primeira chamada a `/api` antes de
  qualquer navegação (edge case da spec).
- **Alternatives considered**: confiar só no merge do proxy — frágil e não cobre `/api`.

## R4. Ordem dos `Set-Cookie` quando proxy e rota mexem no mesmo cookie

- **Decision**: aceitar que o proxy migre também em `/sair` e em Server Actions; a rota/ação
  apaga depois e vale o último.
- **Rationale**: `send-response.js` faz `res.appendHeader("set-cookie", …)` para os cookies da
  rota depois dos que o proxy já pôs na resposta; o navegador aplica em ordem, então o "apagar" da
  rota vence o "gravar" do proxy. O e2e "sair com os dois cookies não deixa nenhum" (FR-009)
  prova o caso de ponta a ponta.
- **Alternatives considered**: pular a migração em `/sair` — mais um caso especial no proxy para
  um comportamento que já sai certo.

## R5. `secure` em todos os ambientes

- **Decision**: `secure: true` fixo, sem `NODE_ENV`.
- **Rationale**: o prefixo `__Host-` exige `Secure`; sem ele o navegador descarta o cookie e não
  há login. Chromium e Firefox tratam `http://localhost` como contexto seguro e aceitam `Secure`
  ali; o e2e roda em Chromium em `http://localhost:3002` e o `pnpm dev` em `http://localhost:3002`.
  Preview e produção são HTTPS. Safari em `http://localhost` pode recusar `Secure`: o login local
  falha de forma visível (edge case da spec); a orientação é usar Chromium/Firefox no dev.
- **Alternatives considered**: nome sem prefixo em dev — é a exceção por ambiente que o FR-002
  proíbe e esconderia bugs como o do R1.

## R6. Cookies `__Host-` no Playwright

- **Decision**: nos e2e, `context.addCookies` do cookie novo com `domain: "localhost"`,
  `path: "/"`, `secure: true` (não a forma `url`).
- **Rationale**: em `playwright-core@1.64.0`, a forma `url` força `secure = url.protocol ===
  "https:"`, ou seja `false` em `http://localhost`, e o Chromium recusa o `__Host-`. Com o par
  `domain`/`path`, `secure` é o que o teste passa. O `storageState` do setup grava o cookie que o
  app criou e o reaplica do mesmo jeito em todo teste logado, então a suíte inteira prova que o
  caminho funciona; se o Chromium recusar, todos os testes logados quebram na hora.
- **Verificação na implementação**: o primeiro e2e alterado roda antes dos demais (tarefa de
  teste falhando primeiro). Plano B se o `addCookies` do novo for recusado: semear só o cookie
  antigo nos testes de sessão vencida (o caminho do antigo vencido também é requisito, US2-AS2).
- **Cookie antigo nos testes**: `domain: "localhost"`, `path: "/"`, sem `secure`, como o app
  gravava em dev.

## R7. Fim da transição

- **Decision**: o PR cria uma issue "remover leitura de `kotta_session`" com a data mais cedo =
  deploy de produção + 7 dias.
- **Rationale**: o cookie antigo vence junto com o JWT (24 h, ou 24 h de `maxAge` sem `exp`);
  nenhum cookie antigo válido sobrevive a 24 h após o deploy, e o proxy já apaga os que aparecem.
  A folga de 7 dias cobre deploy em dia de pouco uso e quem só voltou depois (sem custo: o cookie
  antigo vencido só leva ao login, como hoje). Atende FR-008 (não antes de 24 h).
- **Alternatives considered**: remover no mesmo PR — desloga todos (motivo do adiamento).

## R8. Onde os nomes moram

- **Decision**: módulo novo `lib/session-cookie.ts`, sem `server-only`, com os dois nomes, as
  opções do cookie novo, `readSessionToken`, `clearSessionCookies` e a decisão pura do proxy.
  `lib/api/session.ts` usa o módulo; `proxy.ts` deixa a cópia local do nome.
- **Rationale**: `proxy.ts` não pode importar `lib/api/session.ts` (`server-only`, por isso a
  cópia do nome existe hoje). Três usos reais (sessão, proxy, `/sair`) — a regra de extrair na
  terceira ocorrência (Constituição I) — e o FR-007 pede o nome antigo num lugar só. Não há segredo
  no módulo; ele importa só `lib/session-expiry.ts`, que o proxy já usa.
- **Alternatives considered**: pôr em `lib/session-flow.ts` — ele trata destinos de redirect, não
  cookies; misturaria responsabilidades (Constituição III).
