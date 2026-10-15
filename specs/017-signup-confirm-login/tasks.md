---

description: "Tasks for 017 — rever fluxo de criar conta, confirmação de e-mail e login"
---

# Tasks: Rever fluxo de criar conta, confirmação de e-mail e login

**Input**: Design documents from `/specs/017-signup-confirm-login/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/routes-and-actions.md, quickstart.md

**Tests**: pedidos pela spec (SC-007) e pela Constitution V. Testes `node --test` em `lib/**/*.test.mjs`, rodando com `pnpm test`. Módulos de `lib/` testados importam dependências com caminho relativo e extensão `.ts` (ex.: `./safe-next.ts`), como os existentes.

**Organization**: tarefas agrupadas por user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1…US5 da spec

---

## Phase 1: Setup

**Purpose**: dependências externas e constantes compartilhadas

- [ ] T001 Abrir 3 issues em koller-nexus/api-kottagroups (ver contracts/routes-and-actions.md → "Dependências externas"): (1) aceitar `termsVersion`/`privacyVersion` no `POST /auth/register` e registrar versão, data/hora e IP; (2) códigos distintos para confirmação expirada e já usada; (3) trocar `/confirm-email` por `/confirmar-email` e o link de recuperação por `/redefinir-senha`. Anotar os números em specs/017-signup-confirm-login/research.md (R1, R2, R7)
- [X] T002 [P] Criar lib/legal.ts com `TERMS_VERSION = "2026-10"`, `PRIVACY_VERSION = "2026-10"` e `LEGAL_UPDATED_AT = "2026-10-15"`

---

## Phase 2: Foundational (bloqueia as stories)

**Purpose**: regras puras, erros da API e campos acessíveis usados por várias stories

- [X] T003 [P] Criar lib/auth-validation.ts com `validateRegistration({ name, email, password, pixKey, acceptTerms }) → FieldErrors`, `validateLogin({ email, password }) → FieldErrors`, `isPasswordLengthOk(password)` e `fieldErrorFromApi(message) → { field, message } | undefined`. Regras e textos exatos (data-model.md): name não vazio após trim → "Informe seu nome."; email `^[^\s@]+@[^\s@]+\.[^\s@]+$` → "Informe um e-mail válido."; password ≥ 8 caracteres e ≤ 72 bytes UTF-8 (`new TextEncoder().encode(p).length`) → "A senha precisa ter de 8 a 72 caracteres."; pixKey opcional, ≤ 140 caracteres, formato e-mail, UUID, 11 ou 14 dígitos, ou telefone com 10–13 dígitos → "Use CPF, CNPJ, e-mail, celular ou chave aleatória."; acceptTerms marcado → "Para criar a conta, aceite os Termos de Uso e a Política de Privacidade."; login: password vazia → "Informe sua senha.". `fieldErrorFromApi` mapeia pelo prefixo da mensagem da API: `Name` → name, `Email` → email, `Password` → password, `Pix key is too long` → pixKey "A chave Pix pode ter até 140 caracteres.", `Pix key is invalid` → pixKey "Essa chave Pix não é válida. Confira CPF, CNPJ, e-mail, celular ou chave aleatória."
- [X] T004 [P] Criar lib/auth-validation.test.mjs cobrindo: cada campo inválido, senha com 72 bytes ok e com 73 bytes (acentos) recusada, Pix vazio aceito, Pix `123` recusado, aceite ausente, e `fieldErrorFromApi` para as 7 mensagens da API em research.md R5 e para uma mensagem desconhecida (→ undefined)
- [X] T005 Em lib/api/errors.ts: adicionar `readonly retryAfter?: number` em `ApiError` (4º parâmetro opcional do construtor); adicionar `case "EMAIL_NOT_CONFIRMED"` → "Confirme seu e-mail para continuar." e `case "INVALID_TOKEN"` → "Este link não é mais válido. Peça um novo."; trocar `RATE_LIMITED` por "Muitas tentativas seguidas. Espere um pouco e tente de novo."; exportar `rateLimitMessage(retryAfter?: number)` que devolve "Muitas tentativas seguidas. Tente de novo em N s." (< 60) ou "…em N min." (arredondado para cima) e a mensagem genérica sem valor
- [X] T006 Em lib/api/server.ts: ler `Retry-After` quando for inteiro positivo e passar como `retryAfter` ao `ApiError`; no redirect de `403 EMAIL_NOT_CONFIRMED`, ir para `/confirme-seu-email?next=<safeNextPath(currentPath())>` (sem `next` quando for `/`)
- [X] T007 Em lib/api/errors.test.mjs: testar os novos códigos de `friendlyMessage`, `rateLimitMessage(30)`, `rateLimitMessage(90)` → "2 min", `rateLimitMessage()` e que `new ApiError(429, "RATE_LIMITED", "x", 45).retryAfter === 45`
- [X] T008 [P] Em components/auth/field.tsx: prop `error?: string`; quando presente, `aria-invalid="true"`, mensagem em `<p id="{id}-error" className="mt-1.5 text-[13px] text-kotta-danger">` e `aria-describedby` com hint e erro juntos (separados por espaço); borda `border-kotta-danger` no erro
- [X] T009 [P] Criar components/auth/password-field.tsx (`"use client"`): envolve `Field` com `type` alternando `password`/`text` e um botão "Mostrar"/"Ocultar" (`type="button"`, `aria-pressed`, `aria-controls={id}`, `min-h-11`, foco visível com `kotta-primary`); repassa `ref`, `onChange`, `autoComplete`, `error`, `hint`

**Checkpoint**: `pnpm test` verde com os novos testes.

---

## Phase 3: User Story 1 — Criar conta pelo celular e chegar logado ao Painel (P1) 🎯 MVP

**Goal**: cadastro → e-mail → link → Painel logado, sem telas sem saída e sem falar em app.

**Independent Test**: quickstart cenários 1, 2, 3, 4, 5, 9 e 17.

### Tests

- [X] T010 [P] [US1] Reescrever lib/confirm-email.test.mjs para `confirmationOutcome({ token, status, sessionUser })`: token vazio/espaços → `missing`; 200 → `success`; 400 com `sessionUser.emailConfirmed=true` → `already-confirmed`; 400 sem sessão ou não confirmado → `invalid-or-expired`; 503 e status 0 (rede) → `unexpected-error`; `signedIn` reflete `sessionUser !== undefined`
- [X] T011 [P] [US1] Em lib/session-flow.test.mjs: `loginNotice("conta-criada")` → "Conta criada! Entre para continuar." e `accountCreatedLoginUrl("a+b@x.com")` → `/entrar?motivo=conta-criada&email=a%2Bb%40x.com`

### Implementation

- [X] T012 [P] [US1] Em lib/confirm-email.ts: substituir o conteúdo por `type ConfirmationState = "success" | "already-confirmed" | "missing" | "invalid-or-expired" | "unexpected-error"`, `isUsableConfirmationToken` (manter) e `confirmationOutcome({ token, status, sessionUser }) → { state, signedIn }` conforme a tabela de data-model.md; remover `confirmEmail` (fetch), `getConfirmationState`, `isExpiredConfirmationError` e `getConfirmationErrorMessage`
- [X] T013 [P] [US1] Em lib/session-flow.ts: adicionar `"conta-criada": "Conta criada! Entre para continuar."` em `NOTICES` e exportar `accountCreatedLoginUrl(email)` usando `URLSearchParams({ motivo: "conta-criada", email })`; garantir que `logoutDestination` continue ignorando motivos que não sejam de sessão expirada
- [X] T014 [US1] Em app/actions/auth.ts `signIn`: tipar a resposta como `{ user: ApiUser; accessToken?: string; token?: string }` e gravar `accessToken ?? token`; lançar `ApiError(502, "INVALID_LOGIN_RESPONSE", …)` se nenhum vier. Não guardar `refreshToken` (research R6)
- [X] T015 [US1] Em app/actions/auth.ts `registerAction`: separar em dois `try`: falha no `POST /auth/register` segue como hoje; falha no `signIn` depois do cadastro ok → `redirect(accountCreatedLoginUrl(email))` (o `redirect` fica fora do `catch`)
- [X] T016 [US1] Em app/actions/auth.ts: criar `confirmEmailAction(token: string)` que chama `apiRequest("/auth/confirm-email", { method: "POST", auth: false, body: { token } })`; em `ApiError` 4xx, se `getSessionToken()` existir e `!isSessionExpired(token)`, buscar `/users/me`; montar o resultado com `confirmationOutcome`; em sucesso com sessão chamar `revalidatePath("/", "layout")`. Nunca registrar nem devolver o token
- [X] T017 [US1] Mover app/(acesso)/confirm-email/page.tsx para app/(acesso)/confirmar-email/page.tsx e app/(acesso)/forget-password/page.tsx para app/(acesso)/redefinir-senha/page.tsx; adicionar `metadata.title` "Confirmar e-mail — Kotta Groups" na primeira
- [X] T018 [US1] Em next.config.ts `redirects()`: `{ source: "/confirm-email", destination: "/confirmar-email", permanent: false }` e `{ source: "/forget-password", destination: "/redefinir-senha", permanent: false }` (a query é repassada pelo Next)
- [X] T019 [US1] Reescrever components/confirm-email/confirm-email-screen.tsx para chamar `confirmEmailAction` no efeito (com `attempt` para "Tentar novamente") e renderizar os estados com as ações de data-model.md: success/already-confirmed → "E-mail confirmado" + "Sua conta está pronta." + "Continuar" (`/`) com sessão ou "Entrar" (`/entrar?next=/`) sem; missing → "Link incompleto"; invalid-or-expired → "Link inválido ou expirado" + "O link vale 24 horas e só pode ser usado uma vez. Peça um novo."; ambos com "Reenviar link" (`/confirme-seu-email` com sessão, `/entrar?next=/confirme-seu-email` sem) e "Ir para o início"; unexpected-error → "Tentar novamente". Remover "Abra o app Kotta Groups"
- [X] T020 [P] [US1] Em components/forget-password/forget-password-screen.tsx: trocar "Abra o app Kotta Groups e entre com a nova senha." por "Sua senha foi alterada. Entre com a nova senha." com CTA "Entrar" (`/entrar`); trocar "Solicite um novo link no app para continuar." por texto com link para `/esqueci-a-senha` ("Pedir um novo link")
- [X] T021 [P] [US1] Copy sem app: app/(acesso)/entrar/page.tsx → "Entre para ver seus grupos e despesas."; app/(acesso)/cadastrar/page.tsx → "Com a conta você divide gastos com seus grupos."
- [X] T022 [US1] Rodar `rg -i "app kotta|no app|do app" app components lib` e revisar app/page.tsx, components/app/dashboard.tsx, components/app/dashboard-view.tsx, components/app/price.tsx, components/forms/category-form.tsx, app/globals.css: remover copy visível que mande abrir um app; comentários de código sobre o mobile ficam

**Checkpoint**: US1 funciona de ponta a ponta (sem o aceite, que vem na US2).

---

## Phase 4: User Story 2 — Aceitar Termos de Uso e Política de Privacidade (P1)

**Goal**: cadastro só com aceite; `/termos` e `/privacidade` públicos.

**Independent Test**: quickstart cenários 6, 15 e 16.

### Implementation

- [X] T023 [P] [US2] Criar components/legal/legal-document.tsx (Server Component): recebe `{ title, version, updatedAt, draft, sections }`; renderiza `h1`, "Última atualização: {data por extenso pt-BR via Intl.DateTimeFormat} · Versão {version}", aviso "Rascunho: este texto ainda passa por revisão jurídica." quando `draft`, índice `<nav aria-label="Nesta página">` com links `#id`, e cada seção como `<section id>` + `h2`
- [X] T024 [P] [US2] Criar content/legal/terms-2026-10.tsx exportando `{ version: TERMS_VERSION, updatedAt: LEGAL_UPDATED_AT, draft: true, sections }` com seções: aceitação, o serviço, conta e segurança, uso permitido, conteúdo enviado (despesas, notas, imagens), Pix e pagamentos entre membros (o Kotta não processa pagamentos), suspensão e encerramento, limitação de responsabilidade, mudanças nos termos, lei aplicável e contato
- [X] T025 [P] [US2] Criar content/legal/privacy-2026-10.tsx (`draft: true`) com as seções exigidas pelo FR-029: controlador e contato do encarregado (e-mail placeholder marcado no rascunho); dados coletados (nome, e-mail, chave Pix, foto, grupos, despesas, notas fiscais/NFC-e e imagens enviadas, dados de uso, IP e logs); finalidades e bases legais (art. 7º LGPD); compartilhamento com operadores (Vercel, armazenamento OCI, e-mail transacional, Sentry, provedores de LLM/OCR via OpenRouter); retenção; direitos do titular (art. 18) e como exercê-los; cookies (`kotta_session` estritamente necessário, Vercel Analytics); transferência internacional
- [X] T026 [US2] Criar app/(legal)/layout.tsx: `<main>` com fundo `bg-kotta-bg`, link com logo para `/` (mesmo do `PublicFrame`), conteúdo em `max-w-prose` com gutter de 16px no mobile, e rodapé com links Termos/Privacidade
- [X] T027 [P] [US2] Criar app/(legal)/termos/page.tsx (metadata "Termos de Uso — Kotta Groups") e app/(legal)/privacidade/page.tsx (metadata "Política de Privacidade — Kotta Groups") renderizando `LegalDocument` com o conteúdo de T024/T025. Não adicionar as rotas a `PROTECTED`/`GUEST_ONLY` em proxy.ts
- [X] T028 [P] [US2] Em components/app/public-frame.tsx: rodapé abaixo do cartão com links "Termos de Uso" (`/termos`) e "Privacidade" (`/privacidade`), `text-sm text-kotta-muted`, alvo ≥ 44px
- [X] T029 [P] [US2] Em app/(conta)/perfil/page.tsx: links "Termos de Uso" e "Política de Privacidade" no resumo da conta
- [X] T030 [US2] Em components/auth/register-form.tsx: checkbox `acceptTerms` desmarcado por padrão com rótulo "Li e aceito os Termos de Uso e a Política de Privacidade" (links com `target="_blank" rel="noopener noreferrer"`), alvo ≥ 44px, erro associado via `aria-describedby`/`aria-invalid`
- [X] T031 [US2] Em app/actions/auth.ts `registerAction`: ler `acceptTerms` (`formData.get("acceptTerms") === "on"`) e rodar `validateRegistration` antes de chamar a API; com erros devolver `{ fieldErrors, fields }` sem chamar `/auth/register`. Enviar `termsVersion: TERMS_VERSION` e `privacyVersion: PRIVACY_VERSION` no corpo (api-kottagroups spec 066)

