---

description: "Tasks: CSP completa com nonce por requisição (issue #83)"
---

# Tasks: Política de segurança de conteúdo completa, com nonce por requisição

**Input**: Design documents from `/specs/024-csp-nonce/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/csp-header.md](./contracts/csp-header.md),
[quickstart.md](./quickstart.md)

**Tests**: a spec pede teste em FR-014 e FR-015, e a Constituição V também. Escrever os casos antes
da regra e ver o teste falhar.

**Regras do repo**:
- `pnpm`, nenhuma dependência nova.
- Identificadores em inglês e comentários que explicam o porquê.
- Conventional Commits em inglês.
- Tudo numa branch `feature/024-csp-nonce` a partir de `main` e num PR só, com `Closes #83` (plan, Structure Decision).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência pendente)
- **[Story]**: história da spec (US1–US4)

---

## Phase 1: Setup

- [X] T001 Criar a branch `feature/024-csp-nonce` a partir de `main` atualizada. Rodar `pnpm lint` e `pnpm test` e anotar as falhas que já existem, para não serem confundidas com regressão. Confirmar que a API local responde em `http://localhost:8085` e que `E2E_EMAIL` e `E2E_PASSWORD` estão disponíveis para `pnpm test:e2e` (`playwright.config.ts`, quickstart, pré-requisitos)

---

## Phase 2: Foundational (bloqueia US1–US3)

**Purpose**: a origem da API num lugar só e a política como função pura testada.

- [X] T002 Criar `lib/api/origin.ts` com `apiOrigin()`, a mesma expressão de hoje (`(process.env.API_ORIGIN ?? "https://api.kottagroups.com.br").replace(/\/$/, "")`). Sem `server-only`, porque não lê segredo e precisa servir ao `next.config.ts` (research R11)
- [X] T003 Tirar `apiOrigin()` de `lib/api/server.ts` e importá-la de `./origin`. Trocar o import em `app/sair/route.ts` para `@/lib/api/origin`. Em `next.config.ts`, trocar a constante `apiOrigin` local por `apiOrigin()` importada de `./lib/api/origin` no rewrite `/api/v1/:path*`. Depois de T002
- [X] T004 [P] Escrever `lib/csp.test.mjs` (`node:test`, import de `./csp.ts`, como `lib/https-url.test.mjs`) e ver falhar. Casos:
  - produção (`isDev: false`, `apiOrigin: "https://api.kottagroups.com.br"`): a string tem as 11 diretivas na ordem de [contracts/csp-header.md](./contracts/csp-header.md), separadas por `; `;
  - `script-src` é `'self' 'nonce-<N>' 'strict-dynamic'`, e `style-src` é `'self' 'nonce-<N>'`;
  - em produção não há `'unsafe-eval'` nem `'unsafe-inline'` em `script-src` e `style-src` (FR-011). `style-src-attr 'unsafe-inline'` é a única exceção;
  - dev (`isDev: true`): `script-src` termina com `'unsafe-eval'` e `style-src` é `'self' 'nonce-<N>' 'unsafe-inline'`;
  - `img-src` em produção é exatamente `'self' blob: https://api.kottagroups.com.br`;
  - com `apiOrigin` `http://localhost:3003` ou `http://127.0.0.1:3003`, `img-src` ganha `http://localhost:* http://127.0.0.1:*`;
  - `createNonce()` decodifica (`atob`) para 16 bytes, casa com `/^[A-Za-z0-9+/]+={0,2}$/` e 20 chamadas dão 20 valores distintos (FR-003, SC-002).
- [X] T005 Criar `lib/csp.ts` com:
  - `NONCE_BYTES = 16`;
  - `createNonce()`: `crypto.getRandomValues` e `btoa` (research R2);
  - `contentSecurityPolicy({ nonce, apiOrigin, isDev })`: devolve a string do contrato. A regra de loopback espelha a de `lib/https-url.ts` (data-model, Política).

  Sem `upgrade-insecure-requests`, `data:` ou `report-to` (research R3). `pnpm test` verde. Depois de T004

**Checkpoint**: `pnpm test` passa com `lib/csp.test.mjs`; `next.config.ts` e `/sair` usam a origem única.

---

## Phase 3: User Story 1 - Script injetado não roda (Priority: P1) 🎯 MVP

**Goal**: toda página sai com a política completa em bloqueio e um nonce novo por resposta. Script inline sem nonce e script de outra origem não rodam.

**Independent Test**: `pnpm build && pnpm start --port 3002` e `curl -sI http://localhost:3002/termos` mostra uma `content-security-policy` com `script-src 'self' 'nonce-…' 'strict-dynamic'`. `e2e/security-headers.spec.ts` e o teste de injeção de `e2e/csp.spec.ts` passam (quickstart §3).

### Tests for User Story 1

