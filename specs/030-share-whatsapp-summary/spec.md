# Feature Specification: Compartilhar cobrança e resumo via WhatsApp e Web Share

**Feature Branch**: `feature/030-share-whatsapp-summary`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/17"

## Contexto

Issue koller-nexus/app-kottagroups#17 ("A2"), guarda-chuva #15. Hoje a pessoa credora de um acerto
só pode copiar a própria chave Pix (`CopyTextButton` em `app/(conta)/grupos/[id]/page.tsx:366-374`)
e torcer para o devedor lembrar de pagar; não há como avisá-lo direto. Esta feature adiciona:

- Um botão **"Cobrar"** em cada acerto pendente ("Para acertar") do qual a pessoa logada é a
  credora (`settlement.to === me.id`), ao lado do botão de copiar a chave Pix já existente.
- Um botão **"Compartilhar resumo"** na página do grupo, disponível a qualquer membro.
- Ambos montam um texto em PT-BR e tentam `navigator.share`; sem suporte (ou se falhar), oferecem
  um link `https://wa.me/?text=` e um botão "Copiar texto" como alternativas.
- A lógica de montagem do texto fica em `lib/share-text.ts`, testada com `node --test`, seguindo o
  padrão já usado por outros módulos de `lib/` (ex.: `lib/money.ts` + `lib/money.test.mjs`).

Só front: não depende de rota ou endpoint novos na API. Não existe hoje uma página própria por
acerto (`settlement.id` não tem URL dedicada) — o link incluído no texto aponta para a página do
grupo, onde o acerto aparece.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cobrar um acerto pendente (Priority: P1)

Sou credora de um acerto pendente num grupo. Na seção "Para acertar", ao lado do meu acerto, toco
em "Cobrar". O app monta uma mensagem com o nome do grupo, quem me deve, o valor, minha chave Pix
(se tiver) e o link do grupo, e abre o compartilhamento do celular para eu escolher para quem
enviar (geralmente a própria pessoa devedora pelo WhatsApp).

**Why this priority**: é o pedido central da issue — hoje não há como cobrar alguém pelo app, só
copiar a chave Pix e avisar por fora.

**Independent Test**: pode ser testado abrindo um grupo com um acerto pendente em que eu sou a
credora, tocando em "Cobrar" e verificando que o texto/compartilhamento contém devedor, valor,
minha chave Pix (quando cadastrada) e o link do grupo.

**Acceptance Scenarios**:

1. **Given** um acerto pendente em que sou a credora e tenho chave Pix cadastrada, **When** toco em
   "Cobrar", **Then** o compartilhamento nativo abre com um texto contendo o nome de quem me deve,
   o valor do acerto, minha chave Pix e o link do grupo.
2. **Given** o mesmo acerto, mas sem chave Pix cadastrada, **When** toco em "Cobrar", **Then** o
   texto é montado sem nenhuma linha de chave Pix, sem erro e sem exigir que eu cadastre uma.
3. **Given** um navegador sem suporte a `navigator.share`, **When** toco em "Cobrar", **Then** vejo
   um link para abrir o WhatsApp com a mensagem pronta e um botão "Copiar texto", em vez do
   compartilhamento nativo.
4. **Given** um acerto pendente em que sou a devedora (não a credora), **Then** não vejo o botão
   "Cobrar" nesse acerto.

---

### User Story 2 - Compartilhar o resumo do grupo (Priority: P2)

Sou membro de um grupo e quero avisar todo mundo de uma vez de como está a divisão. Na página do
grupo, toco em "Compartilhar resumo". O app monta um texto com o nome do grupo e, para cada acerto
pendente, quem paga quanto a quem — com a minha chave Pix nos acertos em que eu sou a credora,
quando cadastrada — mais o link do grupo, e abre o compartilhamento.

**Why this priority**: é o segundo pedido da issue; depende da mesma lógica de texto da US1, mas
cobre o grupo todo em vez de um único acerto.

**Independent Test**: pode ser testado abrindo um grupo com acertos pendentes variados, tocando em
"Compartilhar resumo" e verificando que o texto lista corretamente cada par devedor/credora, com
minha chave Pix nos acertos em que sou a credora.

**Acceptance Scenarios**:

1. **Given** um grupo com dois ou mais acertos pendentes entre pessoas diferentes, **When** toco em
   "Compartilhar resumo", **Then** o texto lista cada acerto pendente (quem paga quanto a quem),
   com minha chave Pix nos acertos em que eu sou a credora, quando cadastrada.
2. **Given** um grupo em que todos já acertaram ("Todos estão quites"), **When** toco em
   "Compartilhar resumo", **Then** o texto informa que o grupo está quite, sem listar acertos.
3. **Given** um navegador sem suporte a `navigator.share`, **When** toco em "Compartilhar resumo",
   **Then** vejo o link do WhatsApp e o botão "Copiar texto" com o mesmo resumo.

---

### Edge Cases

- Credora sem chave Pix cadastrada: a linha de chave Pix é omitida do texto, tanto na cobrança
  individual quanto no resumo.
- Resumo do grupo com acerto pendente em que a credora **não** sou eu: o app web só conhece a
  própria chave Pix (`ApiGroupMember` não expõe a chave de outros membros, e buscá-la é mudança de
  API, fora do escopo). A linha de chave Pix desses acertos fica de fora do resumo; só o par
  devedor/credora e o valor aparecem.