**Checkpoint**: US1 + US2 = MVP publicável.

---

## Phase 5: User Story 3 — Confirmação de e-mail que informa o que está acontecendo (P2)

**Goal**: "Já confirmei" com aviso, contagem de 60 s, dica de spam, corrigir e-mail, avanço automático.

**Independent Test**: quickstart cenários 10, 11, 12 e 18.

### Implementation

- [X] T032 [US3] Em app/actions/auth.ts: criar `checkConfirmationAction(prev, formData)` que lê `next` (via `safeNextPath`), busca `/users/me` e faz `redirect(next)` se `emailConfirmed`; senão devolve `{ message: "Ainda não recebemos a confirmação. Abra o link no seu e-mail." }`; `ApiError` → `{ message: friendlyMessage(code) }`
- [X] T033 [US3] Em app/actions/auth.ts `resendConfirmationAction`: com `const RESEND_INTERVAL_SECONDS = 60`, sucesso → `{ status: "sent", message: "Enviamos um novo link para o seu e-mail.", retryAfter: RESEND_INTERVAL_SECONDS }`; `RATE_LIMITED` → `{ status: "error", message: "Você acabou de pedir um link. Aguarde para pedir outro.", retryAfter: error.retryAfter ?? RESEND_INTERVAL_SECONDS }`
- [X] T034 [US3] Em components/auth/resend-confirmation.tsx: quando o estado traz `retryAfter`, desabilitar o botão e mostrar "Reenviar em {n} s", decrementando a cada segundo com `setInterval` limpo no unmount; a contagem é texto (`aria-live` só para a mensagem do envio, não para cada segundo)
- [X] T035 [P] [US3] Criar components/auth/confirmation-check.tsx (`"use client"`): formulário com `useActionState(checkConfirmationAction)`, campo oculto `next`, botão primário "Já confirmei" ("Verificando…" pendente) e mensagem `role="status"`; efeito que chama `router.refresh()` em `visibilitychange` quando `document.visibilityState === "visible"`
- [X] T036 [US3] Em app/actions/auth.ts `logoutAction`: receber `formData` e ler `destino`; `"cadastrar"` → `redirect("/cadastrar")`, qualquer outro → `/entrar?motivo=saiu` (lista fechada). Em components/auth/logout-button.tsx: prop opcional `destination?: "cadastrar"` renderizada como `<input type="hidden" name="destino">`
- [X] T037 [US3] Em app/(acesso)/confirme-seu-email/page.tsx: receber `searchParams.next` (via `safeNextPath`) e usar no `redirect` quando já confirmado; trocar o `Link` "Já confirmei" por `ConfirmationCheck next={next}`; adicionar "Não chegou? Confira a caixa de spam ou lixo eletrônico. O link vale 24 horas."; adicionar "Digitou o e-mail errado?" com `LogoutButton label="Corrigir e-mail" destination="cadastrar"`; manter "Entrar com outra conta"