- [X] T006 [P] [US1] Reescrever `e2e/security-headers.spec.ts` (FR-014a/b, FR-015) e ver falhar:
  - usar um contexto sem cookie (`test.use({ storageState: { cookies: [], origins: [] } })`) ou `/termos`, porque logado `/entrar` é redirecionamento do proxy e só leva a política de frame;
  - a página tem `content-security-policy` com as diretivas de [contracts/csp-header.md](./contracts/csp-header.md) e `'nonce-<N>'` no `script-src`;
  - `/kotta-icon.png` tem exatamente `frame-ancestors 'none'`;
  - `x-frame-options`, `strict-transport-security`, `x-content-type-options` e `referrer-policy` continuam com os valores do 023 nas duas respostas;
  - 20 requisições seguidas à página dão 20 nonces distintos (SC-002);
  - todo `<script>` do HTML tem `nonce` igual ao do cabeçalho daquela resposta.
- [X] T007 [P] [US1] Criar `e2e/csp.spec.ts` com o teste de bloqueio (SC-004) e ver falhar:
  - sem cookie, `page.route` em `/entrar` busca a resposta original (`route.fetch()`) e injeta no HTML um `<script>window.__injectedInline = true</script>` sem nonce e um `<script src="https://example.com/x.js">`;
  - `https://example.com/x.js` também é roteado, devolvendo `window.__injectedExternal = true`, para não depender de rede;
  - espera: as duas variáveis ficam `undefined`, e o evento `securitypolicyviolation` registra `script-src-elem` (ou `script-src`) para os dois;
  - a página `/entrar` continua interativa: o campo de e-mail aceita digitação.

### Implementation for User Story 1

- [X] T008 [US1] Em `proxy.ts`, a cada requisição que chega ao `NextResponse.next({ request: { headers } })`:
  - gerar `createNonce()`;
  - montar `contentSecurityPolicy({ nonce, apiOrigin: apiOrigin(), isDev: process.env.NODE_ENV === "development" })`;
  - gravar a política em `Content-Security-Policy` no cabeçalho da requisição (o Next lê o nonce dali, research R1) e no da resposta.

  Os dois `NextResponse.redirect` não mudam e continuam só com a política de frame do config ([contracts/csp-header.md](./contracts/csp-header.md), Cabeçalhos por resposta). O matcher não muda. Depois de T005
- [X] T009 [P] [US1] Em `app/layout.tsx`, tornar `RootLayout` `async` e chamar `await connection()` (de `next/server`) antes do JSX. Um comentário curto explica que o nonce exige renderização por requisição: uma página estática sairia sem nonce e com os scripts bloqueados (research R7)
- [X] T010 [P] [US1] Em `next.config.ts`, atualizar o comentário da regra `Content-Security-Policy: frame-ancestors 'none'`. Ela vale para o que não passa pelo proxy (estáticos, `/_next`, `/api`, redirecionamentos), e nas páginas o proxy sobrescreve com a política completa (research R8). O valor e o `source: "/:path*"` não mudam
- [X] T011 [US1] `pnpm build && pnpm start --port 3002` e rodar os curls do quickstart §3: `/termos` com uma linha `content-security-policy` que contém `script-src` e nonce, e `/kotta-icon.png` com `frame-ancestors 'none'`. Conferir no build que as rotas continuam `ƒ (Dynamic)` e que `.next/prerender-manifest.json` só tem `/_global-error` (quickstart §2). Rodar `pnpm exec playwright test e2e/security-headers.spec.ts e2e/csp.spec.ts`: verde. Depois de T006–T010

**Checkpoint**: SC-001, SC-002 e SC-004 atendidos.

---

## Phase 4: User Story 2 - O app funciona igual com a política ativa (Priority: P1)

**Goal**: toda a suíte e2e roda em bloqueio sem nenhuma violação de política e sem mudança visível.

**Independent Test**: `API_ORIGIN=http://localhost:8085 pnpm test:e2e` verde, com o fixture de violação ativo em todas as specs (quickstart §3).

### Tests for User Story 2

- [X] T012 [US2] Criar `e2e/fixtures.ts` que exporta `test` (estendido de `@playwright/test`) e reexporta `expect` e os tipos usados. O fixture `cspViolations` é `{ auto: true }`:
  - `context.exposeBinding("__reportCspViolation", …)` acumula `{ violatedDirective, blockedURI, sourceFile }`;
  - `context.addInitScript` registra `document.addEventListener("securitypolicyviolation", e => window.__reportCspViolation({...}))`, e assim sobrevive a navegações;
  - depois do `use`, `expect(violations).toEqual([])`, com a lista na mensagem de falha.

  `e2e/csp.spec.ts` (T007) precisa ler as violações em vez de falhar: expor o array pelo fixture e deixar o teste de injeção esvaziá-lo depois de conferir (research R10, SC-003)
