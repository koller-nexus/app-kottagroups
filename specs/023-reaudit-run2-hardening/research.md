# Research: Endurecimento da re-auditoria (run-2)

Fontes: issues #63–#68, código em `main` @ 0a447ac, docs instaladas do Next em
`node_modules/next/dist/docs/`.

## R1. Versão do `next` (#67)

- **Decision**: `next` e `eslint-config-next` 16.3.5 → **16.3.8**, a menor versão que corrige as
  vulnerabilidades. Depois de `pnpm install`, conferir com `pnpm audit --prod`. `next@16.3.8`
  declara `sharp@^0.35.4` e `postcss@8.5.23` (que pede `source-map-js@^1.2.1`). As duas faixas
  aceitam as versões corrigidas (`sharp` 0.35.5, `source-map-js` 1.2.2), mas o lockfile pode
  continuar na versão antiga. Se o audit ainda acusar alguma delas, subir só essa dependência
  transitiva no lockfile com `pnpm update <pkg>`. `pnpm.overrides` com o piso corrigido fica como
  último recurso.
- **Rationale**: é uma correção dentro da mesma linha 16.3, com o menor risco de mudar
  comportamento (SC-007). A 16.4.x é uma versão minor e traria mudanças fora do escopo.
- **Alternatives**: `latest` (16.4.2), rejeitada por ser minor; só overrides sem atualizar o
  `next`, rejeitada porque a crítica e a alta são do próprio `next`.

## R2. Encerrar a sessão na API ao sair (#66)

- **Decision**: em `logoutAction` (`app/actions/auth.ts`), antes de `clearSessionToken()`, ler o
  token e, se houver, chamar
  `apiRequest("/auth/logout", { method: "POST", auth: false, headers: { Authorization: \`Bearer ${token}\` }, signal: AbortSignal.timeout(LOGOUT_TIMEOUT_MS) })`
  com `.catch(() => {})`. `LOGOUT_TIMEOUT_MS = 3000`.
- **Rationale**:
  - Com `auth: false`, o 401 (sessão já expirada) não dispara o `redirect()` interno de
    `apiRequest` para a tela de sessão expirada. Esse redirect lança uma exceção de controle do
    Next que seria engolida pelo `catch` e mudaria o destino da saída (FR-005).
  - Hoje `apiRequest` não tem tempo limite. O `signal` passa direto para o `fetch` (`...rest`);
    se o tempo acabar, o `fetch` lança, `apiRequest` registra o erro no log e lança `ApiError`
    `NETWORK_ERROR`, que o `catch` absorve (Edge Case "API lenta").
  - Ignorar o erro não perde dado: a saída local sempre acontece, e `apiRequest` já registra a
    falha no log. Um comentário curto explica o porquê (Constituição II).
  - Resposta 204 já é tratada por `apiRequest`.
- **Alternatives**: `fetch` direto como em `app/sair/route.ts`, rejeitado porque duplicaria
  origem, cabeçalhos e log que `apiRequest` já faz; `auth: true` com `catch` amplo, rejeitado
  porque engole o redirect.
- **`/sair` (GET) não muda** (FR-006): ele só apaga o cookie quando a API já diz que o token não
  vale.

## R3. Testes e2e que saem da conta com a sessão compartilhada

