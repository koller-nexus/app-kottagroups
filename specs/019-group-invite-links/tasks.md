---

description: "Task list for 019 — Convidar para o grupo por link e por e-mail"
---

# Tasks: Convidar para o grupo por link e por e-mail

**Input**: Design documents from `/specs/019-group-invite-links/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (api-consumed.md, ui.md), quickstart.md

**Tests**: pedidos pela issue #27 e pelo FR-026: testes `node --test` da lógica em `lib/`
(`lib/invites.test.mjs`, `lib/permissions.test.mjs`, `lib/api/errors.test.mjs`). Componentes e
páginas são validados pelo roteiro manual do `quickstart.md`.

**Organization**: tarefas agrupadas por história de usuário (US1–US5 da spec).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa pendente)
- **[Story]**: história da spec (US1…US5)
- `lib/invites.ts` e `lib/invites.test.mjs` são tocados por várias histórias: tarefas nesses
  arquivos não são [P] entre si.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependência nova e conferência do contrato

- [X] T001 Adicionar `uqr` na versão exata `0.1.3` com `pnpm add uqr@0.1.3`, atualizando `package.json` e `pnpm-lock.yaml` (justificativa no PR: research R1)
- [X] T002 [P] Conferir no código da API (`koller-nexus/api-kottagroups`, geração do token de convite da spec 071) o alfabeto e o tamanho do token e registrar o resultado em `specs/019-group-invite-links/research.md` R9; se não couber em `/^[A-Za-z0-9_-]{16,256}$/`, ajustar o padrão em data-model.md antes da T005

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: tipos, mensagens de erro, permissão, regras básicas e chamadas à API usadas por todas as histórias

**⚠️ CRITICAL**: nenhuma história começa antes desta fase

- [X] T003 [P] Adicionar em `lib/api/types.ts` os tipos `ApiInviteStatus` (`"active" | "expired" | "revoked" | "exhausted"`), `ApiGroupInvite` (`id`, `groupId`, `createdBy`, `email: string | null`, `maxUses`, `uses`, `expiresAt`, `revokedAt: string | null`, `createdAt`, `status`), `ApiGroupInviteCreated` (`invite`, `token`, `url`, `emailSent`), `ApiInvitePreview` (`group: { name; emoji }`, `inviterName`, `expiresAt`), `ApiInviteAccepted` (`groupId`, `joined`) e a página de convites reusando o formato `{ items, nextCursor, hasMore }` já existente
- [X] T004 [P] Em `lib/api/errors.ts`, adicionar a `friendlyMessage` os casos `INVITE_INVALID` → "Este convite não vale mais. Peça um novo link a quem convidou." e `INVITE_EMAIL_MISMATCH` → "Este convite foi enviado para outro e-mail."; cobrir os dois em `lib/api/errors.test.mjs`
- [X] T005 [P] Criar `lib/invites.ts` com as constantes `INVITE_MAX_USES_MIN = 1`, `INVITE_MAX_USES_MAX = 100`, `INVITE_EXPIRY_OPTIONS` (`1` "1 hora", `24` "1 dia", `168` "7 dias", `720` "30 dias"), `INVITE_DEFAULT_EXPIRY_HOURS = 168`, `INVITE_LIST_LIMIT = 50`, `INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,256}$/`, e as funções `isInviteTokenShape(token: unknown): boolean` e `inviteReturnPath(token: string): string` (`/convite/${encodeURIComponent(token)}`); testes em `lib/invites.test.mjs` (token curto, longo, com `/`, `.` ou espaço → falso; base64url de 43 chars → verdadeiro; retorno codificado)
- [X] T006 [P] Em `lib/permissions.ts`, adicionar `export const canInviteMembers = canDeleteGroup;` com comentário "Convidar por link/e-mail: dono ou admin." e o teste em `lib/permissions.test.mjs` (owner/admin true, member/undefined false)
- [X] T007 Em `lib/api/kotta.ts`, adicionar `previewInvite(token)` → `apiRequest<ApiInvitePreview>("/invites/preview", { method: "POST", auth: false, body: { token } })` e `listGroupInvites(groupId)` (envolta em `cache`) → `apiRequest` em `withQuery(\`/groups/${encodeURIComponent(groupId)}/invites\`, { limit: INVITE_LIST_LIMIT })` (depende de T003, T005)

**Checkpoint**: base pronta — `pnpm test` verde

---

## Phase 3: User Story 1 - Entrar no grupo pelo link do convite (Priority: P1) 🎯 MVP

**Goal**: página pública `/convite/[token]` com prévia, cadastro/login que voltam ao convite e "Entrar no grupo"

**Independent Test**: com um link gerado direto na API, abrir sem sessão → criar conta → confirmar e-mail → voltar ao convite → "Entrar no grupo" → cair no grupo com o aviso "Você entrou em …"; link inválido mostra a mensagem única

### Tests for User Story 1

- [X] T008 [US1] Em `lib/invites.test.mjs`, testar `invitePageState({ tokenOk, preview, previewErrorCode, hasSession, erro })` para os estados da tabela do data-model: token fora do formato → `invalid`; prévia `INVITE_INVALID` → `invalid`; `erro=INVITE_INVALID` → `invalid`; prévia ok sem sessão → `guest`; prévia ok com sessão → `member-ready`; falha de rede/`RATE_LIMITED` na prévia → `error`
- [X] T009 [US1] Em `lib/invites.test.mjs`, testar `redactInviteUrl(url)`: `https://x/convite/abc?y=1` → `https://x/convite/[token]`; URLs sem `/convite/` voltam iguais

### Implementation for User Story 1

- [X] T010 [US1] Implementar `invitePageState` e `redactInviteUrl` em `lib/invites.ts` até T008/T009 passarem (estado `email-mismatch` fica para a US3)
- [X] T011 [P] [US1] Em `app/layout.tsx`, passar `beforeSend={(event) => ({ ...event, url: redactInviteUrl(event.url) })}` para `<Analytics />` e `<SpeedInsights />` (FR-009; confirmar a assinatura do `beforeSend` nos tipos dos pacotes instalados)
- [X] T012 [P] [US1] Repassar `next` no cadastro: `app/(acesso)/cadastrar/page.tsx` lê `searchParams.next` com `safeNextPath` e passa para `RegisterForm`; `components/auth/register-form.tsx` recebe a prop `next`, envia `<input type="hidden" name="next">` e mantém o `next` no link "Já tenho conta" (`/entrar?next=…`) quando não for `/` (`registerAction` já lê `next`)
- [X] T013 [US1] Criar `app/actions/invites.ts` (`"use server"`) com `acceptInviteAction(formData)`: lê `token`, recusa formato inválido redirecionando para `inviteReturnPath(token)` com `?erro=INVITE_INVALID`; chama `POST /invites/accept` via `apiRequest<ApiInviteAccepted>`; em `ApiError` redireciona para `${inviteReturnPath(token)}?erro=${code}`; em sucesso `revalidatePath("/", "layout")` e `redirect(\`/grupos/${groupId}?aviso=${joined ? "entrou" : "ja-membro"}\`)` (401/`EMAIL_NOT_CONFIRMED` já tratados por `apiRequest`)
- [X] T014 [US1] Criar `app/(acesso)/convite/[token]/page.tsx` (Server Component): `generateMetadata` com título "Convite — Kotta Groups", `robots: { index: false, follow: false }`, `referrer: "no-referrer"`; valida o token com `isInviteTokenShape` antes de qualquer chamada; com token válido, busca `previewInvite` e, se houver sessão (`getSessionToken`), `getMe` em `Promise.all`; usa `invitePageState` e renderiza com tokens `kotta-*`: emoji, nome do grupo, "Convite de <inviterName>", "Vale até <data pt-BR>"; `guest` → links "Criar conta" (`/cadastrar?next=…`) e "Já tenho conta" (`/entrar?next=…`); `member-ready` → "Entrando como <e-mail>" + form com `acceptInviteAction` e botão "Entrar no grupo" com estado de envio (`useFormStatus`, reusar componente de botão de envio existente se houver); `?erro=` com outro código mostra `friendlyMessage` (ou `rateLimitMessage`) acima do botão em `role="alert"`; `invalid` → "Este convite não vale mais", orientação de pedir novo link e "Ir para o Painel" (com sessão) ou "Entrar" (sem); `error` → mensagem amigável + link "Tentar de novo" para a mesma página; nenhum recurso externo; sem rolagem horizontal em 375 px
- [X] T015 [US1] Em `app/(conta)/grupos/[id]/page.tsx`, ler `searchParams.aviso` e mostrar no topo, em `role="status"`, "Você entrou em <grupo>." para `entrou` e "Você já fazia parte de <grupo>." para `ja-membro`
- [X] T016 [US1] Conferir que `proxy.ts` não precisa mudar (`/convite` fora de `PROTECTED` e `GUEST_ONLY`, e o `PATH_HEADER` gravado para `/convite/<token>` faz `apiRequest` devolver a pessoa ao convite após confirmar e-mail ou após sessão expirada); registrar a verificação no PR

**Checkpoint**: US1 funciona sozinha com links criados na API

---

## Phase 4: User Story 2 - Gerar e compartilhar um link de convite (Priority: P1)

**Goal**: modal "Convidar" para dono/admin com link de uso único (7 dias), copiar, compartilhar e QR

**Independent Test**: como admin, grupo → "Convidar" → "Gerar link" → "Copiar link"; abrir em outra sessão mostra a prévia certa; membro comum não vê o botão

### Tests for User Story 2

- [X] T017 [US2] Em `lib/invites.test.mjs`, testar `parseInviteForm` com formulário vazio → `{ input: { email: null, maxUses: 1, expiresInHours: 168 }, errors: {} }`, e `qrSvgPath(matrix)` para uma matriz 2×2 conhecida (string de `path` esperada, só módulos escuros, coordenadas inteiras)

### Implementation for User Story 2

- [X] T018 [US2] Implementar em `lib/invites.ts` a versão base de `parseInviteForm(formData-like)` (campos vazios → padrão de uso único e 7 dias) e `qrSvgPath(matrix: boolean[][]): string` (um subpath `M{x} {y}h1v1h-1z` por módulo escuro) até T017 passar
- [X] T019 [P] [US2] Em `components/app/copy-text-button.tsx`, adicionar prop opcional `failedLabel` (padrão: o texto atual "Não deu para copiar. Sua chave:") para o convite dizer "Não deu para copiar. Selecione o link acima e copie."; manter o uso atual inalterado
- [X] T020 [P] [US2] Criar `components/invites/qr-code.tsx` (`"use client"`): recebe `value`, chama `encode(value)` do `uqr`, desenha `<svg viewBox>` com margem de 4 módulos, fundo `kotta-surface`, um `<path d={qrSvgPath(...)}>` em `kotta-text`, `role="img"` e `aria-label="QR code do convite"`; tamanho fluido com máximo legível em 375 px
- [X] T021 [US2] Em `app/actions/invites.ts`, adicionar `createInviteAction(prev, formData)` com `useActionState`-compatível `InviteFormState` (`{ created?: { url, email, emailSent, maxUses, expiresAt }; error?; fieldErrors?; values? }`): lê `groupId` (vazio → erro "Grupo não encontrado."), valida com `parseInviteForm`, chama `POST /groups/{id}/invites` com o corpo validado, devolve só `url`/`email`/`emailSent`/`maxUses`/`expiresAt` (nunca `token` isolado), `revalidatePath(\`/grupos/${groupId}/membros\`)`; `ApiError` → `failure(error, values)` com `RATE_LIMITED` usando `rateLimitMessage(retryAfter)`
- [X] T022 [US2] Criar `components/invites/invite-dialog.tsx` (`"use client"`): botão "Convidar" (ref para devolver o foco) abre `<dialog>` com `showModal()` (padrão de `components/receipt/qr-scanner.tsx`, `aria-labelledby`, Esc/`onCancel` fecha, foco volta ao botão ao fechar); formulário com `groupId` oculto e botão "Gerar link" com `pending` (desabilitado e texto "Gerando…"); erros em `role="alert"` dentro do modal sem fechar e sem perder valores; resultado: `<label>` "Link do convite" + `<input readonly>` com o link (rola dentro do campo), `CopyTextButton` com `label="Copiar link"`, `copiedLabel="Link copiado"` e `failedLabel`, botão "Compartilhar" só se `navigator.share` existir após montar (`navigator.share({ title, url })`, ignorando cancelamento), `QrCode`, texto "Uso único · vale até <data>" e aviso "Este link só aparece agora. Depois, para compartilhar de novo, gere outro."; botão "Gerar outro" reinicia; controles ≥ 44 px e foco visível; se passar de ~200 linhas, extrair o bloco de resultado para `components/invites/created-invite.tsx`
- [X] T023 [US2] Montar `InviteDialog` em `app/(conta)/grupos/[id]/page.tsx` nas `actions` do cabeçalho, só quando `canInviteMembers(myRole)` e o grupo não estiver arquivado (`myRole` = papel de `me` em `group.members`)
- [X] T024 [US2] Montar `InviteDialog` em `app/(conta)/grupos/[id]/membros/page.tsx` (mesma condição da T023), perto do título

**Checkpoint**: US1 + US2 = MVP de ponta a ponta (gerar na web e entrar pelo link)

---

## Phase 5: User Story 3 - Convidar uma pessoa por e-mail (Priority: P2)

**Goal**: campo de e-mail no modal; aviso de e-mail diferente na página do convite com troca de conta

**Independent Test**: convidar um e-mail; modal confirma envio e mostra o link; abrir logado com outra conta mostra "Este convite foi enviado para outro e-mail" → "Sair e entrar com outra conta" volta ao convite

### Tests for User Story 3

- [X] T025 [US3] Em `lib/invites.test.mjs`, testar `parseInviteForm` com e-mail: inválido → `errors.email = "Informe um e-mail válido."`; válido com espaços → aparado; e-mail com `maxUses` 3 → `maxUses` forçado a 1; e `invitePageState` com `erro=INVITE_EMAIL_MISMATCH` e prévia ok → `email-mismatch`

### Implementation for User Story 3

- [X] T026 [US3] Em `lib/auth-validation.ts`, exportar `EMAIL_PATTERN` (sem mudar o comportamento atual)
- [X] T027 [US3] Estender `parseInviteForm` (usando `EMAIL_PATTERN`) e `invitePageState` (estado `email-mismatch`) em `lib/invites.ts` até T025 passar
- [X] T028 [P] [US3] Em `app/actions/auth.ts`, `logoutAction` passa a ler `next` opcional do `FormData` (via `safeNextPath`) e redireciona para `/entrar?motivo=saiu&next=<next>` quando `next !== "/"`; sem o campo, comportamento atual inalterado
- [X] T029 [US3] Em `components/invites/invite-dialog.tsx`, adicionar campo "E-mail (opcional)" com `<label>` visível, `type="email"`, erro ligado por `aria-describedby`; botão passa a "Enviar convite" quando há e-mail; resultado com e-mail mostra, em `aria-live="polite"`, "Convite enviado para <e-mail>." se `emailSent`, ou "Não conseguimos enviar o e-mail. Compartilhe o link abaixo." se `emailSent === false`, sempre junto do link
- [X] T030 [US3] Em `app/(acesso)/convite/[token]/page.tsx`, renderizar o estado `email-mismatch`: prévia + "Este convite foi enviado para outro e-mail. Você está como <e-mail>." + formulário de `logoutAction` com `next=inviteReturnPath(token)` e botão "Sair e entrar com outra conta"

**Checkpoint**: US3 funciona com US1/US2

---

## Phase 6: User Story 4 - Ver e revogar convites do grupo (Priority: P2)

**Goal**: seção "Convites" em Membros com Pendentes/Encerrados e revogar

**Independent Test**: criar dois convites, revogar um; ele aparece como "Revogado" em Encerrados e o link dele mostra a mensagem de inválido

### Tests for User Story 4

- [X] T031 [US4] Em `lib/invites.test.mjs`, testar `splitInvites(invites, membersById)`: `active` vai para pendentes; `exhausted` → "Usado", `expired` → "Expirado", `revoked` → "Revogado" em encerrados; `target` = e-mail ou "Link"; `creatorName` do mapa ou "Ex-membro"; ordem mantida (mais recente primeiro)

### Implementation for User Story 4

- [X] T032 [US4] Implementar `splitInvites` em `lib/invites.ts` retornando `{ pending: InviteRow[]; closed: InviteRow[] }` até T031 passar
- [X] T033 [US4] Em `app/actions/invites.ts`, adicionar `revokeInviteAction(formData)`: valida `groupId` e `inviteId`, `DELETE /groups/{id}/invites/{inviteId}` via `apiRequest`, `ApiError` → redirect `/grupos/<id>/membros?erro=<CODE>` (padrão `act` de `app/actions/groups.ts`), sucesso → `revalidatePath(\`/grupos/${groupId}/membros\`)` e redirect para `/grupos/<id>/membros?aviso=convite-revogado`
- [X] T034 [P] [US4] Criar `components/invites/revoke-invite-button.tsx` (`"use client"`): form com `revokeInviteAction`, campos ocultos, `window.confirm("Revogar este convite? O link deixa de funcionar na hora.")` no submit (padrão de `components/forms/delete-category-button.tsx`), `aria-label="Revogar convite <alvo>"`, ≥ 44 px
- [X] T035 [US4] Criar `components/invites/invite-list.tsx` (Server Component async, props `groupId` e `members`): busca `listGroupInvites`; falha → aviso local em `role="alert"` com link "Tentar de novo" para `/grupos/<id>/membros`; vazio → "Nenhum convite ainda. Use “Convidar” para gerar o primeiro link."; senão seções "Pendentes" (alvo, "por <criador>", "<usos>/<máximo> usos", "Vale até <data>", `RevokeInviteButton`) e "Encerrados" (motivo e data); nota "O link de um convite só aparece quando ele é criado. Para compartilhar de novo, gere outro."; com `hasMore`, "Mostrando os 50 convites mais recentes."
- [X] T036 [US4] Em `app/(conta)/grupos/[id]/membros/page.tsx`, renderizar a seção "Convites" (`SectionLabel`) com `InviteList` dentro de `<Suspense>` e esqueleto com tokens `kotta-*` e `motion-safe:animate-pulse`, só para `canInviteMembers(myRole)`; mostrar `?aviso=convite-revogado` como "Convite revogado." em `role="status"`

**Checkpoint**: US4 funciona com US1/US2

---

## Phase 7: User Story 5 - Um link para várias pessoas, com validade escolhida (Priority: P3)

**Goal**: escolher limite de pessoas e validade ao gerar

**Independent Test**: link para 3 pessoas; três contas entram; a quarta vê inválido; preencher e-mail esconde "Várias pessoas"

### Tests for User Story 5

- [X] T037 [US5] Em `lib/invites.test.mjs`, testar `parseInviteForm` com `maxUses` 0, 101, 2.5 e "abc" → `errors.maxUses = "Escolha de 1 a 100 pessoas."`; `maxUses` 100 ok; `expiresInHours` fora de `1|24|168|720` → `errors.expiresInHours = "Escolha uma validade da lista."`

### Implementation for User Story 5

- [X] T038 [US5] Estender `parseInviteForm` em `lib/invites.ts` (inteiro entre `INVITE_MAX_USES_MIN` e `INVITE_MAX_USES_MAX`; validade pertencente a `INVITE_EXPIRY_OPTIONS`) até T037 passar
- [X] T039 [US5] Em `components/invites/invite-dialog.tsx`, adicionar escolha "Uma pessoa" / "Várias pessoas" (radios com `<fieldset>`/`<legend>`); "Várias pessoas" mostra campo numérico rotulado "Até quantas pessoas" (`min=1`, `max=100`); `<select>` rotulado "Validade" com `INVITE_EXPIRY_OPTIONS` (padrão 7 dias); com e-mail preenchido, "Várias pessoas" fica indisponível e explicado ("Convite por e-mail vale para uma pessoa."); resultado mostra "Até N pessoas · vale até <data>"; erros por campo via `aria-describedby`

**Checkpoint**: todas as histórias funcionam de forma independente

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T040 Revisar que nenhum token de convite aparece em `console.*` ou logs: conferir `app/actions/invites.ts` e `lib/api/server.ts` (que já registra só o caminho, sem corpo) e o `beforeSend` da T011
- [X] T041 [P] Conferir tamanhos (componentes ≤ 200 linhas, funções ≤ 40, aninhamento ≤ 3) em `components/invites/*.tsx` e `app/(acesso)/convite/[token]/page.tsx`; dividir se necessário
- [X] T042 Rodar `pnpm lint`, `pnpm test` e `pnpm build` e corrigir o que falhar
- [ ] T043 Executar o roteiro de `specs/019-group-invite-links/quickstart.md` em 375 px e desktop (teclado só, leitor de tela para os anúncios, `prefers-reduced-motion`) e anotar o resultado no PR
- [ ] T044 [P] Atualizar o status em `specs/019-group-invite-links/spec.md` e marcar os critérios de aceite da issue #27 no PR (com a justificativa do `uqr` na descrição)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depois do Setup; bloqueia todas as histórias (T007 depende de T003 e T005)
- **US1 (Phase 3)** e **US2 (Phase 4)**: depois da Foundational; independentes entre si (US1 testável com links criados na API; US2 testável abrindo o link gerado)
- **US3 (Phase 5)**: estende o modal da US2 (T029) e a página da US1 (T030)
- **US4 (Phase 6)**: depende só da Foundational; usa `InviteDialog` só para criar convites de teste (pode-se criar na API)
- **US5 (Phase 7)**: estende o modal da US2 (T039)
- **Polish (Phase 8)**: depois das histórias desejadas

### User Story Dependencies

```text
Foundational ─┬─▶ US1 ─┐
              ├─▶ US2 ─┼─▶ US3
              │        └─▶ US5
              └─▶ US4
```

### Within Each User Story

- Teste em `lib/invites.test.mjs` antes da implementação em `lib/invites.ts`
- Regras em `lib/` → Server Actions → componentes → páginas
- Tarefas em `lib/invites.ts`/`lib/invites.test.mjs` e em `invite-dialog.tsx` são sequenciais

### Parallel Opportunities

- Phase 1: T002 em paralelo com T001
- Phase 2: T003, T004, T005, T006 em paralelo; T007 depois
- US1: T011 e T012 em paralelo com T013/T014
- US2: T019 e T020 em paralelo com T021
- US3: T028 em paralelo com T026/T027/T029
- US4: T034 em paralelo com T033
- Com duas pessoas: US1 e US4 em paralelo com US2 depois da Foundational

---

## Parallel Example: User Story 2

```bash
Task: "T019 [P] [US2] failedLabel em components/app/copy-text-button.tsx"
Task: "T020 [P] [US2] QrCode em components/invites/qr-code.tsx"
# Em seguida, sequencial:
Task: "T021 [US2] createInviteAction em app/actions/invites.ts"
Task: "T022 [US2] InviteDialog em components/invites/invite-dialog.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1 + Phase 2
2. US1 (página do convite) → validar com link criado na API
3. US2 (modal) → validar gerar → copiar → abrir → entrar
4. **PARAR e validar**: é o MVP da issue (hoje é impossível trazer alguém novo para o grupo)

### Incremental Delivery

1. MVP (US1 + US2) → PR possível
2. US4 (revogar) → segurança para links vazados
3. US3 (e-mail)
4. US5 (várias pessoas/validade), adiável sem quebrar nada

---

## Notes

- [P] = arquivos diferentes, sem dependência pendente
- Commits em inglês, Conventional Commits (`feat(invites): …`, `test(invites): …`)
- Textos da UI em pt-BR; identificadores e erros de API em inglês
- Nada de `"use client"` além de `invite-dialog.tsx`, `qr-code.tsx`, `revoke-invite-button.tsx` (e o botão de envio da página, se não houver um reutilizável)