**Checkpoint**: US3 testável isoladamente com uma conta não confirmada.

---

## Phase 6: User Story 4 — Entrar sem perder o caminho (P2)

**Goal**: e-mail preenchido, mostrar senha, `next` preservado, tempo de espera no limite.

**Independent Test**: quickstart cenários 13 e 14, mais `/entrar?email=x@y.com`.

### Implementation

- [X] T038 [US4] Em app/(acesso)/entrar/page.tsx: ler `searchParams.email` (string, primeira se array) e passar como `defaultEmail` ao `LoginForm`
- [X] T039 [US4] Em components/auth/login-form.tsx: `defaultValue={state.fields?.email ?? defaultEmail}`; trocar o campo de senha por `PasswordField` com `autoComplete="current-password"`; mostrar `state.fieldErrors` por campo via prop `error`
- [X] T040 [US4] Em app/actions/auth.ts `loginAction`: validar com `validateLogin` (→ `fieldErrors`); em `RATE_LIMITED` usar `rateLimitMessage(error.retryAfter)`; não confirmado → `redirect(next === "/" ? "/confirme-seu-email" : \`/confirme-seu-email?${new URLSearchParams({ next })}\`)`

**Checkpoint**: US4 testável isoladamente.

---

## Phase 7: User Story 5 — Erros por campo, acessíveis (P3)

