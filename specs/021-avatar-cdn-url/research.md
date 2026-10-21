# Research: Foto de perfil com endereço fixo

Fonte do contrato: `api-kottagroups` em `edd0405` (PR #244, spec 090), `api/openapi.yaml` e
`docs/environment.md`.

## R1. O que a API devolve agora

- **Decision**: tratar `avatarUrl` como URL absoluta, estável e pública:
  `{APP_PUBLIC_URL}/api/v1/avatars/{userID}/{ulid}.{jpg|png|webp}`, sem query string. Em produção,
  `APP_PUBLIC_URL = https://api.kottagroups.com.br` (atrás do Cloudflare). Muda a cada upload; some
  quando não há foto.
- **Rationale**: está no OpenAPI (`format: uri`) e o padrão de `APP_PUBLIC_URL` é sempre absoluto
  (`http://127.0.0.1:{APP_PORT}` em dev). A rota responde `200` com
  `Cache-Control: public, max-age=31536000, immutable`, `Cross-Origin-Resource-Policy: cross-origin`
  e sem cookie; erros vêm com `no-store`. O navegador pode guardar a imagem em cache sem nada no
  front.
- **Alternatives considered**: nenhuma; é o contrato.

## R2. Normalização de URL relativa em `getMe` (`lib/api/kotta.ts:33-34`)

- **Decision**: remover. `getMe` passa a devolver `/users/me` como veio.
- **Rationale**: existia porque a API, sem base configurada, devolvia o link relativo a ela. Agora
  `APP_PUBLIC_URL` tem padrão absoluto, então o `new URL(..., apiOrigin())` não faz nada. Mesmo se
  algum dia vier relativo (`/api/v1/avatars/...`), o navegador resolve contra o site e o rewrite
  `/api/v1/:path*` de `next.config.ts` leva até a API: a foto continua aparecendo. Princípio I:
  código que ficou sem uso sai na mudança que o tornou sem uso.
- **Alternatives considered**: manter "por segurança" (rejeitado: proteção para um caso que já tem
  caminho funcionando, e mantém a ideia de que o front monta a URL).

## R3. `<img>` ou `next/image`

- **Decision**: manter o `<img>` de `components/app/avatar-photo.tsx`. Sem `images.remotePatterns`.
- **Rationale**: `next/image` passaria a foto pelo otimizador `/_next/image`, que baixa e guarda uma
  segunda cópia, reescala e cobra por transformação; a imagem já é WebP pequeno e já está na CDN com
  cache de um ano. O `<img>` usa o cache do navegador direto sobre a URL imutável (FR-006). O
  avatar tem tamanho fixo por CSS, então não há salto de layout.
- **Alternatives considered**: `next/image` com `remotePatterns` restrito a `/api/v1/avatars/**`
  (rejeitado: mais configuração e um salto a mais, sem ganho para imagem pequena já otimizada) e
  `unoptimized` (rejeitado: vira um `<img>` com mais código).

## R4. Foto nova após o upload

- **Decision**: manter o fluxo atual: `updateAvatarAction` chama `POST /users/me/avatar` e
  `revalidatePath("/", "layout")`; o Perfil e o cabeçalho voltam do servidor com a `avatarUrl` nova
  de `/users/me`. `AvatarPhoto` já usa `key={avatarUrl}`, então a URL nova remonta a imagem (e zera
  o estado de erro). Sem cache-buster.
- **Rationale**: a resposta do upload e o `/users/me` seguinte trazem a mesma URL nova. Usar a
  resposta do POST no cliente exigiria levar a URL do action até o cabeçalho, que é Server
  Component; a revalidação já faz isso e é o padrão de todas as outras mutações. O `GET /users/me`
  da revalidação não é "renovar a URL" (FR-003): é recarregar a tela depois da mudança.
- **Alternatives considered**: devolver `avatarUrl` do action e sobrescrever a foto no cliente
  (rejeitado: estado duplicado, só o Perfil atualizaria e o cabeçalho não).

## R5. Fotos dos membros de grupo

- **Decision**: fora do escopo do front nesta feature. Nas listas de membros só a pessoa logada
  pode ter foto, e só onde o front já usa `getMe`. Abrir uma issue em `api-kottagroups` para incluir
  `avatarUrl` em `GroupMember`.
- **Rationale**: `GroupMember` no OpenAPI tem só `id`, `name`, `role`; `ApiGroupMember` em
  `lib/api/types.ts` também. Hoje as listas de membros mostram iniciais para todos e não há dado
  para mostrar outra coisa. Quando a API mandar o campo, `Avatar` já o usa sem mudança (mesmo
  `AvatarPerson`), e basta acrescentar o campo ao tipo.
- **Alternatives considered**: buscar cada perfil (rejeitado: não há rota para isso e seriam N
  chamadas por tela).
- **Spec**: cenário 2 da US1 e Assumptions ajustados para refletir isso.

## R6. CSP

- **Decision**: nenhuma mudança. Não há CSP no front (`next.config.ts`, `proxy.ts`, `vercel.json`).
  Fica registrado em [contracts/avatar-url.md](contracts/avatar-url.md) que uma CSP futura precisa
  de `img-src` com a origem de `API_ORIGIN` (e `blob:`, pela prévia local do upload).
- **Rationale**: a decisão de adotar CSP é do trabalho de cabeçalhos (spec 020). Escrever uma CSP só
  para imagens seria escopo novo.

## R7. Teste

- **Decision**: apertar o teste e2e existente `e2e/profile.spec.ts` ("trocar foto envia a imagem…"):
  o `src` da foto precisa casar com `/api/v1/avatars/<id>/<id>.<ext>` sem query string, e a foto
  precisa ser diferente da anterior. Sem teste unitário: a mudança é remoção de código e de
  comentários, sem regra nova em `lib/`.
- **Rationale**: Princípio V pede um teste que falhe quando o comportamento quebra; o e2e é o único
  lugar que vê a URL real da API. Cache do navegador (SC-001) não é observável de forma confiável
  pelo Playwright (respostas de memory cache nem geram evento); fica no quickstart, verificação
  manual.