- **Finding**: `e2e/access.spec.ts` ("sair encerra a sessão") e `e2e/errors.spec.ts` ("sair numa
  aba desloga a outra") clicam em "Sair" usando a sessão salva por `auth.setup.ts`. O comentário
  deles ("Logout only clears this context's cookie, so the shared session file stays valid") deixa
  de valer: com R2, a API revoga essa sessão e todos os testes seguintes (1 worker, sessão única)
  passariam a falhar.
- **Decision**: esses dois testes passam a usar `test.use({ storageState: { cookies: [], origins: [] } })`
  e entram com o próprio login. O passo de login (e-mail, senha, "Entrar") sai de `auth.setup.ts`
  para um helper `e2e/sign-in.ts`. Com o setup, os dois testes de saída e o teste novo de
  revogação, são quatro usos, o que justifica extrair (Constituição I, "extract on the third real
  use").
- **New e2e**: entrar, ler o cookie `kotta_session` com `context.cookies()`, clicar em "Sair" e
  chamar `GET ${API_ORIGIN}/api/v1/users/me` com o bearer antigo. Espera 401 (SC-002).

## R4. Analytics sem token (#65)

- **Decision**: trocar `redactInviteUrl` por `redactAnalyticsUrl(url)` em `lib/invites.ts`:
  `url.split(/[?#]/, 1)[0].replace(/\/convite\/.*/, "/convite/[token]")`. Ela é usada nos dois
  `beforeSend` de `components/app/vercel-insights.tsx`.
- **Rationale**: o token aparece no caminho do convite e, codificado, em `?next=` de
  `/entrar`/`/cadastrar`; os tokens de redefinição e confirmação vão em `?token=`. Tirar toda a
  query (e o hash) cobre todos os casos sem lista de parâmetros. O painel perde a query, que não é
  usada para nada. Os tipos instalados mostram que o evento do Analytics só tem `url` e o do
  SpeedInsights tem `url` e `route`. `route` é o padrão da rota (`/convite/[token]`), sem segredo,
  então FR-007 ("campos de URL e de caminho") se resume a `url`. A versão só com strings não falha
  em URL malformada.
- **Alternatives**: `new URL()` e limpar `search`, rejeitada porque lança em URL inválida e não
  traz ganho; lista de parâmetros sensíveis, rejeitada por ser frágil (um parâmetro novo vazaria).

## R5. Tirar o token da barra de endereço (#65)

- **Finding**: as docs instaladas (`01-getting-started/04-linking-and-navigating.md`, "Native
  History API") dizem que `history.replaceState` sincroniza com `useSearchParams`. Se a tela
  limpar a URL e continuar lendo `useSearchParams().get("token")`, o token vira `""` e a tela cai
  em "link sem token".
- **Decision**: em `forget-password-screen.tsx` e `confirm-email-screen.tsx`, guardar o token em
  estado na primeira renderização (`useState(() => searchParams.get("token")?.trim() ?? "")`) e,
  num `useEffect` de montagem, chamar `window.history.replaceState(null, "", window.location.pathname)`
  quando houver token. O `confirmOnce` (cache por `attempt:token`) continua igual, só que recebe o
  token guardado.
- **Rationale**: atende ao Edge Case "recarregar depois que o token sumiu", em que vale o
  comportamento de link sem token que já existe, e o fluxo não quebra.

## R6. Referrer nas telas com token (#65)

- **Decision**: `referrer: "no-referrer"` no `metadata` de `app/(acesso)/redefinir-senha/page.tsx`
  e `app/(acesso)/confirmar-email/page.tsx`, igual a `app/(acesso)/convite/[token]/page.tsx`.
- **Rationale**: a `<meta name="referrer">` vale mais que o cabeçalho `Referrer-Policy` de R7 para
  o documento, então essas telas continuam com "nenhum Referer" (FR-013).

## R7. Cabeçalhos de segurança (#64)

- **Decision**: `async headers()` em `next.config.ts` com `source: "/:path*"` e cinco cabeçalhos,
  definidos em [contracts/security-headers.md](contracts/security-headers.md).
- **Rationale**: as docs (`05-config/01-next-config-js/headers.md`) dizem que os cabeçalhos são
  conferidos antes do sistema de arquivos e das rewrites, então `/:path*` cobre páginas,
  `/_next/static`, `/public` e o proxy `/api/v1/:path*`. O app não usa `<iframe>`, `<embed>` nem
  `<object>`, então `frame-ancestors 'none'` não quebra nada. A CSP só com `frame-ancestors` não
  restringe scripts nem estilos, por isso não exige inventário de scripts (ver Assumptions).
- **Alternatives**: `vercel.json` `headers`, rejeitado porque não vale em `pnpm start` nem no e2e;
  `proxy.ts`, rejeitado porque roda por requisição e ainda pode ser contornado por arquivos
  estáticos.
- **HSTS**: a Vercel pode já mandar HSTS por padrão no domínio. O nosso acrescenta
  `includeSubDomains`; `preload` fica de fora porque é difícil de desfazer. Em `http://localhost`
  o navegador ignora HSTS, então o desenvolvimento não muda.
- **Test**: um e2e (`e2e/security-headers.spec.ts`) pede `/entrar`, um arquivo de `/public` e
  `/api/v1/...` pelo `request` do Playwright e confere os cinco cabeçalhos (SC-005).

## R8. `?erro=` só com código (#68)

- **Decision**: em `friendlyMessage` (`lib/api/errors.ts`), no `default`, mostrar
  `${fallback} (${code})` só se `ERROR_CODE_PATTERN = /^[A-Z0-9_]{1,64}$/` casar; caso contrário,
  só `fallback`.
- **Rationale**: as cinco páginas que leem `?erro=` passam por `friendlyMessage`, então a correção
  fica num lugar só. Os códigos conhecidos não mudam (FR-014, cenário 2).
- **Test**: casos em `lib/api/errors.test.mjs` (já existe e está no glob do `pnpm test`).

## R9. Só `https:` nas imagens da API (#68)

- **Decision**: novo `lib/https-url.ts` com `httpsUrl(value: string | null | undefined): string | undefined`,
  que devolve o valor se `new URL(value).protocol === "https:"`, ou se o protocolo for `http:` e
  `hostname` for `localhost`, `127.0.0.1` ou `[::1]` (`LOOPBACK_HOSTS`); `undefined` se o protocolo for
  outro ou a URL for inválida (com `try/catch`). Ele é usado em:
  - `components/app/invoice-photo.tsx`: `const url = httpsUrl(file.url)`. Sem URL, já aparece
    "Não foi possível carregar a foto", sem o link.
  - `components/app/avatar.tsx`: `const avatarUrl = httpsUrl(person.avatarUrl)` antes de decidir
    entre `AvatarPhoto` e as iniciais.
  - `app/(conta)/grupos/[id]/listas/[listId]/page.tsx`: o mesmo para `file.url` da nota da lista.
- **Rationale**: são três usos, o que justifica um helper (Constituição I). A função é pura e fácil
  de testar (`lib/https-url.test.mjs`). Aplicar em `avatar.tsx`, e não em `AvatarPhoto`, faz a
  pessoa ver as iniciais em vez de uma imagem quebrada.
- **Exceção de loopback**: a API local do desenvolvimento e do e2e serve avatares e notas como
  `http://localhost:<porta>/api/v1/...` (spec 021: "servido pela própria API"). Sem a exceção,
  `e2e/profile.spec.ts:59-63` e `e2e/notes-notifications.spec.ts:127` falham (SC-007). O loopback
  não alcança um atacante remoto e os navegadores tratam `localhost` como contexto confiável,
  então a exceção não reabre o que a regra fecha.
- **Alternatives**: aceitar `http:` só da origem de `API_ORIGIN`, rejeitado porque o componente de
  avatar é cliente e não conhece `API_ORIGIN` sem passar mais uma prop; `https:` puro, rejeitado
  porque quebra e2e e desenvolvimento.