**Goal**: validação no cliente, erros da API no campo certo, foco no primeiro erro, loading consistente.

**Independent Test**: quickstart cenários 7 e 8 com leitor de tela.

### Implementation

- [X] T041 [US5] Em app/actions/auth.ts: `AuthFormState` passa a ser `{ error?: string; fieldErrors?: FieldErrors; fields?: { name?: string; email?: string; pixKey?: string } }`; no `catch` do cadastro, `VALIDATION_FAILED` com `fieldErrorFromApi(error.message)` → `fieldErrors[campo]`, `EMAIL_EXISTS` → `fieldErrors.email = "Já existe uma conta com este e-mail."`; o resto → `error`
- [X] T042 [US5] Em components/auth/register-form.tsx: `onSubmit` roda `validateRegistration` com os valores do formulário; com erros, `event.preventDefault()`, guarda em estado local e foca o primeiro campo com erro (ordem name, email, password, pixKey, acceptTerms); erros exibidos = locais ou `state.fieldErrors`; erro do campo some quando a pessoa o edita; `PasswordField` com `autoComplete="new-password"` e linha de requisito "De 8 a 72 caracteres" que mostra ✓ (com texto "atendido" para leitor de tela) quando `isPasswordLengthOk`
- [X] T043 [US5] Em components/auth/register-form.tsx e components/auth/login-form.tsx: depois de uma resposta do servidor com `fieldErrors`, focar o primeiro campo com erro; com só `error`, focar o `FormError` (`tabIndex={-1}`); botões com `disabled={pending}` e textos "Criando conta…" / "Entrando…"
- [X] T044 [US5] Em components/auth/login-form.tsx: `onSubmit` com `validateLogin`, mesma regra de foco e limpeza de erro da T042

