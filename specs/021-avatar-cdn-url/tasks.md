---

description: "Tasks: foto de perfil com endereço fixo servido pela CDN (issue #70)"
---

# Tasks: Foto de perfil com endereço fixo, guardada em cache pelo navegador

**Input**: Design documents from `/specs/021-avatar-cdn-url/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/avatar-url.md](./contracts/avatar-url.md),
[quickstart.md](./quickstart.md)

**Tests**: pedidos pelo plano (Constituição V, research R7): apertar o e2e existente de troca de foto.
Sem teste unitário: nenhuma regra nova em `lib/` (motivo escrito em research R7).

**Regras do repo**: `pnpm`; sem dependência nova; não usar `next/image` nem `images.remotePatterns`
(research R3); não acrescentar query string à URL da foto; identificadores em inglês, comentários
explicam o porquê.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência pendente)
- **[Story]**: história da spec (US1–US3)

---

## Phase 1: Setup

- [X] T001 Criar a branch `feature/021-avatar-cdn-url` a partir de `main`, subir a API local em `edd0405` ou depois (`api-kottagroups`, PR #244) em `http://localhost:8085` e rodar `pnpm lint` e `pnpm test` para anotar falhas pré-existentes

---

## Phase 2: Foundational

Nada bloqueante: o tipo `ApiUser.avatarUrl` em `lib/api/types.ts` já é `string | null` opcional e o
`Avatar` já usa a URL como veio.

---

## Phase 3: User Story 1 - A foto aparece rápido nas visitas seguintes (Priority: P1) 🎯 MVP

**Goal**: a foto da conta usa a URL estável da API como veio, carregada direto pelo navegador, que a
reaproveita do cache.

**Independent Test**: abrir `/perfil`, recarregar com DevTools → Network aberto e ver a imagem
`/api/v1/avatars/...` como `(memory cache)` ou `(disk cache)` (quickstart, passos 1 e 2).

### Implementation for User Story 1

- [X] T002 [P] [US1] Em `lib/api/kotta.ts`, simplificar `getMe` para `cache(() => apiRequest<ApiUser>("/users/me"))`: remover o comentário "Sem base URL configurada…" e o `new URL(me.avatarUrl, apiOrigin())`; tirar `apiOrigin` do import de `@/lib/api/server` se ficar sem uso (research R2)
- [X] T003 [P] [US1] Em `components/app/avatar.tsx`, trocar o comentário de `AvatarPerson.avatarUrl` ("Link assinado e temporário…") por um que diga que é a URL estável da foto, usada como veio da API, e que muda a cada upload (data-model: "URL absoluta, estável e pública da foto atual. Ausente ou `null` = sem foto.")
- [X] T004 [P] [US1] Em `components/app/avatar-photo.tsx`, trocar o comentário do eslint-disable ("link assinado que expira; next/image o otimizaria e cachearia") pelo motivo atual: URL imutável já na CDN, carregada direto para o navegador usar o próprio cache, sem o otimizador do Next (research R3)

**Checkpoint**: `/perfil` e o cabeçalho mostram a foto; na segunda carga ela vem do cache.

---

## Phase 4: User Story 2 - Trocar a foto mostra a nova na hora (Priority: P1)

**Goal**: depois do upload, a URL nova aparece no Perfil e no cabeçalho sem recarregar e sem
cache-buster. O fluxo já existe (`updateAvatarAction` + `revalidatePath`, `key={avatarUrl}` em
`AvatarPhoto`, research R4); esta fase trava o comportamento em teste.

**Independent Test**: `API_ORIGIN=http://localhost:8085 pnpm test:e2e e2e/profile.spec.ts`; e o passo 3
do quickstart.

### Tests for User Story 2

- [X] T005 [US2] Em `e2e/profile.spec.ts`, no teste "trocar foto envia a imagem e mostra a foto nova no resumo": guardar o `src` da foto do resumo antes do upload (pode ser `null` se a conta não tem foto); depois de "Foto atualizada.", exigir `src` casando com `/\/api\/v1\/avatars\/[0-9A-Z]{26}\/[0-9A-Z]{26}\.(jpg|png|webp)$/` (sem query string), diferente do anterior, e igual ao `src` da foto do cabeçalho; manter a checagem de `naturalWidth > 0` (contracts/avatar-url.md, FR-002, FR-004)

**Checkpoint**: e2e de upload passa contra a API local.

---

## Phase 5: User Story 3 - Sem foto ou foto indisponível, as iniciais aparecem (Priority: P2)

**Goal**: manter o fallback para iniciais com a URL nova.

**Independent Test**: quickstart, passo 4 (bloquear `*/api/v1/avatars/*` e recarregar).

### Implementation for User Story 3

- [X] T006 [US3] Em `components/app/avatar-photo.tsx`, trocar o comentário do componente ("se não carregar (link expirado, quebrado)…") pelos casos atuais: foto removida, inexistente ou erro de rede mostram o `fallback` (iniciais); manter `onError` e o `ref` que detecta falha antes da hidratação sem mudança (FR-005). Depois de T004 (mesmo arquivo)

**Checkpoint**: com a imagem bloqueada, resumo e cabeçalho mostram as iniciais.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T007 Conferir SC-004: `git grep -n -i -E "assinad|expir" -- components/app/avatar.tsx components/app/avatar-photo.tsx lib/api/kotta.ts` não retorna nada sobre a foto de perfil; os comentários de URL assinada em `components/app/invoice-photo.tsx` e `app/(conta)/grupos/[id]/listas/[listId]/page.tsx` ficam (são notas fiscais)
- [X] T008 Rodar `pnpm lint`, `pnpm test`, `pnpm build` e `API_ORIGIN=http://localhost:8085 pnpm test:e2e e2e/profile.spec.ts`; percorrer os passos manuais de `specs/021-avatar-cdn-url/quickstart.md`
- [ ] T009 Abrir issue em `koller-nexus/api-kottagroups` pedindo `avatarUrl` em `GroupMember` (research R5), com o motivo e o link para esta spec

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (T001) → US1 (T002–T004) → US2 (T005) e US3 (T006) → Polish (T007–T009)
- T009 é independente de código e pode ser feito a qualquer momento

### User Story Dependencies

- **US1**: nenhuma
- **US2**: o teste não depende de US1 para passar (a URL estável vem da API), mas roda depois para
  validar o conjunto
- **US3**: só compartilha arquivo com T004 (fazer depois dele)

### Parallel Opportunities

- T002, T003 e T004 mexem em arquivos diferentes
- T005 (e2e) pode ser escrito em paralelo com US1
- T009 em paralelo com tudo

## Parallel Example: User Story 1

```text
T002 lib/api/kotta.ts
T003 components/app/avatar.tsx
T004 components/app/avatar-photo.tsx
```

## Implementation Strategy

- **MVP**: T001–T004 (US1). Entrega a foto pela URL estável com cache do navegador.
- Depois T005 (trava o upload em teste), T006 (comentário do fallback) e o Polish.
- Tudo cabe num PR só: 3 arquivos de código e 1 teste.
