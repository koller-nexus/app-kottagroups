---

description: "Tasks: Perfil resiliente, dados completos e foto (issue #11)"
---

# Tasks: Perfil que sempre abre, com todos os dados da conta e foto

**Input**: Design documents from `/specs/015-perfil-resilient-avatar/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/profile-ui.md](./contracts/profile-ui.md),
[quickstart.md](./quickstart.md)

**Tests**: pedidos pela spec (FR-020) e pelo plano (Constituição V): `node --test` para regras puras
em `lib/` e Playwright para o Perfil. Em cada história, o teste vem antes da implementação.

**Regras do repo**: ler o guia em `node_modules/next/dist/docs/` antes de usar API do Next; `pnpm`;
sem dependência nova; `"use client"` só onde o plano lista; tokens `kotta-*`; identificadores em inglês.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência pendente)
- **[Story]**: história da spec (US1–US4)

---

## Phase 1: Setup

- [X] T001 Rodar `pnpm test` e `pnpm lint` na branch `feature/015-perfil-resilient-avatar` e anotar falhas pré-existentes (para não confundir com regressões desta feature)

---

## Phase 2: Foundational

**Purpose**: controle de falha no proxy de e2e, usado pelos testes de US1 e US4.

- [X] T002 Adicionar em `e2e/mock-api-proxy.ts` o controle `PUT /__mock/fail` (body `{ "path": "/api/v1/categories", "status": 503 }`) que faz `GET` nesse path responder `status` com `{ "error": { "code": "SERVICE_UNAVAILABLE", "message": "Mock failure." } }`, e `DELETE /__mock/fail` que limpa todas as falhas (contrato em `contracts/profile-ui.md`)

**Checkpoint**: o proxy aceita ligar/desligar falhas por path.

---

## Phase 3: User Story 1 - Perfil abre mesmo quando uma parte falha (P1) 🎯 MVP

**Goal**: `/perfil` depende só de `getMe()`; contador de grupos e categorias falham sozinhos, com
"Tentar de novo".

**Independent Test**: com `/api/v1/categories` em 503 (e, separado, `/api/v1/groups`), abrir
`/perfil` e ver nome, e-mail, "Seus dados" e "Sair da conta"; a seção afetada mostra o erro local.

### Tests for User Story 1

- [X] T003 [P] [US1] Em `e2e/profile.spec.ts`, adicionar teste: `PUT /__mock/fail` em `/api/v1/categories` → abrir `/perfil` → visíveis nome, e-mail, "Seus dados", "Sair da conta" e "Não foi possível carregar suas categorias." com "Tentar de novo"; depois `DELETE /__mock/fail`, clicar "Tentar de novo" e ver a lista de categorias; sempre limpar a falha no `afterEach` (FR-001, FR-002, FR-020)
- [X] T004 [P] [US1] Em `e2e/profile.spec.ts`, adicionar teste: falha em `/api/v1/groups` → resumo sem o contador de grupos, "Não foi possível carregar seus grupos." com "Tentar de novo", resto da página normal (FR-003)

### Implementation for User Story 1

- [X] T005 [P] [US1] Em `lib/api/kotta.ts`, `listCategories()` valida `Array.isArray(result.items)`; se não for array, lança `new ApiError(502, "INVALID_RESPONSE", ...)` (FR-004, research R2)
- [X] T006 [P] [US1] Criar `components/app/section-error.tsx` (`"use client"`) exportando `SectionBoundary = catchError(...)` de `next/error` (ler antes `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/catchError.md`); o fallback recebe a mensagem da seção e mostra o texto + botão "Tentar de novo" que chama `retry()`, com foco visível e tokens `kotta-*`
- [X] T007 [US1] Em `app/(conta)/perfil/page.tsx`, trocar o `Promise.all([getMe(), listGroups(), listCategories()])` por só `getMe()`; extrair `GroupCount` e `CategoryList` como Server Components async no próprio arquivo (ou em `app/(conta)/perfil/`), cada um em `<Suspense>` + `<SectionBoundary message=...>` com os textos "Não foi possível carregar seus grupos." / "Não foi possível carregar suas categorias."; "Gerenciar categorias" fica fora do boundary; lista vazia mostra o estado vazio com o atalho; ordem de leitura resumo → Seus dados → Categorias (FR-001, FR-002, FR-003, FR-005). Também: `components/app/app-shell.tsx` tolera `ApiError` de `listGroups()` (o layout chamava a mesma busca e cairia antes do Perfil)

**Checkpoint**: T003 e T004 passam; `/perfil` com tudo no ar abre completo.

---

## Phase 4: User Story 2 - Erros explicam o que aconteceu e deixam rastro (P1)

**Goal**: a tela de erro geral da área logada registra error + digest e diferencia offline,
serviço fora do ar e erro inesperado.

**Independent Test**: `pnpm test` cobre `loadErrorKind` e o `digest` do `ApiError`; em build de
produção com a API parada, `/perfil` mostra "O Kotta Groups não respondeu" (quickstart §3).

### Tests for User Story 2

- [X] T008 [P] [US2] Criar `lib/load-error.test.mjs`: `{ isOnline: false }` → `"offline"`; digest `"API_UNAVAILABLE:NETWORK_ERROR"` online → `"unavailable"`; digest qualquer outro ou ausente → `"unexpected"`; offline vence o digest
- [X] T009 [P] [US2] Em `lib/api/errors.test.mjs` (criar se não existir), testar que `ApiError` recebe `digest = "API_UNAVAILABLE:<code>"` quando `status >= 500` ou código `NETWORK_ERROR`, `SERVICE_UNAVAILABLE`, `EDGE_BLOCKED`, `INTERNAL_ERROR`, e não recebe `digest` para 4xx comuns (ex.: 404 `NOT_FOUND`)

### Implementation for User Story 2

- [X] T010 [P] [US2] Criar `lib/load-error.ts` com `loadErrorKind({ digest?: string; isOnline: boolean }): "offline" | "unavailable" | "unexpected"` (regras em `data-model.md`) e a constante do prefixo `API_UNAVAILABLE`
- [X] T011 [P] [US2] Em `lib/api/errors.ts`, o construtor de `ApiError` define `this.digest = "API_UNAVAILABLE:" + code` nas condições de T009 (research R3)
- [X] T012 [US2] Em `components/app/load-error.tsx`, aceitar `kind` e `digest` e mostrar título/texto por tipo: offline "Você está sem conexão" / "Verifique sua internet e tente de novo."; unavailable "O Kotta Groups não respondeu" / "O serviço está fora do ar agora. Tente de novo em instantes."; unexpected "Algo deu errado" / "Tivemos um problema ao abrir esta tela. Tente de novo. Código: {digest}"; sempre com "Tentar de novo" (FR-007)
- [X] T013 [US2] Em `app/(conta)/error.tsx` (ler antes `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`), usar a prop `retry`, fazer `console.error("[app] erro na tela", { digest, message })` em `useEffect`, e passar `loadErrorKind({ digest, isOnline: navigator.onLine })` ao `LoadError` (FR-006, FR-007)

**Checkpoint**: `pnpm test` passa com T008/T009; tela de erro mostra os três textos.

---

## Phase 5: User Story 3 - Perfil mostra todos os dados da conta (P2)

**Goal**: resumo com foto/iniciais, nome, e-mail, chave Pix, "Membro desde" e status do e-mail;
"Seus dados" com e-mail completo somente leitura.

**Independent Test**: abrir `/perfil` com uma conta com foto, Pix e e-mail confirmado e com outra sem
nada disso; conferir cada campo em 375px e desktop.

### Tests for User Story 3

- [X] T014 [P] [US3] Em `lib/dates.test.mjs` (criar se não existir), testar `formatMemberSince("2026-03-10T12:00:00Z")` → `"Membro desde março de 2026"` (ou o texto que a UI compõe, conforme T015), e `null` para `undefined`, `""` e `"não-é-data"`

### Implementation for User Story 3

- [X] T015 [P] [US3] Em `lib/dates.ts`, adicionar `formatMemberSince(createdAt)` reaproveitando `formatMonthYear(createdAt.slice(0, 10))`; devolve `null` se a data for ausente ou inválida (research R7)
- [X] T016 [P] [US3] Em `lib/api/kotta.ts`, `getMe()` normaliza `avatarUrl` com `new URL(avatarUrl, apiOrigin()).toString()` quando não for nulo (mantém absolutas, corrige relativas; research R5)
- [X] T017 [P] [US3] Criar `components/app/avatar-photo.tsx` (`"use client"`): `<img src alt="" loading="lazy" referrerPolicy="no-referrer" className="object-cover ...">` que troca para as iniciais recebidas por prop no `onError` (FR-011)
- [X] T018 [US3] Em `components/app/avatar.tsx`, `AvatarPerson` ganha `avatarUrl?: string | null`; com URL, `Avatar` (continua Server Component) delega para `AvatarPhoto`, sem URL mantém as iniciais (FR-011, FR-012, FR-013)
- [X] T019 [US3] Em `app/(conta)/perfil/page.tsx`, completar o resumo: avatar com `avatarUrl`, "Chave Pix: {chave}" ou "Nenhuma chave Pix cadastrada" com link `#pixKey`, "Membro desde …" (omitido se `null`), "E-mail confirmado" / "E-mail não confirmado" com link para `/confirme-seu-email`; em "Seus dados", e-mail completo somente leitura com quebra de linha (sem truncar); garantir `id="pixKey"` no campo de chave Pix do formulário de perfil (FR-009, FR-010, FR-021)

