---

description: "Task list for 030-share-whatsapp-summary"
---

# Tasks: Compartilhar cobrança e resumo via WhatsApp e Web Share

**Input**: Design documents from `/specs/030-share-whatsapp-summary/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/share-text.md,
quickstart.md

**Tests**: pedidos pela issue e pela Constituição (V): FR-007 exige `lib/share-text.test.mjs`
cobrindo a lógica pura. Não há pedido de e2e/teste de componente — a fiação da UI é fina (passar
props, condicional de `canShare`) e já segue o padrão existente de `created-invite.tsx`; a
verificação dela é manual, pelo `quickstart.md`.

**Organization**: US1 (P1, "Cobrar") e US2 (P2, "Compartilhar resumo") usam a mesma base —
`lib/share-text.ts` e o componente genérico de compartilhar — por isso essa base fica na Fase 2 e
cada história só acrescenta seu ponto de entrada na UI.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem depender de tarefa pendente)
- **[Story]**: história do spec.md (US1, US2)

---

## Phase 1: Setup

**Purpose**: confirmar que a branch parte de um estado verde.

- [X] T001 Rodar `pnpm test` e `pnpm lint` na branch `030-share-whatsapp-summary` e confirmar que passam antes de qualquer mudança

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: a lógica pura de texto (`lib/share-text.ts`) e o componente de UI genérico de
compartilhar. US1 e US2 dependem dos dois.

**⚠️ CRITICAL**: nenhuma história começa antes desta fase.

- [X] T002 [P] Escrever `lib/share-text.test.mjs` (node:test, `node:assert/strict`, import de `./share-text.ts`) com os 5 casos de `contracts/share-text.md`:
  - `buildSettlementShareText` com `payeePixKey` presente → texto contém a chave.
  - `buildSettlementShareText` sem `payeePixKey` (`undefined`/`null`/`""`) → texto não tem linha de Pix.
  - `buildGroupSummaryShareText` com 2+ `pendingSettlements` → cada par `payerName`/`payeeName` aparece no texto, com a chave Pix só na linha cujo item tem `payeePixKey`.
  - `buildGroupSummaryShareText` com `pendingSettlements: []` → texto diz que o grupo está quite (não lista nada).
  - `buildWhatsAppShareUrl` → resultado começa com `https://wa.me/?text=` e espaço vira `%20` (não `+`).
  Os testes devem falhar nesta etapa (`lib/share-text.ts` ainda não existe).
- [X] T003 Criar `lib/share-text.ts` com `buildSettlementShareText`, `buildGroupSummaryShareText` e `buildWhatsAppShareUrl`, assinaturas e garantias exatas de `contracts/share-text.md` e `data-model.md` (`SettlementShareInput`, `GroupSummaryShareInput`, `PendingSettlementLine`); usar `formatBRL` de `lib/money.ts` para o valor. `pnpm test` passa com T002 (depende de T002)
- [X] T004 Criar `components/app/share-button.tsx` (`"use client"`): props `text: string`, `label: string`, `shareTitle?: string`; renderiza botão "Compartilhar" chamando `navigator.share({ title: shareTitle, text })` com `catch` vazio só quando `typeof navigator !== "undefined" && typeof navigator.share === "function"` (mesmo padrão de `components/invites/created-invite.tsx:16,18-24`); sempre renderiza um link `<a href={buildWhatsAppShareUrl(text)} target="_blank" rel="noreferrer">` com texto "Abrir no WhatsApp" e `aria-label={label}`, e `<CopyTextButton text={text} label="Copiar texto" copiedLabel="Texto copiado" />`; todos os controles com `aria-label` descritivo (depende de T003, importa `buildWhatsAppShareUrl`)

**Checkpoint**: `pnpm test` verde; `ShareButton` pronto para os dois pontos de uso.

---

## Phase 3: User Story 1 - Cobrar um acerto pendente (Priority: P1) 🎯 MVP

**Goal**: a pessoa credora de um acerto pendente consegue montar e enviar a cobrança (nome do
grupo, devedor, valor, minha chave Pix se houver, link do grupo) por compartilhamento
nativo/WhatsApp/copiar texto.

**Independent Test**: abrir um grupo com um acerto pendente em que você é a credora, tocar em
"Cobrar" e confirmar que o texto contém o devedor, o valor, sua chave Pix (quando cadastrada) e o
link do grupo; confirmar que o acerto em que você é a devedora não mostra o botão.

### Implementation for User Story 1

- [X] T005 [US1] Criar `components/app/charge-settlement-button.tsx` (Server Component — sem `"use client"`, só compõe `<ShareButton>`): props `groupUrl: string`, `groupName: string`, `payerName: string`, `payeeName: string`, `amountCents: number`, `payeePixKey?: string | null`; chama `buildSettlementShareText` (T003) e renderiza `<ShareButton text={...} shareTitle={groupName} label="Cobrar" />` (depende de T003, T004)
- [X] T006 [US1] Em `app/(conta)/grupos/[id]/page.tsx`: montar `groupUrl` uma vez com `headers()` (`next/headers`) — `` `${(await headers()).get("x-forwarded-proto") ?? "https"}://${(await headers()).get("host")}/grupos/${group.id}` `` — e, no `.map` da seção "Para acertar" (linhas ~330-377), renderizar `<ChargeSettlementButton>` (T005) só quando `settlement.to === me.id`, ao lado do `CopyTextButton` da chave Pix já existente (linhas 366-374), passando `groupUrl` `groupName={group.name}` `payerName={displayName(names, settlement.from, me.id)}` `payeeName={displayName(names, settlement.to, me.id)}` `amountCents={settlement.amountCents}` `payeePixKey={me.pixKey}` (depende de T005)

