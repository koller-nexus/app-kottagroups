---

description: "Task list for 027-pix-key-password"
---

# Tasks: Pedir a senha atual para trocar a chave Pix no perfil

**Input**: Design documents from `/specs/027-pix-key-password/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/profile-update.md,
quickstart.md

**Tests**: pedidos. O FR-012 exige e2e de `/perfil`, e a constituição (V) exige teste para a regra
nova em `lib/`.

**Organization**: as três histórias são P1 e mexem nos mesmos dois arquivos (a action e o
formulário). Por isso a base comum fica na Fase 2, e cada história acrescenta só a sua parte.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem depender de tarefa pendente)
- **[Story]**: história do spec.md (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: confirmar que a branch parte de um estado verde.

- [X] T001 Rodar `pnpm test` e `pnpm lint` na branch `feature/027-pix-key-password` e confirmar que passam antes de qualquer mudança

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: a regra pura do perfil, o helper de senha sem `trim` e o mock do e2e. Todas as
histórias dependem disso.

**⚠️ CRITICAL**: nenhuma história começa antes desta fase.

- [X] T002 [P] Escrever `lib/profile-update.test.mjs` (node:test, import de `./profile-update.ts`) com as tabelas do `data-model.md`:
  - `isPixKeyChange(typed, saved)` = `typed.trim() !== saved`, cobrindo as 6 linhas: igual, igual com espaços, troca, remoção (`""` com chave salva), primeira chave, ambos vazios.
  - `profileUpdateBody({ name, pixKey, savedPixKey, currentPassword })`: chave não mudou → `{ name }`; troca ou primeira chave → `{ name, pixKey, currentPassword }`; remoção → `{ name, pixKey: null, currentPassword }`; senha vai como foi digitada, inclusive `""` e com espaços.
  - `passwordErrorMessage(code, retryAfter)`: `CURRENT_PASSWORD_REQUIRED` → "Digite sua senha atual para trocar a chave Pix."; `CURRENT_PASSWORD_INVALID` → "Senha incorreta."; `RATE_LIMITED` → igual a `rateLimitMessage(retryAfter)`; outro código (ex.: `VALIDATION_FAILED`) → `undefined`.
- [X] T003 Criar `lib/profile-update.ts` com `isPixKeyChange`, `profileUpdateBody` e `passwordErrorMessage`, códigos de erro como constantes, reusando `rateLimitMessage` de `lib/api/errors.ts` (imports relativos com `.ts`); `pnpm test` passa com T002
- [X] T004 [P] Mover `rawText(formData, key)` (valor sem `trim`) de `app/actions/auth.ts` para `lib/form.ts` como export, e importar de lá em `app/actions/auth.ts` (arquivo `"use server"` não pode exportar função síncrona)
- [X] T005 [P] Em `e2e/mock-api-proxy.ts`, fazer `PUT /__mock/fail` aceitar `method` opcional (padrão `GET`) e `code` opcional (padrão `SERVICE_UNAVAILABLE`); o mapa `failures` passa a ter chave `"<METHOD> <path>"` e guardar `{ status, code }`; a checagem de falha usa o método da requisição; `DELETE /__mock/fail` continua limpando tudo
- [X] T006 Em `e2e/profile.spec.ts`, estender `failApi(path, status = 503)` para aceitar `{ method, code }` opcionais e repassar ao mock, sem mudar as chamadas existentes (depende de T005)

**Checkpoint**: `pnpm test` verde; os e2e atuais de `/perfil` continuam passando com o mock novo.

---

## Phase 3: User Story 1 - Trocar a chave Pix confirmando a senha (Priority: P1) 🎯 MVP

**Goal**: trocar, cadastrar ou apagar a chave pedindo a senha atual, e salvar com a senha certa.

**Independent Test**: no `/perfil`, trocar a chave, informar a senha correta e salvar; a chave nova
aparece no resumo e o campo de senha some.

### Tests for User Story 1

- [X] T007 [US1] Em `e2e/profile.spec.ts`, teste "trocar a chave Pix com a senha certa salva": digita `e2e-${runId}@example.com` na chave, confere que o campo "Senha atual" aparece, preenche `E2E_PASSWORD`, salva, vê "Alterações salvas.", a chave nova no resumo e o campo "Senha atual" escondido. Não restaura a chave (research R6: uma única checagem de senha real por execução)

### Implementation for User Story 1

- [X] T008 [US1] Em `app/actions/kotta.ts`, `updateProfileAction`:
  - exportar `type ProfileFormState = FormState & { passwordError?: string }` e usá-lo como tipo de `_prev` e do retorno;
  - ler `savedPixKey` com `text()` e `currentPassword` com `rawText()` (T004);
  - montar o corpo com `profileUpdateBody` (T003) no lugar de `{ name, pixKey: pixKey || null }`;
  - `values` continua `{ name, pixKey }` — nunca `currentPassword` nem `savedPixKey` (FR-009);
  - o erro de nome vazio continua antes de chamar a API.
- [X] T009 [US1] Em `components/forms/profile-form.tsx`:
  - nova prop não é necessária: `pixKey` (prop) é a chave salva; renderizar `<input type="hidden" name="savedPixKey" value={pixKey} />`;
  - guardar em estado se a chave digitada difere da salva (`isPixKeyChange`), atualizado no `onChange` do campo `pixKey` e recalculado a partir de `state.values.pixKey` a cada novo `state` (padrão `seenState` de `components/auth/use-field-errors.ts`);
  - quando difere, renderizar `Field` "Senha atual" antes do botão: `id`/`name` `currentPassword`, `type="password"`, `autoComplete="current-password"`, sem `defaultValue` (o reset do React depois da action o deixa vazio, FR-008/FR-010);
  - tipar `useActionState` com `ProfileFormState`.

**Checkpoint**: T007 passa; trocar, cadastrar e apagar a chave com a senha certa funciona à mão
(quickstart passos 2, 5 e 6).

---

## Phase 4: User Story 2 - Editar só o nome continua sem senha (Priority: P1)

**Goal**: editar só o nome não mostra campo de senha nem manda a chave.

**Independent Test**: no `/perfil`, mudar só o nome e salvar; o nome novo aparece no shell e no
resumo, sem campo de senha.

**Depende de**: Fase 3 (a regra de envio vem de `profileUpdateBody`, já coberta pelo T002 para o caso
`{ name }`).

### Tests for User Story 2

- [X] T010 [US2] Em `e2e/profile.spec.ts`, teste "editar só o nome salva sem pedir senha": muda o nome para `E2E nome ${runId}`, confere que "Senha atual" não aparece, salva, vê "Alterações salvas." e o nome novo no resumo da conta
- [X] T011 [US2] No mesmo arquivo `e2e/profile.spec.ts`, teste "voltar a chave ao valor salvo esconde a senha": digita outra chave (campo aparece), devolve o valor salvo (campo some), sem salvar

### Implementation for User Story 2

- [X] T012 [US2] Conferir em `components/forms/profile-form.tsx` que o campo "Senha atual" não é renderizado (nem escondido por CSS) quando a chave volta ao valor salvo, para o navegador não enviar `currentPassword` (FR-003); ajustar se T011 falhar

**Checkpoint**: T010 e T011 passam; quickstart passo 1.

---

## Phase 5: User Story 3 - Erro de senha mostrado no campo, sem perder o que foi digitado (Priority: P1)

**Goal**: senha ausente, errada ou excesso de tentativas aparece no campo de senha, mantendo nome e
chave, sem deslogar.

**Independent Test**: no `/perfil`, trocar a chave e salvar sem senha; o erro aparece no campo de
senha e a chave digitada continua lá. Repetir com a senha errada (pelo mock).

### Tests for User Story 3

- [X] T013 [US3] Em `e2e/profile.spec.ts`, teste "trocar a chave sem senha mostra o erro no campo": digita `e2e-${runId}-sem-senha@example.com`, deixa a senha vazia, salva, na API real (`CURRENT_PASSWORD_REQUIRED` vem antes do limitador, não gasta tentativa); confere "Digite sua senha atual para trocar a chave Pix." ligado ao campo "Senha atual" e a chave digitada mantida
- [X] T014 [US3] Em `e2e/profile.spec.ts`, teste "senha errada mostra o erro no campo e mantém a sessão": `failApi("/api/v1/users/me", 403, { method: "PATCH", code: "CURRENT_PASSWORD_INVALID" })`, digita outra chave e uma senha qualquer, salva; confere "Senha incorreta." no campo, campo de senha vazio, nome e chave mantidos e a URL ainda em `/perfil`

### Implementation for User Story 3

- [X] T015 [US3] Em `app/actions/kotta.ts`, no `catch` de `updateProfileAction`: se `error` é `ApiError` e `passwordErrorMessage(error.code, error.retryAfter)` devolve texto, retornar `{ passwordError, values: { name, pixKey } }`; senão seguir em `failure(error, values)` como hoje (`VALIDATION_FAILED`, 503 e rede caem no erro geral)
- [X] T016 [US3] Em `components/forms/profile-form.tsx`:
  - mostrar o campo "Senha atual" também quando `state.passwordError` existe (cobre o envio sem JavaScript, edge case do spec);
  - passar `error={state.passwordError}` ao `Field` (o `aria-describedby`/`aria-invalid` já vêm dele);
  - `useEffect` em `state` que foca o campo de senha (ref) quando há `passwordError` (FR-005, cenário 4).

**Checkpoint**: T013 e T014 passam; quickstart passos 3, 4, 7 e 8.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T017 [P] Conferir que a senha não aparece no estado devolvido: no passo 4 do `specs/027-pix-key-password/quickstart.md`, a resposta da Server Action na aba Network não contém a senha digitada (FR-009, SC-005)
- [ ] T018 Rodar a validação do `specs/027-pix-key-password/quickstart.md`: `pnpm test`, `pnpm lint`, `API_ORIGIN=... pnpm test:e2e e2e/profile.spec.ts` e `pnpm build`, todos passando
- [ ] T019 Percorrer o roteiro manual do `specs/027-pix-key-password/quickstart.md` (passos 1 a 9) e marcar no PR o que foi visto

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependência.
- **Foundational (Fase 2)**: depende da Fase 1; bloqueia todas as histórias.
- **US1 (Fase 3)**: depende da Fase 2. É o MVP.
- **US2 (Fase 4)**: depende da Fase 3 (mesmos arquivos; a regra de envio vem do T008/T009).
- **US3 (Fase 5)**: depende da Fase 3 (o campo de senha e o `ProfileFormState` vêm do T008/T009).
  Pode rodar em paralelo com a Fase 4 só nos testes, porque a implementação mexe nos mesmos arquivos.
- **Polish (Fase 6)**: depende das Fases 3 a 5.

### Within Each Phase

- T002 antes de T003 (teste primeiro).
- T005 antes de T006.
- `app/actions/kotta.ts` (T008, T015) e `components/forms/profile-form.tsx` (T009, T012, T016) são
  editados em sequência.
- Todos os e2e (T006, T007, T010, T011, T013, T014) estão em `e2e/profile.spec.ts`: escrever em
  sequência. O Playwright roda com `workers: 1`.

### Parallel Opportunities

- Fase 2: T002, T004 e T005 em paralelo (arquivos diferentes).
- Dentro de cada história: o teste e2e pode ser escrito em paralelo com a implementação, porque estão
  em arquivos diferentes.

---

## Parallel Example: Fase 2

```bash
Task: "Escrever lib/profile-update.test.mjs com as tabelas do data-model.md"
Task: "Mover rawText de app/actions/auth.ts para lib/form.ts"
Task: "PUT /__mock/fail aceita method e code em e2e/mock-api-proxy.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Testes e2e T013 e T014 em e2e/profile.spec.ts"
Task: "passwordError no catch de updateProfileAction em app/actions/kotta.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Fases 1 e 2.
2. Fase 3: trocar a chave com a senha certa volta a funcionar.
3. **Parar e validar**: T007 passa. Sem a Fase 5, senha ausente ou errada ainda cai no erro geral do
   topo, mas não salva nada.

### Incremental Delivery

1. Base + US1 → a troca de chave funciona de novo (MVP).
2. US2 → edição de nome coberta por teste, sem regressão.
3. US3 → erros no campo certo, foco e fluxo sem JavaScript.
4. Polish → quickstart completo e PR.

As três histórias são P1 e entram no mesmo PR.

---

## Notes

- Uma única checagem de senha real por execução do e2e (T007). Senha errada vem do mock (T014);
  senha ausente não conta no limite (T013).
- A chave do usuário de teste não é restaurada (research R6).
- Commit por fase ou grupo lógico, em `feature/027-pix-key-password`.
