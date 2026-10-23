# Feature Specification: Cookie de sessão preso ao host, sempre seguro

**Feature Branch**: `feature/025-host-session-cookie`

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/84"

## Contexto

Nota de endurecimento da re-auditoria run-2 (#63), registrada na issue #84 com a decisão "não por
enquanto" e agora levada adiante.

**Hoje:** o cookie de sessão `kotta_session` é `httpOnly`, `sameSite=lax`, `path=/`, e só é
marcado como seguro (enviado apenas por HTTPS) em produção. Como o nome não tem o prefixo
`__Host-`, o navegador aceita que outro subdomínio de `kottagroups.com.br` grave um cookie com o
mesmo nome valendo para o domínio inteiro. Um subdomínio comprometido poderia então plantar uma
sessão escolhida pelo atacante na pessoa (fixação de sessão) ou derrubar a sessão dela.

**Por que foi adiado:** o ataque exige um subdomínio comprometido, e trocar o nome do cookie, se
feito de uma vez, desloga todo mundo. Esta spec resolve o segundo ponto com uma transição em que
ninguém perde a sessão.

**Onde o nome do cookie aparece hoje:** gravação, leitura e remoção da sessão no servidor; a
checagem de sessão vencida que roda antes de cada página; a rota de saída por sessão inválida;
os testes ponta a ponta; o README; e a política de privacidade (seção Cookies).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sessão nova não pode ser plantada por outro subdomínio (Priority: P1)

Uma pessoa entra no app. A sessão dela fica num cookie que o navegador só aceita se vier do
próprio host do app, por conexão segura, valendo para o site todo e sem domínio declarado. Nenhum
outro subdomínio consegue gravar, sobrescrever ou apagar esse cookie.

**Why this priority**: é o objetivo da issue. Fecha a fixação de sessão vinda de subdomínio, que
hoje depende só de nenhum subdomínio ser comprometido.

**Independent Test**: entrar no app e inspecionar o cookie de sessão: nome com o prefixo de host,
seguro, `httpOnly`, `sameSite=lax`, caminho `/`, sem domínio. Tentar gravar um cookie com esse
nome com domínio declarado ou sem a marca de seguro e ver o navegador recusar.

**Acceptance Scenarios**:

1. **Given** uma pessoa sem sessão, **When** ela entra com e-mail e senha, **Then** o navegador
   recebe só o cookie de sessão novo, com prefixo de host, seguro, `httpOnly`, `sameSite=lax`,
   caminho `/`, sem domínio, e com o mesmo vencimento que o token tem hoje.
2. **Given** o app rodando em desenvolvimento local ou nos testes ponta a ponta, **When** a
   pessoa entra, **Then** o cookie tem os mesmos atributos de produção, inclusive seguro (sem
   exceção por ambiente).
3. **Given** uma pessoa com sessão nova, **When** outra origem tenta gravar um cookie com o mesmo
   nome declarando domínio ou sem a marca de seguro, **Then** o navegador recusa e a sessão dela
   segue a mesma.

---

### User Story 2 - Quem já estava logado continua logado (Priority: P1)

Uma pessoa entrou antes da mudança e ainda tem o cookie com o nome antigo. Depois do deploy, ela
abre o app e continua logada. Nessa visita o app passa a sessão para o cookie novo e apaga o
antigo, sem pedir login de novo.

**Why this priority**: sem isso a mudança desloga toda a base de uma vez, que foi o motivo do
adiamento. Precisa sair junto com a US1.

**Independent Test**: com o app já mudado, colocar no navegador só o cookie antigo com um token
válido e abrir uma página protegida: a página abre logada, e depois da resposta o navegador tem
só o cookie novo, com o mesmo token e o mesmo vencimento.

**Acceptance Scenarios**:

1. **Given** só o cookie antigo com token válido, **When** a pessoa abre qualquer página do app,
   **Then** ela vê a página logada (não vai para o login) e a resposta grava o cookie novo com o
   mesmo token e o mesmo vencimento e apaga o antigo.
2. **Given** só o cookie antigo com token vencido, **When** a pessoa abre uma página protegida,
   **Then** acontece o mesmo de hoje com sessão vencida (vai para o login com o aviso "Sua sessão
   expirou") e o cookie antigo é apagado.
3. **Given** os dois cookies, com tokens diferentes, **When** a pessoa abre o app, **Then** vale
   o cookie novo e o antigo é apagado.
4. **Given** só o cookie antigo com token que a API já não aceita, **When** o app detecta a sessão
   inválida, **Then** acontece o mesmo de hoje (sai para o login) e nenhum dos dois cookies fica
   no navegador.

---

### User Story 3 - Sair apaga as duas sessões (Priority: P2)

Uma pessoa clica em "Sair" ou o app a desloga por sessão vencida ou inválida. Nenhum cookie de
sessão, de nome antigo ou novo, fica no navegador.

**Why this priority**: durante a transição o cookie antigo ainda pode existir; se a saída apagar
só o novo, o antigo traria a pessoa de volta logada.

**Independent Test**: com os dois cookies no navegador, clicar em "Sair" e conferir que nenhum dos
dois sobra e que uma página protegida pede login.

**Acceptance Scenarios**:

1. **Given** cookie novo, antigo ou ambos, **When** a pessoa clica em "Sair", **Then** os dois são
   apagados e a sessão é revogada na API como hoje.
2. **Given** cookie novo, antigo ou ambos com sessão vencida ou inválida, **When** o app desloga a
   pessoa, **Then** os dois são apagados.

---

### User Story 4 - Fim da transição (Priority: P3)

Passado o prazo em que qualquer cookie antigo já teria vencido sozinho, o app deixa de ler o nome
antigo. A partir daí só existe o cookie novo no código.

**Why this priority**: o caminho de transição é código temporário; sem um fim marcado ele vira
permanente (e um cookie antigo plantado continuaria sendo lido).

**Independent Test**: depois da remoção, um navegador com só o cookie antigo é tratado como sem
sessão.

**Acceptance Scenarios**:

1. **Given** a remoção feita, **When** chega uma requisição com só o cookie antigo, **Then** ela é
   tratada como sem sessão.
2. **Given** esta entrega publicada, **When** se olha o rastreamento do projeto, **Then** existe
   uma tarefa aberta para a remoção, com a data mais cedo em que ela pode acontecer.

---

### Edge Cases

- Cookie antigo com valor vazio: tratado como sem sessão, sem gravar cookie novo.
- Página que só lê a sessão e não pode gravar cookie: a migração acontece na etapa que roda antes
  de toda página, para que a primeira visita já saia com o cookie novo.
- Chamadas internas que leem a sessão (status de leitura da nota, ações de servidor) chegam com só
  o cookie antigo antes de qualquer navegação: continuam autenticadas pelo cookie antigo.
- Navegador local que não aceita cookie seguro em `http://localhost`: o desenvolvimento local e os
  testes rodam num navegador que aceita (Chromium e Firefox aceitam); se não aceitar, o login
  local falha de forma visível, em vez de cair numa exceção só para desenvolvimento.
- Subdomínio planta um cookie com o nome antigo depois da migração: durante a transição ele é
  ignorado quando o cookie novo existe (o novo vale) e apagado na visita; após a US4, ignorado
  sempre.
- Login em outra aba enquanto a migração de uma aba antiga acontece: vale o token do login mais
  recente, porque o cookie novo tem prioridade sobre o antigo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O cookie de sessão MUST ter o prefixo de host (`__Host-kotta_session`) e ser gravado
  com seguro, `httpOnly`, `sameSite=lax`, caminho `/` e sem domínio.
- **FR-002**: Os atributos do FR-001 MUST valer em todos os ambientes (produção, Preview,
  desenvolvimento local, testes ponta a ponta), sem condição por ambiente.
- **FR-003**: O vencimento do cookie novo MUST seguir a regra de hoje: o mesmo instante do token,
  ou 24 h quando o token não informa vencimento.
- **FR-004**: Durante a transição, a leitura da sessão MUST aceitar o cookie antigo quando o novo
  não existe, e MUST preferir o novo quando os dois existem.
- **FR-005**: Na primeira requisição de página com só o cookie antigo e token não vencido, a
  resposta MUST gravar o cookie novo com o mesmo token e o vencimento do FR-003, e MUST apagar o
  antigo.
- **FR-006**: Toda resposta que hoje apaga o cookie de sessão (saída, sessão vencida, sessão
  inválida) MUST apagar os dois nomes; quando há só o cookie antigo vencido ou com os dois
  presentes, o antigo MUST ser apagado também.
- **FR-007**: O nome antigo MUST existir em um único lugar do código do servidor (fora os testes),
  com comentário dizendo que é temporário e a partir de quando pode ser removido.
- **FR-008**: Esta entrega MUST abrir uma tarefa de acompanhamento para remover a leitura do nome
  antigo, com data não anterior a 24 h após o deploy em produção (o maior tempo de vida da sessão).
- **FR-009**: Os testes ponta a ponta MUST usar o nome novo e MUST cobrir: login grava só o cookie
  novo com os atributos do FR-001; navegador com só o cookie antigo válido continua logado e sai
  da resposta só com o novo; sair com os dois cookies não deixa nenhum.
- **FR-010**: README e a seção Cookies da política de privacidade MUST citar o nome novo.
- **FR-011**: O comportamento visível de hoje MUST se manter: mesmas rotas, mesmos avisos
  ("Sua sessão expirou", saída por `/sair`), mesma revogação na API ao sair.

### Key Entities

- **Cookie de sessão (novo)**: `__Host-kotta_session`; guarda o token da API; atributos do FR-001;
  vence com o token.
- **Cookie de sessão (antigo)**: `kotta_session`; só lido e apagado durante a transição; nunca
  gravado depois do deploy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das entradas no app, o navegador fica só com o cookie novo, com todos os
  atributos do FR-001, em todos os ambientes.
- **SC-002**: 0 pessoas com sessão válida no momento do deploy precisam entrar de novo por causa
  da mudança (verificado pelo teste do cookie antigo e pela ausência de pico de logins após o
  deploy).
- **SC-003**: Depois de sair, 0 cookies de sessão (de qualquer nome) ficam no navegador.
- **SC-004**: Um cookie com o nome novo enviado com domínio declarado ou sem a marca de seguro é
  recusado pelo navegador em 100% das tentativas.
- **SC-005**: A suíte ponta a ponta passa inteira com o nome novo, incluindo os três testes do
  FR-009.

## Assumptions

- O maior tempo de vida da sessão é 24 h (token da API e fallback do cookie, como no README).
  Se a API passar a emitir tokens mais longos antes da remoção, o prazo do FR-008 acompanha.
- O app é servido por HTTPS em produção e Preview; localmente, por `http://localhost`, que os
  navegadores usados (Chromium nos e2e) tratam como contexto seguro.
- O app roda num único host; nenhum outro subdomínio precisa ler a sessão.
- A mudança da política de privacidade é só o nome do cookie, sem alterar finalidade nem base
  legal; o texto ainda está em rascunho (`draft: true`), então não exige nova versão nem novo
  aceite.
- A remoção do nome antigo (US4) é feita numa entrega separada, depois do prazo; esta entrega só
  abre a tarefa.
- A revogação da sessão na API ao sair (spec 023) não muda.