**Checkpoint**: Perfil mostra os 6 dados; URL quebrada cai para iniciais.

---

## Phase 6: User Story 4 - Trocar a foto de perfil (P3)

**Goal**: "Alterar foto" com validação local, prévia, "Enviando…", "Foto atualizada." e mensagens
por código.

**Independent Test**: com e-mail confirmado, enviar JPG de 1 MB e ver a foto nova no Perfil e na
sidebar; GIF e JPG de 6 MB mostram a mensagem sem chamar a API.

### Tests for User Story 4

- [X] T020 [P] [US4] Criar `lib/avatar.test.mjs`: `avatarFileProblem(null)` e `size: 0` → "Escolha uma foto."; `image/gif` e `image/jpeg` com `5 * 1024 * 1024 + 1` bytes → "Use uma foto JPG, PNG ou WebP de até 5 MB"; JPEG/PNG/WebP com `5 * 1024 * 1024` bytes → `null`
- [X] T021 [P] [US4] Em `lib/api/errors.test.mjs`, testar `friendlyMessage` para `AVATAR_TOO_LARGE` → "A foto passa de 5 MB. Escolha uma menor." e `INVALID_AVATAR_TYPE` → "Use uma foto JPG, PNG ou WebP."
- [X] T022 [P] [US4] Em `e2e/profile.spec.ts`, teste: escolher um arquivo `.gif` no input "Alterar foto de perfil" → aparece "Use uma foto JPG, PNG ou WebP de até 5 MB" e nenhum `POST /users/me/avatar` sai (FR-015)

