---

description: "Tasks: endurecimento da re-auditoria de segurança run-2 (issue #63)"
---

# Tasks: Endurecimento da re-auditoria de segurança (run-2)

**Input**: Design documents from `/specs/023-reaudit-run2-hardening/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/security-headers.md](./contracts/security-headers.md),
[contracts/pure-rules.md](./contracts/pure-rules.md), [quickstart.md](./quickstart.md)

**Tests**: a spec pede teste em FR-016 e a Constituição V também. Escrever os casos antes da regra
e ver o teste falhar. A atualização do `next` (US1) não tem teste próprio: vale o portão de lint,
testes, build e e2e.

**Regras do repo**: `pnpm`; nenhuma dependência nova; identificadores em inglês; comentários
explicam o porquê; Conventional Commits em inglês; cada história em uma branch própria a partir de
`main` (`feature/023-<slug>`) e em um PR com `Closes #<issue>`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência pendente)
- **[Story]**: história da spec (US1–US5)

---

## Phase 1: Setup

- [X] T001 Em `main` atualizada, rodar `pnpm lint` e `pnpm test` e anotar as falhas que já existem, para não serem confundidas com regressão. Confirmar que `API_ORIGIN`, `E2E_EMAIL` e `E2E_PASSWORD` estão disponíveis para `pnpm test:e2e` (`playwright.config.ts`)

---

## Phase 2: Foundational

Nada bloqueante: as cinco histórias mexem em arquivos separados (plan, Source Code) e podem ser
feitas em qualquer ordem.

---

## Phase 3: User Story 1 - App sem vulnerabilidades críticas ou altas conhecidas em produção (Priority: P1) 🎯 MVP