- [X] T013 [US2] Trocar `from "@playwright/test"` por `from "./fixtures"` em `e2e/access.spec.ts`, `e2e/auth.setup.ts`, `e2e/dashboard.spec.ts`, `e2e/errors.spec.ts`, `e2e/expenses.spec.ts`, `e2e/groups.spec.ts`, `e2e/notes-notifications.spec.ts`, `e2e/profile.spec.ts`, `e2e/receipt-image.spec.ts`, `e2e/receipt-retry.spec.ts`, `e2e/security-headers.spec.ts`, `e2e/shopping-list.spec.ts` e `e2e/csp.spec.ts`. Fica de fora `e2e/sign-in.ts`, que é helper e só usa `expect`/`Page`. Depois de T012
- [X] T014 [P] [US2] Em `e2e/csp.spec.ts`, acrescentar as telas que a suíte não visita, todas sem cookie, cada uma conferindo o conteúdo principal visível e, pelo fixture, zero violações (FR-012, research R10):
  - `/entrar`;
  - `/convite/<token inexistente>`;
  - `/termos`;
  - `/entrar?motivo=expirada` e `/sessao-expirada` (sessão expirada).

  A 404 pública já está em `e2e/errors.spec.ts`, que passa pelo mesmo fixture. Depois de T012

### Implementation for User Story 2

- [X] T015 [US2] Rodar `API_ORIGIN=http://localhost:8085 pnpm test:e2e` e corrigir cada violação na origem. As telas cobertas são perfil com prévia `blob:`, foto de nota e avatar da API, leitura de QR, painel, grupos, convite, notas e despesas.
  - Uma origem de imagem que falte entra em `contentSecurityPolicy` com caso novo em `lib/csp.test.mjs`.
  - Se aparecer `data:`, entra só em `img-src`, com a justificativa em `research.md` R3 (FR-005).
  - Uma violação de estilo que não seja atributo `style=` pede investigação, não `'unsafe-inline'` (FR-007).

  Ao fim, a suíte inteira passa sem mudar nenhuma expectativa de tela (SC-003, SC-005). Depois de T011, T013 e T014

**Checkpoint**: SC-003 e SC-005 atendidos localmente, em bloqueio.

---

## Phase 5: User Story 3 - Ativação gradual, com observação antes do bloqueio (Priority: P2)

**Goal**: `CSP_REPORT_ONLY=1` envia a mesma política como relato, mantendo a proibição de frame. O preview passa por relato antes do bloqueio.

**Independent Test**: `CSP_REPORT_ONLY=1 pnpm start --port 3002` e `curl -sI http://localhost:3002/termos` mostra `content-security-policy: frame-ancestors 'none'` e `content-security-policy-report-only: …script-src 'self' 'nonce-…'…`. Os scripts da página têm o nonce (quickstart §4).

### Implementation for User Story 3

- [X] T016 [US3] Em `proxy.ts`, escolher o nome do cabeçalho uma vez, no carregamento do módulo: `process.env.CSP_REPORT_ONLY === "1"` dá `Content-Security-Policy-Report-Only` e qualquer outro valor dá `Content-Security-Policy` ([data-model](./data-model.md), Modo).
  - Usar esse nome na requisição e na resposta, com a política igual nos dois modos (FR-010).
  - No modo relato, o proxy NÃO grava `Content-Security-Policy`. A do `next.config.ts` (só frame) continua na resposta. Se o proxy mandasse uma `Content-Security-Policy` só de frame, o Next leria ela antes da `-report-only` e perderia o nonce (research R8, R9).
  - Um comentário explica as duas coisas.

  Depois de T008
- [X] T017 [US3] Conferir localmente: `pnpm build && CSP_REPORT_ONLY=1 pnpm start --port 3002`.
  - O `curl` do Independent Test mostra as duas linhas.
  - `curl -s http://localhost:3002/termos` mostra `nonce=` nos `<script>`, com o mesmo valor do cabeçalho de relato.
  - Rodar de novo sem a variável e confirmar que só vem `content-security-policy`, com `script-src`.

  Depois de T016
- [ ] T018 [US3] Executar o quickstart §4 no preview da Vercel, depois de abrir o PR (T022):
  - criar `CSP_REPORT_ONLY=1` só para Preview;
  - percorrer as telas sem `[Report Only] Refused to …` no console, conferindo `/_vercel/insights/script.js` e `/_vercel/speed-insights/script.js` com 2xx;
  - remover a variável e fazer redeploy;
  - conferir que vem **uma** `content-security-policy`, com `script-src`;
  - repetir a navegação em bloqueio.

  Se vierem duas políticas, ou só a de frame, aplicar a correção de research R8 em `next.config.ts`: trocar o `source: "/:path*"` da CSP por regras só para `/_next/:path*`, `/api/:path*` e arquivos `.png`, `.svg` e `.ico`. Os outros 4 cabeçalhos continuam em `/:path*`. Depois, rodar de novo T011 e o curl do preview. Registrar no PR a data e os links dos previews em relato e em bloqueio (SC-007)