### Implementation for User Story 4

- [X] T023 [P] [US4] Criar `lib/avatar.ts` com `AVATAR_MAX_BYTES = 5 * 1024 * 1024`, `AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"]` e `avatarFileProblem(file: { type: string; size: number } | null): string | null` (regras em `data-model.md`)
- [X] T024 [P] [US4] Em `lib/api/errors.ts`, adicionar ao `friendlyMessage` os códigos `AVATAR_TOO_LARGE` e `INVALID_AVATAR_TYPE` com os textos de T021
- [X] T025 [US4] Em `app/actions/kotta.ts`, criar `updateAvatarAction(prev: AvatarFormState, formData: FormData)` no padrão de `updateProfileAction`: valida `formData.get("file")` com `avatarFileProblem` (inválido → `{ error }` sem chamar a API); chama `apiRequest<ApiUser>("/users/me/avatar", { method: "POST", body: formData })`; sucesso → `revalidatePath("/", "layout")` e `{ ok: true }`; erro → `friendlyMessage`, com `VALIDATION_FAILED` sobrescrito para "Escolha uma foto." e fallback "Não foi possível atualizar a foto. Tente de novo." (contrato em `contracts/profile-ui.md`)
- [X] T026 [US4] Criar `components/forms/avatar-form.tsx` (`"use client"`) com `useActionState(updateAvatarAction)`: `<input type="file" name="file" accept="image/jpeg,image/png,image/webp" className="sr-only">` dentro de label/botão com `aria-label="Alterar foto de perfil"` e foco visível; ao escolher, valida com `avatarFileProblem` e só então envia; prévia via `URL.createObjectURL`, revogada ao terminar (sucesso ou erro); botão "Enviando…" desabilitado durante o envio; região `aria-live="polite"` com "Enviando…", "Foto atualizada." ou o erro; cancelar o seletor não muda nada; se `emailConfirmed` for `false`, mostra aviso com link para `/confirme-seu-email` em vez do seletor (FR-014–FR-019)
- [X] T027 [US4] Em `app/(conta)/perfil/page.tsx`, colocar `AvatarForm` no resumo envolvendo o avatar (tocar a foto abre o seletor no celular), passando `emailConfirmed` e o avatar atual