**Checkpoint**: todas as stories completas.

---

## Phase 8: Polish & Cross-Cutting

- [X] T045 [P] Conferir `metadata.title` e `h1` coerentes em cadastrar, entrar, confirme-seu-email, confirmar-email (cada estado tem `h1`), redefinir-senha, esqueci-a-senha, termos e privacidade
- [X] T046 [P] Remover imports e código mortos deixados por T012/T019 (ex.: usos antigos de `getConfirmationErrorMessage`) com `rg` em app, components e lib
- [X] T047 Rodar `pnpm lint`, `pnpm test` e `pnpm build`; corrigir falhas
- [ ] T048 Percorrer os 18 cenários de specs/017-signup-confirm-login/quickstart.md em 375px e desktop e registrar o resultado no PR

---

## Dependencies & Execution Order

- **Setup (T001–T002)**: sem dependências. T001 não bloqueia código.
- **Foundational (T003–T009)**: depois do Setup; bloqueia as stories. T005 → T006 → T007 em sequência (mesmo conceito de `retryAfter`).
- **US1 (T010–T022)**: depois da Foundational. T012 → T016 → T019; T013 → T015; T017 → T018.
- **US2 (T023–T031)**: depois da Foundational; independente da US1, exceto que T030/T031 mexem em arquivos também tocados por T015 e T042 (fazer em sequência).
- **US3 (T032–T037)**: depois da Foundational; T032 → T035 → T037; T036 → T037.
- **US4 (T038–T040)**: depois da Foundational (usa T005, T009).
- **US5 (T041–T044)**: depois de US2 (T030/T031) e US4 (T039/T040), que tocam os mesmos formulários e actions.
- **Polish (T045–T048)**: por último.