**Goal**: `pnpm audit --prod` com 0 críticas e 0 altas (#67).

**Independent Test**: `pnpm audit --prod`, depois `pnpm lint && pnpm test && pnpm build && pnpm test:e2e` (quickstart §1).

### Implementation for User Story 1

- [X] T002 [US1] Na branch `feature/023-next-16-3-8`, mudar `next` e `eslint-config-next` de `16.3.5` para `16.3.8` (versão exata, sem `^`) em `package.json` e rodar `pnpm install` para atualizar `pnpm-lock.yaml` (research R1, FR-002)
- [X] T003 [US1] Rodar `pnpm audit --prod`. Se `sharp` continuar abaixo de `0.35.5` ou `source-map-js` abaixo de `1.2.2`, rodar `pnpm update sharp source-map-js` e auditar de novo. Só se ainda houver alerta, acrescentar em `package.json` `"pnpm": { "overrides": { "sharp": ">=0.35.5", "source-map-js": ">=1.2.2" } }`, só com o pacote que continua acusando, e rodar `pnpm install`. Parar quando o audit mostrar 0 critical e 0 high (FR-001). Depois de T002
- [X] T004 [US1] Ler as notas de versão do Next 16.3.6, 16.3.7 e 16.3.8 e conferir se alguma mudança afeta `next.config.ts`, `proxy.ts`, `app/sair/route.ts` ou o uso de `next/image`. Ajustar o código só se uma nota obrigar, e registrar a conclusão na descrição do PR (Edge Case "atualização do framework")
- [ ] T005 [US1] Rodar `pnpm lint`, `pnpm test`, `pnpm build` e `pnpm test:e2e`, todos verdes sem mudar expectativas (FR-003, SC-007). Abrir PR `fix(deps): bump next to 16.3.8` com `Closes #67` e a saída do audit antes e depois

**Checkpoint**: SC-001 atendido; o app se comporta igual.

---

## Phase 4: User Story 2 - Sair da conta encerra a sessão de verdade (Priority: P1)

**Goal**: `logoutAction` revoga a sessão na API antes de apagar o cookie (#66), sem deixar a saída
local depender da API.

**Independent Test**: e2e "sair revoga a sessão na API" (o bearer antigo recebe 401) e quickstart
§4.6 (API fora, saída em até ~3 s).

### Tests for User Story 2

- [X] T006 [US2] Na branch `feature/023-logout-revoke`, criar `e2e/sign-in.ts` exportando `async function signIn(page: Page): Promise<void>`. Ela repete os passos de login de `e2e/auth.setup.ts`: `page.goto("/entrar")`, preencher `getByLabel("E-mail")` com `E2E_EMAIL` e `getByLabel("Senha", { exact: true })` com `E2E_PASSWORD`, clicar `getByRole("button", { name: "Entrar" })` e `expect(page).toHaveURL("/")`. Lança `Error("Missing env var <NAME>")` se faltar variável, como o `requiredEnv` do setup (research R3)
- [X] T007 [P] [US2] Em `e2e/auth.setup.ts`, trocar os passos de login por `await signIn(page)`, mantendo a checagem de `/api/healthz` e o `storageState({ path: AUTH_FILE })`. Depois de T006
- [X] T008 [P] [US2] Em `e2e/access.spec.ts`, colocar o teste "sair encerra a sessão" num `test.describe` com `test.use({ storageState: { cookies: [], origins: [] } })` e começar o teste com `await signIn(page)`; apagar o comentário "Logout only clears this context's cookie…". No mesmo `describe`, acrescentar o teste "sair revoga a sessão na API": `signIn(page)`; `const token = (await page.context().cookies()).find((c) => c.name === "kotta_session")?.value`; `expect(token).toBeTruthy()`; clicar `getByRole("button", { name: "Sair" })`; `expect(page).toHaveURL(/\/entrar\?motivo=saiu/)`; `fetch(\`${process.env.API_ORIGIN}/api/v1/users/me\`, { headers: { Authorization: \`Bearer ${token}\` } })` e `expect(response.status).toBe(401)`. Rodar `pnpm test:e2e e2e/access.spec.ts` e ver o teste novo falhar (SC-002). Depois de T006
- [X] T009 [P] [US2] Em `e2e/errors.spec.ts`, mesmo tratamento para "sair numa aba desloga a outra": `describe` com `test.use({ storageState: { cookies: [], origins: [] } })`, `await signIn(pageA)` antes de `pageA.goto("/grupos")` e apagar o comentário obsoleto. Sem isso, a revogação derruba a sessão compartilhada e os testes seguintes falham (research R3). Depois de T006

### Implementation for User Story 2

- [X] T010 [US2] Em `app/actions/auth.ts`, criar a constante de módulo `const LOGOUT_TIMEOUT_MS = 3_000;`. Em `logoutAction`, antes de `clearSessionToken()`: `const token = await getSessionToken();` e, se houver token, `await apiRequest<void>("/auth/logout", { method: "POST", auth: false, headers: { Authorization: \`Bearer ${token}\` }, signal: AbortSignal.timeout(LOGOUT_TIMEOUT_MS) }).catch(() => {});`. O comentário explica o porquê: `auth: false` evita que o 401 de sessão já expirada redirecione para a tela de sessão expirada; a falha é ignorada porque a saída local sempre acontece e `apiRequest` já registra o erro no log. O resto (`destino === "cadastrar"`, `signedOutLoginUrl(safeNextPath(...))`) não muda, nem `app/sair/route.ts` (research R2, FR-004–FR-006). Depois de T008
- [ ] T011 [US2] Rodar `pnpm lint`, `pnpm test` e `pnpm test:e2e`: T008 passa e toda a suíte continua verde depois dos testes de saída (SC-002, SC-007). Fazer o quickstart §4.6 (API parada → "Sair" leva a `/entrar?motivo=saiu` em até ~3 s, SC-003). Abrir PR `fix(auth): revoke the API session on logout` com `Closes #66`

**Checkpoint**: token copiado antes de sair não vale mais; a saída nunca trava.

---

## Phase 5: User Story 3 - Tokens de convite e de conta não vazam por URL (Priority: P2)

**Goal**: analytics sem query nem token; token fora da barra depois de lido; `no-referrer` nas
telas com token (#65).

**Independent Test**: `pnpm test` (tabela de `redactAnalyticsUrl`) e quickstart §4.2–§4.4.

### Tests for User Story 3

- [X] T012 [US3] Na branch `feature/023-token-urls`, em `lib/invites.test.mjs`, trocar o import `redactInviteUrl` por `redactAnalyticsUrl` e substituir o teste atual de redação pelas 7 linhas da tabela `redactAnalyticsUrl` em `contracts/pure-rules.md`, usando a constante `TOKEN` do arquivo nas linhas com `<TOKEN>`. Rodar `pnpm test` e ver falhar (FR-007, FR-016)

### Implementation for User Story 3

- [X] T013 [US3] Em `lib/invites.ts`, renomear `redactInviteUrl` para `redactAnalyticsUrl` com o corpo `return url.split(/[?#]/, 1)[0].replace(/\/convite\/.*/, "/convite/[token]");` e o JSDoc "Tira query, hash e o token do convite antes de mandar para analytics." (research R4). Depois de T012
- [X] T014 [US3] Em `components/app/vercel-insights.tsx`, usar `redactAnalyticsUrl` nos dois `beforeSend` e atualizar o comentário: query e hash podem carregar tokens (`?next=` com o convite, `?token=` de redefinição e confirmação). Confirmar com `grep -rn redactInviteUrl app components lib` que não sobrou nenhuma referência. Depois de T013
- [X] T015 [P] [US3] Em `components/forget-password/forget-password-screen.tsx`, trocar `const token = searchParams.get("token")?.trim() ?? "";` por `const [token] = useState(() => searchParams.get("token")?.trim() ?? "");` e acrescentar `useEffect(() => { if (token) window.history.replaceState(null, "", window.location.pathname); }, [token]);`, importando `useEffect` de `react`. Comentário: `replaceState` sincroniza `useSearchParams`, por isso o token fica guardado em estado (research R5, FR-008)
- [X] T016 [P] [US3] Em `components/confirm-email/confirm-email-screen.tsx`, mesmo tratamento: `const searchParams = useSearchParams();`, `const [token] = useState(() => searchParams.get("token")?.trim() ?? "");`, um `useEffect` de limpeza com `replaceState` igual ao de T015, separado do efeito de `confirmOnce`. `confirmOnce` e as deps `[attempt, token]` não mudam (research R5, FR-008)
- [X] T017 [P] [US3] Em `app/(acesso)/redefinir-senha/page.tsx`, acrescentar `referrer: "no-referrer"` ao `metadata` (research R6, FR-009)
- [X] T018 [P] [US3] Em `app/(acesso)/confirmar-email/page.tsx`, acrescentar `referrer: "no-referrer"` ao `metadata` (research R6, FR-009)
- [ ] T019 [US3] Rodar `pnpm lint`, `pnpm test`, `pnpm build` e `pnpm test:e2e`. Fazer o quickstart §4.3 (barra sem token, troca de senha funciona, recarregar mostra "link sem token") e §4.4 (`<meta name="referrer" content="no-referrer">` no HTML). Abrir PR `fix(security): keep invite and account tokens out of URLs` com `Closes #65`

**Checkpoint**: SC-004; os fluxos de convite, redefinição e confirmação funcionam como antes.

---

## Phase 6: User Story 4 - O app não pode ser embutido em outro site e só fala por HTTPS (Priority: P2)

**Goal**: 5 cabeçalhos de segurança em toda resposta (#64).

**Independent Test**: e2e `e2e/security-headers.spec.ts` e quickstart §4.1 (iframe bloqueado).

### Tests for User Story 4

- [X] T020 [US4] Na branch `feature/023-security-headers`, criar `e2e/security-headers.spec.ts` com um teste por caminho (`/entrar`, `/kotta-icon.png`, `/api/v1/users/me`): `const response = await request.get(path, { maxRedirects: 0 })` e, para cada linha de `contracts/security-headers.md`, `expect(response.headers()[name.toLowerCase()]).toBe(value)`. O status não importa (redirect e 401 também precisam dos cabeçalhos). Rodar `pnpm test:e2e e2e/security-headers.spec.ts` e ver falhar (FR-010–FR-013, SC-005)

### Implementation for User Story 4

- [X] T021 [US4] Em `next.config.ts`, criar `const SECURITY_HEADERS = [...]` com os 5 pares `{ key, value }` exatamente como em `contracts/security-headers.md` (`Content-Security-Policy: frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`) e acrescentar `async headers() { return [{ source: "/:path*", headers: SECURITY_HEADERS }]; }`. Comentário curto do porquê: hoje o framing só é barrado pelo `SameSite=Lax`, `preload` fica de fora por ser difícil de desfazer e a CSP completa fica para outra entrega (research R7). Depois de T020
- [ ] T022 [US4] Rodar `pnpm lint`, `pnpm build` e `pnpm test:e2e` (T020 passa e o resto continua verde). Fazer o quickstart §4.1 (iframe local bloqueado) e conferir de olho entrar, grupos, nota com foto e convite. Abrir PR `feat(security): send security headers on every response` com `Closes #64`

**Checkpoint**: SC-005; nada quebrou com os cabeçalhos.

---

## Phase 7: User Story 5 - Mensagens de erro e imagens não aceitam conteúdo forjado (Priority: P3)

**Goal**: `?erro=` só mostra códigos; imagens da API só com `https:` (ou `http:` em loopback) (#68).

**Independent Test**: `pnpm test` (tabelas de `friendlyMessage` e `httpsUrl`) e quickstart §4.5.

### Tests for User Story 5

- [X] T023 [P] [US5] Na branch `feature/023-error-code-https-url`, em `lib/api/errors.test.mjs`, acrescentar o teste "friendlyMessage shows only well-formed unknown codes" com as 7 linhas da tabela `friendlyMessage` em `contracts/pure-rules.md`, usando o `fallback` padrão "Não foi possível concluir agora. Tente de novo.". Rodar `pnpm test` e ver falhar (FR-014, FR-016)
- [X] T024 [P] [US5] Criar `lib/https-url.test.mjs` importando `httpsUrl` de `./https-url.ts`, com as 15 linhas da tabela `httpsUrl` em `contracts/pure-rules.md` (incluindo loopback e `http://localhost.evil.com`). Rodar `pnpm test` e ver falhar (FR-015, FR-016)

### Implementation for User Story 5

- [X] T025 [US5] Em `lib/api/errors.ts`, criar `const ERROR_CODE_PATTERN = /^[A-Z0-9_]{1,64}$/;` e, no `default` de `friendlyMessage`, devolver `` `${fallback} (${code})` `` só se `ERROR_CODE_PATTERN.test(code)`; senão, `fallback`. Ajustar o comentário: o código ajuda nos logs, e texto livre de `?erro=` não é mostrado (research R8). Depois de T023
- [X] T026 [US5] Criar `lib/https-url.ts` com `const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);` e `export function httpsUrl(value: string | null | undefined): string | undefined`: devolve `undefined` se `!value`; faz `new URL(value)` dentro de `try/catch` (URL inválida → `undefined`); devolve `value` se `protocol === "https:"` ou (`protocol === "http:"` e `LOOPBACK_HOSTS.has(hostname)`); senão `undefined`. JSDoc: só HTTPS; HTTP só no próprio computador, para desenvolvimento e e2e. Sem `server-only`, porque também é usado por componentes cliente (research R9). Depois de T024
- [X] T027 [P] [US5] Em `components/app/invoice-photo.tsx`, trocar `const url = file.url;` por `const url = httpsUrl(file.url);` (import de `@/lib/https-url`). Sem URL, já aparece "Não foi possível carregar a foto." sem link (FR-015). Depois de T026
- [X] T028 [P] [US5] Em `components/app/avatar.tsx`, em `Avatar`, calcular `const avatarUrl = httpsUrl(person.avatarUrl);` e usar `avatarUrl` na condição, no `key` e no `src` de `AvatarPhoto`. Sem URL válida, aparecem as iniciais. `components/app/avatar-photo.tsx` não muda (FR-015). Depois de T026
- [X] T029 [P] [US5] Em `app/(conta)/grupos/[id]/listas/[listId]/page.tsx`, em `ReceiptPreview`, calcular `const fileUrl = httpsUrl(file.url);` e trocar os quatro `file.url` (condição da imagem, `href`, `src` e condição/`href` de "Abrir nota fiscal") por `fileUrl`. Sem URL válida, fica no ramo já existente sem link (FR-015). Depois de T026
- [ ] T030 [US5] Rodar `pnpm lint`, `pnpm test`, `pnpm build` e `pnpm test:e2e`. Os e2e de foto (`e2e/profile.spec.ts` "trocar foto…", `e2e/notes-notifications.spec.ts` "foto enviada…") precisam passar: eles comprovam a exceção de loopback. Fazer o quickstart §4.5. Abrir PR `fix(security): show only known error codes and safe image URLs` com `Closes #68`

**Checkpoint**: SC-006; mensagens e fotos legítimas aparecem como antes.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T031 Depois dos 5 PRs mergeados, em `main`: rodar `pnpm audit --prod`, `pnpm lint`, `pnpm test`, `pnpm build` e `pnpm test:e2e` e repetir o `quickstart.md` inteiro (SC-001–SC-007)
- [ ] T032 Conferir que #64, #65, #66, #67 e #68 fecharam pelos PRs e comentar em #63 com uma tabela item → PR, mais o que segue fora do escopo (limite por IP compartilhado, cookie `__Host-`, confirmação extra da chave Pix, CSP completa). Fechar #63 (SC-008). Pedir confirmação antes de comentar ou fechar, porque é ação no GitHub

---

## Implementation Notes (2026-10-21)

- T001: linha de base limpa (lint ok, 131/131). `E2E_EMAIL`/`E2E_PASSWORD` não estavam no ambiente,
  então nenhum `pnpm test:e2e` rodou; T008, T009 e T020 foram escritos sem a etapa "ver falhar".
- T003: depois do bump, o audit mostrou só `sharp` e `source-map-js` (2 high). `pnpm update sharp
  source-map-js` levou a `sharp@0.35.5` e `source-map-js@1.2.2`, e o audit ficou "No known
  vulnerabilities found". Sem `pnpm.overrides`.
- T004: 16.3.6 só corrige GHSA-vcvr-r3jv-pc5j; 16.3.7, uma correção do turbo-tasks; 16.3.8, só
  advisories de segurança. Nada a ajustar.
- T020/T021: confirmado com `curl` num `pnpm start` local. Páginas e `/public` trazem os 5
  cabeçalhos exatos. No proxy `/api/v1`, valem os da API (CSP mais restrita, HSTS de 180 dias), por
  isso o teste do proxy só confere presença e bloqueio de frame (contrato atualizado).
- T015/T016: a checagem no navegador não rodou (nenhum navegador do Playwright instalado); falta o
  quickstart §4.3.
- Pendentes: e2e, verificações manuais do quickstart e abertura dos PRs (T005, T011, T019, T022,
  T030), além de T031 e T032.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** antes de tudo.
- **Foundational**: vazia.
- **US1–US5**: independentes entre si; cada uma sai de `main` e vira um PR.
- **Polish (T031–T032)**: depois dos 5 PRs mergeados.

### Within Each User Story

- US1: T002 → T003 → T004 → T005.
- US2: T006 → (T007, T008, T009 em paralelo) → T010 → T011.
- US3: T012 → T013 → T014; T015, T016, T017 e T018 em paralelo entre si e com T012–T014; todos → T019.
- US4: T020 → T021 → T022.
- US5: (T023 → T025) e (T024 → T026 → T027, T028, T029 em paralelo) → T030.

### Conflitos entre histórias

- `package.json`/`pnpm-lock.yaml` só em US1. Se US1 for mergeada primeiro, rebasear as outras
  branches antes do e2e final de cada uma.
- `app/actions/auth.ts` só em US2; `next.config.ts` só em US4. Nenhum arquivo aparece em duas
  histórias.

---

## Parallel Example: User Story 3

```bash
# Depois de criar a branch:
Task: "T012 redactAnalyticsUrl table in lib/invites.test.mjs"
Task: "T015 token in state + replaceState in components/forget-password/forget-password-screen.tsx"
Task: "T016 token in state + replaceState in components/confirm-email/confirm-email-screen.tsx"
Task: "T017 referrer no-referrer in app/(acesso)/redefinir-senha/page.tsx"
Task: "T018 referrer no-referrer in app/(acesso)/confirmar-email/page.tsx"
```

## Parallel Example: User Story 5

```bash
Task: "T023 friendlyMessage table in lib/api/errors.test.mjs"
Task: "T024 httpsUrl table in lib/https-url.test.mjs"
# Depois de T026:
Task: "T027 httpsUrl in components/app/invoice-photo.tsx"
Task: "T028 httpsUrl in components/app/avatar.tsx"
Task: "T029 httpsUrl in app/(conta)/grupos/[id]/listas/[listId]/page.tsx"
```

---

## Implementation Strategy

### MVP First

1. T001 → US1 (T002–T005): é o único item com vulnerabilidade publicada e alcançável. Mergear.
2. US2 (T006–T011): o outro P1. Mergear.

### Incremental Delivery

3. US3 e US4 (P2), em qualquer ordem ou em paralelo, uma branch cada.
4. US5 (P3).
5. Polish: verificação final em `main` e fechamento de #63.

Cada PR é pequeno, tem o próprio teste e não depende de outro para entrar.