- `navigator.share` existe mas a pessoa cancela o compartilhamento: a Promise rejeitada/cancelada
  **não** deve aparecer como erro para a pessoa usuária.
- Copiar o texto falha (ex.: `navigator.clipboard` indisponível): o botão "Copiar texto" mostra uma
  mensagem de falha, no padrão já usado por `CopyTextButton`.
- Nome de alguém que saiu do grupo: usa o mesmo fallback "Ex-membro" já aplicado nas outras seções
  da página do grupo (`lib/people.ts`).
- Grupo com muitos acertos pendentes: o resumo lista todos; não há limite de tamanho tratado à
  parte (ver Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir um botão "Cobrar" em cada acerto pendente da seção "Para
  acertar" do qual a pessoa logada é a credora (`settlement.to === me.id`), ao lado do botão de
  copiar a chave Pix já existente.
- **FR-002**: Ao tocar em "Cobrar", o sistema MUST montar um texto em PT-BR contendo: nome do
  grupo, nome de quem deve, nome (ou "Você") de quem recebe, valor do acerto formatado em reais, a
  chave Pix de quem recebe quando cadastrada, e um link para a página do grupo.
- **FR-003**: O sistema MUST exibir um botão "Compartilhar resumo" na página do grupo, visível a
  qualquer membro, independente de ele ter acerto pendente.
- **FR-004**: Ao tocar em "Compartilhar resumo", o sistema MUST montar um texto em PT-BR com o nome
  do grupo e, para cada acerto pendente, quem paga quanto a quem, incluindo a chave Pix só nos
  acertos em que a pessoa logada é a credora (quando cadastrada — o app não tem acesso à chave Pix
  de outros membros, ver Assumptions); se não houver acerto pendente, o texto MUST informar que o
  grupo está quite.
- **FR-005**: O sistema MUST tentar abrir o compartilhamento nativo (`navigator.share`) com o texto
  montado quando a API estiver disponível no navegador.
- **FR-006**: Quando `navigator.share` não estiver disponível, falhar ou for cancelado, o sistema
  MUST oferecer um link para o WhatsApp (`https://wa.me/?text=<texto codificado>`) e um botão
  "Copiar texto" como alternativas, sem exibir erro para cancelamento do usuário.
- **FR-007**: A lógica de montagem do texto (acerto individual e resumo do grupo, formatação da
  chave Pix e do link, codificação para a URL do WhatsApp) MUST viver em `lib/share-text.ts`, com
  testes em `lib/share-text.test.mjs` cobrindo: acerto com e sem chave Pix, resumo com e sem acertos
  pendentes, e a codificação do texto na URL do WhatsApp.
- **FR-008**: Os botões "Cobrar" e "Compartilhar resumo" e seus fallbacks (link do WhatsApp,
  "Copiar texto") MUST ser acessíveis por teclado, com `aria-label` descritivo, e qualquer feedback
  de cópia (sucesso ou falha) MUST ser anunciado via `aria-live`.
- **FR-009**: As telas de acerto e grupo, incluindo os novos botões e seus fallbacks, MUST
  permanecer utilizáveis e seguir `DESIGN.md` em 375px e em desktop.

### Key Entities

- **Texto de compartilhamento**: string gerada por `lib/share-text.ts` a partir de um acerto
  (devedor, credora, valor, chave Pix opcional, link) ou de um resumo de grupo (nome do grupo,
  lista de acertos pendentes, link); não é persistida, existe só no momento do compartilhamento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa credora consegue abrir o compartilhamento de um acerto pendente ("Cobrar")
  em um único toque a partir da página do grupo.
- **SC-002**: Em um navegador sem suporte a compartilhamento nativo, 100% das pessoas ainda
  conseguem obter o texto de cobrança/resumo pelo link de WhatsApp ou copiando o texto.
- **SC-003**: O texto gerado reflete corretamente quem deve a quem, o valor e a chave Pix (quando
  houver), validado por testes automatizados de `lib/share-text.ts`.
- **SC-004**: A página do grupo permanece acessível (foco visível, feedback por `aria-live`) e
  utilizável em 375px e desktop depois da mudança.

## Assumptions

- Não existe hoje uma URL própria por acerto; criar uma rota nova está fora do escopo ("Só front...
  não depende de API nova"). O "link do acerto" citado na issue é o link para a página do grupo
  (`/grupos/[id]`), onde o acerto aparece.
- O app web só conhece a própria chave Pix (`pixKey` de `ApiUser`, a pessoa logada); a lista de
  membros do grupo (`ApiGroupMember`) não traz a chave Pix de outros membros. Buscar essa chave
  seria mudança de API, fora do escopo. Por isso o "Compartilhar resumo" só inclui chave Pix nos
  acertos em que a própria pessoa logada é a credora; nos demais, aparece só quem paga quanto a
  quem, sem chave Pix.
- O texto de cobrança/resumo não tem limite de tamanho tratado especialmente; grupos pequenos (o
  caso comum do produto) geram textos dentro do que WhatsApp e Web Share aceitam normalmente.
- Quem não tem `pixKey` cadastrada pode usar "Cobrar"/"Compartilhar resumo" normalmente; a função
  não exige cadastrar uma chave Pix antes.
- O botão "Cobrar" aparece só para quem é credora do acerto (`settlement.to === me.id`); quem deve
  não vê esse botão no próprio acerto.
- "Compartilhar resumo" fica disponível a qualquer membro do grupo, mesmo sem acerto pendente.