`app/actions/auth.ts` é tocado por T014, T015, T016, T031, T032, T033, T036, T040 e T041: essas tarefas não rodam em paralelo entre si.

### Story order

US1 → US2 (MVP) → US3 e US4 (em qualquer ordem) → US5.

## Parallel Examples

```text
# Foundational
T003 lib/auth-validation.ts | T008 components/auth/field.tsx | T009 components/auth/password-field.tsx | T002 lib/legal.ts

# US1
T010 lib/confirm-email.test.mjs | T011 lib/session-flow.test.mjs | T012 lib/confirm-email.ts | T013 lib/session-flow.ts | T020 forget-password-screen.tsx | T021 páginas entrar/cadastrar

# US2
T023 legal-document.tsx | T024 terms-2026-10.tsx | T025 privacy-2026-10.tsx | T028 public-frame.tsx | T029 perfil/page.tsx
```

## Implementation Strategy

1. **MVP**: Setup + Foundational + US1 + US2. Entrega o caminho feliz sem telas sem saída, a falha pós-cadastro resolvida, Termos/Privacidade com aceite obrigatório e nenhuma menção a app. Validar com quickstart 1–6, 9, 15–17 e publicar.
2. **Incremento 2**: US3 + US4 (confirmação e login sem atrito).
3. **Incremento 3**: US5 (validação por campo completa) + Polish.
4. Quando a issue (2) da T001 entrar na API: separar "Link expirado" em `confirmationOutcome`. O envio das versões (issue 1) já foi feito na api-kottagroups spec 066.
