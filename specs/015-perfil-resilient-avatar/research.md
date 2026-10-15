# Research: Perfil resiliente, dados completos e foto

## R1. Como isolar falhas de grupos e categorias no Perfil

- **Decision**: a página busca só `getMe()`. Contador de grupos e lista de categorias viram dois
  Server Components async pequenos, cada um dentro de `<Suspense>` e de um boundary criado com
  `catchError` de `next/error` (`components/app/section-error.tsx`). O fallback mostra a mensagem da
  seção e "Tentar de novo" (`retry()`).
- **Rationale**: `catchError` é a API nativa do Next 16.3 para boundary por componente
  (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/catchError.md`). Ele pega
  tanto erro de rede quanto erro de render (ex.: `.map` em `undefined`), não engole `redirect()`
  (sessão expirada continua redirecionando) e o `retry()` refaz só o necessário, preservando o estado
  do formulário. O Suspense ainda deixa os dados da conta aparecerem antes das seções.
- **Alternatives considered**:
  - `Promise.allSettled` na página + `null` por seção + botão com `router.refresh()`: não cobre
    erro de render, espalha `if (x === null)` e exige um client component a mais para o retry.
  - Classe `ErrorBoundary` própria: reinventa o que `catchError` já dá, e engoliria `redirect()`.

## R2. Causa raiz da queda de 12/10/2026 (FR-008)

- **Decision**: sem acesso aos logs da Vercel/API nesta sessão, a investigação fica como tarefa
  manual (ver quickstart §5). No código, o ponto frágil confirmado é `listCategories()`, que faz
  `result.items` sem checar o formato; se `/categories` responder fora do envelope
  `{ data: { items } }`, a página quebra em `categories.map`. `listCategories()` passa a validar
  `Array.isArray(items)` e lançar `ApiError(502, "INVALID_RESPONSE")`, que o boundary da seção pega.
- **Rationale**: valida dado desconhecido na fronteira (Constituição IV) e transforma a falha
  silenciosa em linha `[api]`/erro com código.
- **Alternatives considered**: esperar os logs antes de qualquer mudança. Rejeitado: a resiliência
  (US1) vale para qualquer causa e é o que a issue pede.

## R3. Distinguir "sem conexão/serviço fora" de "erro inesperado" no `error.tsx` (FR-007)

- **Decision**: em produção o Next só manda `digest` do erro do servidor para o cliente (doc de
  `error.js`, "Errors forwarded from Server Components show a generic message with an identifier").
  O Next respeita um `digest` já presente no erro (`server/app-render/create-error-handler.js`:
  "If the error already has a digest, respect the original digest"). Então `ApiError` com código de
  indisponibilidade (`NETWORK_ERROR`, `SERVICE_UNAVAILABLE`, `EDGE_BLOCKED`, `INTERNAL_ERROR` ou
  status ≥ 500) recebe `digest = "API_UNAVAILABLE:<code>"`. Uma função pura
  `loadErrorKind({ digest, isOnline })` em `lib/load-error.ts` devolve `"offline"` (navegador sem
  rede), `"unavailable"` (digest com prefixo) ou `"unexpected"`.
- **Rationale**: poucas linhas, testável sem UI, e o digest continua útil nos logs (a linha `[api]`
  já registra método, rota, status e código).
- **Risk**: o respeito ao `digest` existente é comportamento do Next, não API documentada. Se mudar,
  o pior caso é cair em `"unexpected"` (mensagem genérica correta, só menos específica). O quickstart
  §3 confere em build de produção.
- **Alternatives considered**: tratar `ApiError` em cada página (duplicação em todas as telas da
  área logada); Sentry (dependência nova sem necessidade, Constituição I).

## R4. Registrar erro do boundary (FR-006)

- **Decision**: `app/(conta)/error.tsx` faz `console.error("[app] erro na tela", { digest, message })`
  num `useEffect`. Do lado do servidor, o Next já loga o erro original com o mesmo digest.
- **Rationale**: o digest liga o console do navegador ao log da Vercel; sem dependência nova.
- **Alternatives considered**: Sentry/serviço de logs: fora do escopo e exige dependência e conta.

## R5. Exibir a foto (`avatarUrl`)

- **Decision**: `<img>` simples (`object-cover`, `alt=""`, `loading="lazy"`,
  `referrerPolicy="no-referrer"`) num client component mínimo `components/app/avatar-photo.tsx`, que
  troca para as iniciais no `onError`. `Avatar` continua Server Component e só delega para ele quando
  há URL.
- **Rationale**: a API devolve URL assinada servida por ela mesma
  (`GET /api/v1/users/me/avatar/:file`, rota pública com HMAC no repo `api-kottagroups`). `next/image`
  exigiria `remotePatterns` e otimização de uma URL que expira. Só o fallback precisa de estado, então
  só ele é client (Constituição IV).
- **Achado**: quando a API roda sem base URL configurada, ela devolve a URL **relativa**
  (`/api/v1/users/me/avatar/<arquivo>`, `internal/storage/sign.go`), que no navegador resolveria
  para o domínio da web. `getMe()` passa a normalizar com `new URL(avatarUrl, apiOrigin())`, que
  mantém URLs absolutas e corrige as relativas.

## R6. Trocar a foto

- **Decision**: Server Action `updateAvatarAction(prev, formData)` em `app/actions/kotta.ts`, que
  valida o arquivo com `avatarFileProblem()` (`lib/avatar.ts`) e chama
  `apiRequest<ApiUser>("/users/me/avatar", { method: "POST", body: formData })`. Em sucesso,
  `revalidatePath("/", "layout")` atualiza Perfil e sidebar. O formulário cliente
  (`components/forms/avatar-form.tsx`) usa `useActionState`, valida antes de enviar com a mesma
  função, mostra prévia com `URL.createObjectURL` e a revoga ao terminar.
- **Rationale**: mesmo padrão de `updateProfileAction`; `apiRequest` já aceita `FormData`;
  `serverActions.bodySizeLimit` já é 11 MB. Validar no cliente e de novo no servidor segue a regra de
  validar antes do efeito colateral.
- **Contrato da API** (conferido em `api-kottagroups/internal/http/router.go` e
  `specs/023-user-profile-avatar`): `POST /api/v1/users/me/avatar`, campo `file`, JPEG/PNG/WebP por
  conteúdo, até 5 MiB; erros `AVATAR_TOO_LARGE`, `INVALID_AVATAR_TYPE`, `VALIDATION_FAILED`,
  `RATE_LIMITED` (429), `STORAGE_UNAVAILABLE`; exige e-mail confirmado (403 `EMAIL_NOT_CONFIRMED`,
  que o `apiRequest` já redireciona para `/confirme-seu-email`).
- **E-mail não confirmado**: o formulário já sabe `emailConfirmed`; em vez de deixar escolher a foto e
  ser redirecionado, mostra o aviso com link para `/confirme-seu-email` e não oferece o seletor.

## R7. "Membro desde"

- **Decision**: `formatMemberSince(createdAt)` em `lib/dates.ts`, reaproveitando `formatMonthYear`
  com `createdAt.slice(0, 10)`; devolve `null` para data ausente/inválida.

## R8. Teste da falha de `/categories` (FR-020)

- **Decision**: o proxy de e2e (`e2e/mock-api-proxy.ts`) ganha um controle
  `PUT /__mock/fail` com `{ "path": "/api/v1/categories", "status": 503 }` (e `DELETE` para limpar).
  `e2e/profile.spec.ts` liga a falha, abre `/perfil` e confere nome, e-mail, formulário e o erro da
  seção. Regras puras ganham testes `node --test` em `lib/`.
- **Rationale**: o Next chama a API no servidor, então `page.route` não alcança; o proxy já existe
  para isso.

## R9. Arquivo `VERSION`

- **Decision**: não existe `VERSION` no repo e esta feature não introduz versionamento; nada a
  incrementar (Constituição IV só obriga a mudança que introduzir o arquivo).