**Checkpoint**: botão "Cobrar" aparece só na linha em que você é a credora; passo "Cobrar" do
`quickstart.md` funciona (com e sem chave Pix, com e sem Web Share).

---

## Phase 4: User Story 2 - Compartilhar o resumo do grupo (Priority: P2)

**Goal**: qualquer membro do grupo monta e envia um resumo de todos os acertos pendentes (quem
paga quanto a quem, com a própria chave Pix nos acertos em que é a credora, e o link do grupo).

**Independent Test**: abrir um grupo com 2+ acertos pendentes entre pessoas diferentes, tocar em
"Compartilhar resumo" e confirmar que o texto lista cada par devedor/credora; abrir um grupo quite
e confirmar que o texto diz isso em vez de listar acertos.

**Depende de**: Fase 2 (usa os mesmos `buildGroupSummaryShareText`/`ShareButton`); não depende da
Fase 3.

### Implementation for User Story 2

- [X] T007 [US2] Criar `components/app/share-group-summary-button.tsx` (Server Component — sem `"use client"`, só compõe `<ShareButton>`): props `groupUrl: string`, `groupName: string`, `pendingSettlements: PendingSettlementLine[]` (tipo de `contracts/share-text.md`); chama `buildGroupSummaryShareText` (T003) e renderiza `<ShareButton text={...} shareTitle={groupName} label="Compartilhar resumo" />` (depende de T003, T004)
- [X] T008 [US2] Em `app/(conta)/grupos/[id]/page.tsx`, reusando o `groupUrl` montado em T006, perto do `SectionLabel` "Para acertar" (linha ~322-323), renderizar `<ShareGroupSummaryButton>` (T007) passando `groupUrl` `groupName={group.name}` e `pendingSettlements={open.map(s => ({ payerName: displayName(names, s.from, me.id), payeeName: displayName(names, s.to, me.id), amountCents: s.amountCents, payeePixKey: s.to === me.id ? me.pixKey : undefined }))}` — `payeePixKey` só vem preenchido quando a credora é a própria pessoa logada (restrição documentada em `data-model.md`; `ApiGroupMember` não traz a chave Pix de outros membros) (depende de T007; mesmo arquivo de T006 — rodar depois para evitar conflito de merge)

**Checkpoint**: "Compartilhar resumo" lista todos os acertos pendentes do grupo (com chave Pix só
nos seus); grupo quite mostra a mensagem de quite; passo "Compartilhar resumo" do `quickstart.md`
funciona.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T009 [P] Percorrer o roteiro manual do `specs/030-share-whatsapp-summary/quickstart.md` (Cobrar, Compartilhar resumo, sem chave Pix, sem Web Share, 375px e desktop, foco por teclado e `aria-live`) e marcar no PR o que foi visto — **pendente**: exige API local no ar (`API_ORIGIN`, hoje comentado em `.env.local`) e um usuário logado com grupo/acerto reais; não foi possível rodar neste ambiente
- [X] T010 Rodar `pnpm lint`, `pnpm test` e `pnpm build` na branch e confirmar que todos passam

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar já.
- **Foundational (Phase 2)**: depende do Setup — BLOQUEIA as duas histórias (T003 depende de T002; T004 depende de T003).
- **User Story 1 (Phase 3)**: depende da Fase 2; não depende da US2.
- **User Story 2 (Phase 4)**: depende da Fase 2; não depende da US1 na lógica, mas T008 edita o mesmo arquivo que T006 (`page.tsx`) — aplicar depois de T006 para evitar conflito, não por dependência de dados.
- **Polish (Phase 5)**: depende de US1 e US2 completas.

### Parallel Opportunities

- T002 (teste) roda sozinho antes de T003 (implementação), mas não em paralelo com ele (TDD: teste primeiro, falhando).
- T005 e T007 podem ser feitos em paralelo por pessoas diferentes depois da Fase 2 (arquivos novos e distintos), mas T006 e T008 tocam o mesmo `page.tsx` — aplicar um de cada vez.
- T009 pode rodar em paralelo com a preparação de T010 (um é manual, outro é comando).

---

## Implementation Strategy

### MVP First (User Story 1)

1. Fase 1: Setup.
2. Fase 2: Foundational (`lib/share-text.ts` + `ShareButton`) — bloqueia tudo.
3. Fase 3: User Story 1 ("Cobrar").
4. Validar com o `quickstart.md` (seção US1) e parar aqui se só o MVP for necessário.

### Incremental Delivery

1. Setup + Foundational → base pronta.
2. US1 ("Cobrar") → validar independente → MVP.
3. US2 ("Compartilhar resumo") → validar independente (reusa a mesma base, não depende da US1).
4. Polish: roteiro completo do quickstart + lint/test/build.

## Notes

- [P] = arquivos diferentes, sem depender de tarefa pendente.
- Rodar `pnpm test`/`pnpm lint` depois de cada tarefa de implementação.
- Nenhuma rota ou endpoint novo — só os dois arquivos de `lib/`+`components/app/` e as duas edições em `page.tsx`.