**Checkpoint**: troca de foto funciona; arquivos inválidos não saem do navegador.

---

## Phase 7: Polish & Cross-Cutting

- [X] T028 Rodar `pnpm test`, `pnpm lint`, `pnpm build` e `API_ORIGIN=http://localhost:8085 pnpm test:e2e e2e/profile.spec.ts`; corrigir falhas novas. Resultado: 90 testes de unidade, lint limpo, build ok; e2e 38/39, a falha é `notes-notifications` "foto enviada…", que já existia e não vem desta branch (`components/app/invoice-photo.tsx`, onError antes da hidratação)
- [X] T029 Validar manualmente `quickstart.md` §2–§4: 375px e desktop sem rolagem horizontal, URL de foto inválida cai para iniciais, digest `API_UNAVAILABLE:*` chega ao cliente em build de produção (se não chegar, a tela cai em "Algo deu errado"; registrar no PR). Automatizado em `e2e/profile.spec.ts`: 375px sem rolagem, envio real da foto, digest em build de produção. Não exercitado: URL de foto quebrada (coberto pelo `ref` + `onError` de `AvatarPhoto`) e conta com e-mail não confirmado
- [ ] T030 FR-008 (manual, dono do projeto): seguir `quickstart.md` §5 nos logs da Vercel e da API de 12/10/2026 ~22:16; se a causa estiver na API, abrir issue em `koller-nexus/api-kottagroups` e linkar na #11

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002)** → histórias.
- **US1** depende de T002 (testes e2e). **US2** é independente de US1 (só toca erros e `error.tsx`).
- **US3** é independente de US1/US2, mas T019 edita `page.tsx` depois de T007 se US1 já tiver entrado.
- **US4** depende de US3 (T018 exibe a foto; T027 usa o resumo de T019).
- Mesmo arquivo em histórias diferentes (rodar em sequência): `lib/api/kotta.ts` (T005, T016),
  `lib/api/errors.ts` (T011, T024), `lib/api/errors.test.mjs` (T009, T021), `e2e/profile.spec.ts`
  (T003, T004, T022), `app/(conta)/perfil/page.tsx` (T007, T019, T027).

```text
T001 → T002 → US1 (T003–T007) ─┐
              US2 (T008–T013) ─┼→ Polish (T028–T030)
              US3 (T014–T019) → US4 (T020–T027) ─┘
```

## Parallel Examples

- **US1**: T003, T005 e T006 juntos; T004 depois de T003 (mesmo arquivo); T007 depois de T005 e T006.
- **US2**: T008, T009, T010 e T011 juntos; depois T012; depois T013.
- **US3**: T014, T015, T016 e T017 juntos; depois T018; depois T019.
- **US4**: T020, T021, T022, T023 e T024 juntos; depois T025; depois T026; depois T027.

## Implementation Strategy

1. **MVP**: T001 → T002 → US1. Corrige o bug da issue (Perfil não cai mais) e já pode ir em PR.
2. **+ US2**: mensagens corretas e rastro com digest; fecha o lado de investigação.
3. **+ US3**: todos os dados da conta e a foto exibida.
4. **+ US4**: troca de foto.
5. Polish e FR-008 manual antes de fechar a #11.