**Checkpoint**: SC-007 atendido; voltar ao relato é só ligar a variável.

---

## Phase 6: User Story 4 - Saber o custo em desempenho antes de ativar (Priority: P3)

**Goal**: p75 de "HTML completo" antes e depois, registrado com a lista de rotas que mudaram de modo.

**Independent Test**: `specs/024-csp-nonce/performance.md` existe com as quatro rotas, os dois p75 e a variação de cada uma (quickstart §6).

### Implementation for User Story 4

- [X] T019 [P] [US4] Medir `main` (num worktree temporário de `main`) com o método de [018/baseline.md](../018-front-performance/baseline.md):
  - build de produção local e API local;
  - Chromium mobile 412×823 com CPU 4× mais lenta;
  - `responseEnd`, 10 visitas a `/entrar` (deslogado), `/`, `/grupos` e `/perfil` (usuário de 1 grupo);
  - guardar o p75 de cada rota.

  Pode rodar a qualquer momento, porque não depende do código desta branch
- [X] T020 [US4] Medir a branch do mesmo jeito e escrever `specs/024-csp-nonce/performance.md` com:
  - uma tabela rota × p75 `main` × p75 branch × variação;
  - a lista de rotas que mudaram de modo no build (esperado: nenhuma, research R7);
  - o comando usado.

  Variação acima de 20% em alguma rota exige a decisão (aceitar ou mitigar), escrita ali antes do merge (FR-013, SC-006). Depois de T015 e T019

**Checkpoint**: SC-006 atendido.

---

## Phase 7: Polish & Cross-Cutting

- [X] T021 Executar o quickstart §5 num branch descartável: fazer `app/layout.tsx` lançar um erro, `pnpm build && pnpm start`, abrir `/` e conferir que a tela "Algo deu errado" aparece e que o botão de tentar de novo responde. Desfazer. Se os scripts vierem bloqueados, registrar em `performance.md` como risco aceito ou abrir issue (research R7, FR-012)
- [X] T022 Rodar `pnpm lint && pnpm test && pnpm build && API_ORIGIN=http://localhost:8085 pnpm test:e2e`, tudo verde (SC-005). Commitar em Conventional Commits em inglês (por exemplo, `refactor(api): move apiOrigin to its own module`, `feat(security): send a nonce-based CSP from the proxy`, `test(e2e): fail on any CSP violation`) e abrir o PR `feat(security): full CSP with per-request nonce`, com `Closes #83`. O corpo do PR deve trazer:
  - o resumo do [contrato](./contracts/csp-header.md);
  - o risco residual dos `style=` (research R5);
  - o resultado de T020;
  - o espaço para os links de T018.
- [ ] T023 Marcar como concluídos os itens deste arquivo e conferir no PR que T018 (preview em relato e em bloqueio) e T020 (performance) estão registrados antes do merge

---

## Dependencies & Execution Order

- **Setup (T001)**: primeiro.
- **Foundational (T002–T005)**: depois do Setup; bloqueia US1–US3. T004 pode correr junto com T002/T003.
- **US1 (T006–T011)**: depois de T005. É o MVP: protege as páginas.
- **US2 (T012–T015)**: o fixture (T012) e a troca de imports (T013) podem começar junto com US1. T015 precisa de US1 pronto, porque testa o bloqueio de verdade.
- **US3 (T016–T018)**: T016 depois de T008. T018 depende do PR aberto (T022).
- **US4 (T019–T020)**: T019 a qualquer momento. T020 depois de T015.
- **Polish (T021–T023)**: T021 depois de T009; T022 depois de T015, T017 e T020; T023 por último.

### Story completion order

`Foundational → US1 → US2 → US3 (preview) → merge`. US4 corre em paralelo e precisa estar registrada antes do merge.

## Parallel Example

```text
# Depois de T005:
T006 e2e/security-headers.spec.ts   T007 e2e/csp.spec.ts (injeção)
T009 app/layout.tsx                 T010 next.config.ts (comentário)
T012 e2e/fixtures.ts                T019 medição de main (worktree)
```

## Implementation Strategy

1. **MVP**: Setup, Foundational e US1. Com isso as páginas já saem com a política completa em bloqueio e o nonce único.
2. **US2** antes de qualquer deploy: a suíte inteira sem violação é o que permite manter o bloqueio ligado.
3. **US3** no preview do PR: primeiro em relato, depois em bloqueio, conferindo que a Vercel entrega uma política só.
4. **US4** registra o custo, e o merge só acontece com T018 e T020 no PR.
