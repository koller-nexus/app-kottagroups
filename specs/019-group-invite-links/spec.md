# Feature Specification: Convidar para o grupo por link e por e-mail

**Feature Branch**: `feature/019-group-invite-links`

**Created**: 2026-10-17

**Status**: Implemented (pendente: roteiro manual do quickstart com contas reais)

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/27 implemente essa issue"

## Contexto

Hoje só dá para adicionar ao grupo quem já está em outro grupo seu (a tela de Membros lista essas
pessoas), porque a API exige o identificador da conta. Quem nunca usou o Kotta Groups com você não
tem como entrar. A API já entrega convites por link e por e-mail (koller-nexus/api-kottagroups#164,
spec `071-group-invite-links`, já fechada). Falta a parte da web:

- um modal "Convidar" no grupo, para donos e admins, com link copiável, QR code e envio por e-mail;
- a lista de convites do grupo, com a opção de revogar;
- a página pública `/convite/[token]`, que mostra para qual grupo é o convite e leva quem abriu ao
  cadastro ou ao login e, depois, para dentro do grupo.

Issue de origem: koller-nexus/app-kottagroups#27 (B1). Guarda-chuva: #15. Dependência: API F1
(#164). Relacionadas: spec 017 (cadastro, confirmação e login com `next`), spec 016 (páginas de
erro).

### Contrato da API que esta tela consome (resumo da spec 071)

- Criar convite (dono/admin): opcionalmente com e-mail (sempre uso único), número máximo de usos
  (1–100) e validade (1 hora a 30 dias); padrão: uso único, 7 dias. O link com o segredo volta
  **uma única vez**, na criação. Falha no envio do e-mail não impede a criação.
- Listar convites do grupo (dono/admin): criador, e-mail alvo, usos/máximo, validade, revogação e
  criação. Nunca devolve o link.
- Revogar convite (dono/admin): imediato e idempotente.
- Prévia pública do convite: nome e emoji do grupo, nome de quem convidou e validade. Convite
  desconhecido, expirado, revogado, esgotado ou de grupo apagado devolve sempre a mesma resposta.
- Aceitar convite (logado, e-mail confirmado): entra como membro; se já for membro, sucesso sem
  mudança. Convite com e-mail só pode ser aceito pela conta com aquele e-mail; caso contrário, erro
  explícito de e-mail diferente e o convite não é gasto.
- Criar e aceitar têm limite de tentativas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar no grupo pelo link do convite (Priority: P1)

Uma pessoa recebe um link de convite (WhatsApp, QR, e-mail) e o abre. Ela vê o nome e o emoji do
grupo e quem a convidou. Se já está logada com e-mail confirmado, toca em "Entrar no grupo" e cai
dentro do grupo. Se não está logada, escolhe "Criar conta" ou "Já tenho conta", faz o cadastro (com
confirmação de e-mail) ou o login, e volta automaticamente para a mesma página de convite para
confirmar a entrada.

**Why this priority**: É o motivo da feature: sem essa página, nenhum link de convite funciona, e
hoje é impossível trazer alguém novo para um grupo.

**Independent Test**: Com um link de convite válido gerado na API, abrir `/convite/<token>` sem
sessão, criar conta, confirmar o e-mail, voltar à página e tocar em "Entrar no grupo"; a pessoa
termina na página do grupo e aparece na lista de membros.

**Acceptance Scenarios**:

1. **Given** um convite válido e uma visita sem sessão, **When** a pessoa abre o link, **Then** vê
   o emoji e o nome do grupo, o nome de quem convidou e até quando o convite vale, além das ações
   "Criar conta" e "Já tenho conta", sem dados financeiros nem lista de membros.
2. **Given** a visita sem sessão na página do convite, **When** a pessoa escolhe "Criar conta" ou
   "Já tenho conta" e conclui o cadastro (incluindo a confirmação de e-mail) ou o login, **Then**
   volta para a mesma página de convite, agora com a ação "Entrar no grupo".
3. **Given** uma pessoa logada com e-mail confirmado, **When** toca em "Entrar no grupo", **Then**
   entra no grupo e é levada à página do grupo, com um aviso de que entrou.
4. **Given** uma pessoa logada que já é membro do grupo, **When** abre o convite e confirma,
   **Then** é levada à página do grupo sem erro, com aviso de que já fazia parte dele.
5. **Given** uma pessoa logada com e-mail ainda não confirmado, **When** tenta entrar no grupo,
   **Then** é levada à tela de confirmar e-mail e, após confirmar, volta ao convite.
6. **Given** um convite desconhecido, expirado, revogado ou esgotado, **When** alguém abre o link,
   **Then** vê uma única mensagem "Este convite não vale mais", com a orientação de pedir um novo
   link a quem convidou e um caminho para o Painel (com sessão) ou para entrar (sem sessão).

---

### User Story 2 - Gerar e compartilhar um link de convite (Priority: P1)

Dono ou admin abre o grupo, toca em "Convidar" e gera um link. O modal mostra o link, um botão para
copiar (com confirmação "Link copiado"), um QR code para quem está ao lado escanear e, quando o
aparelho permitir, o compartilhamento nativo. O modal avisa que o link só aparece agora e vale para
uma pessoa por 7 dias.

**Why this priority**: Sem gerar o link na web, o convite só existe via API; junto com a US1 forma o
MVP de ponta a ponta.

**Independent Test**: Como admin, abrir o grupo, tocar em "Convidar", gerar o link, copiar e abrir
em outra sessão; a página da US1 mostra o grupo certo.

**Acceptance Scenarios**:

1. **Given** um dono ou admin na página do grupo, **When** toca em "Convidar" e gera o link,
   **Then** vê o link completo, o botão "Copiar link", o QR code do mesmo link e a validade/uso.
2. **Given** o link gerado, **When** toca em "Copiar link", **Then** o link vai para a área de
   transferência e um aviso "Link copiado" é anunciado também para leitores de tela.
3. **Given** um membro comum, **When** abre a página do grupo, **Then** não vê a ação "Convidar".
4. **Given** a geração falha (sem conexão, limite de tentativas, permissão perdida), **When** o
   modal recebe a falha, **Then** mostra uma mensagem clara com o que fazer e permite tentar de novo,
   sem fechar o modal.
5. **Given** o modal aberto, **When** a pessoa fecha (botão, Esc ou toque fora), **Then** o foco
   volta para o botão "Convidar".

---

### User Story 3 - Convidar uma pessoa por e-mail (Priority: P2)

No mesmo modal, dono ou admin informa o e-mail de alguém. A pessoa recebe um e-mail com o link. Só
a conta com aquele e-mail consegue usar esse convite.

**Why this priority**: Cobre o "convida meu amigo pelo e-mail" e dá mais segurança que um link
solto, mas a US1+US2 já resolvem o caso principal.

**Independent Test**: Como admin, convidar `pessoa@exemplo.com`; o modal confirma o envio e mostra
o link também; o convite aparece na lista com esse e-mail; abrir o link logado com outra conta mostra
o aviso de e-mail diferente.

**Acceptance Scenarios**:

1. **Given** um dono ou admin no modal, **When** informa um e-mail válido e envia, **Then** vê
   "Convite enviado para pessoa@exemplo.com" e também o link, para compartilhar por outro meio se
   quiser.
2. **Given** um e-mail com formato inválido, **When** tenta enviar, **Then** vê o erro junto ao
   campo, antes de qualquer chamada, e o campo tem rótulo visível.
3. **Given** um convite com e-mail aberto por uma conta com outro e-mail, **When** a pessoa tenta
   entrar no grupo, **Then** vê "Este convite foi enviado para outro e-mail" com a opção de sair e
   entrar com a conta certa (voltando ao convite), e o convite continua válido.
4. **Given** que a API criou o convite mas não conseguiu enviar o e-mail, **When** o modal recebe a
   resposta, **Then** o link é exibido normalmente para compartilhamento manual (a tela não promete um
   envio que não pode confirmar além do que a API informar).

---

### User Story 4 - Ver e revogar convites do grupo (Priority: P2)

Dono ou admin vê os convites do grupo separados em "Pendentes" (ainda valem) e "Encerrados"
(usados, expirados ou revogados), com e-mail alvo quando houver, quem criou, usos e validade. Um
convite pendente pode ser revogado, com confirmação.

**Why this priority**: Necessário para matar um link vazado, mas o fluxo de entrar funciona sem ele.

**Independent Test**: Criar dois convites, revogar um; ele passa para "Encerrados" como revogado, e
abrir seu link mostra "Este convite não vale mais".

**Acceptance Scenarios**:

1. **Given** um dono ou admin, **When** abre a lista de convites, **Then** vê os pendentes primeiro,
   cada um com e-mail (ou "Link"), criador, usos/máximo e "vale até", e os encerrados com o motivo
   (usado, expirado ou revogado).
2. **Given** um convite pendente, **When** toca em "Revogar" e confirma, **Then** o convite passa a
   "Revogado" sem recarregar a página inteira e a mudança é anunciada para leitores de tela.
3. **Given** um grupo sem convites, **When** abre a lista, **Then** vê um estado vazio que convida a
   gerar o primeiro link.
4. **Given** a lista não carrega, **When** a falha acontece, **Then** vê uma mensagem com opção de
   tentar de novo, sem afetar o resto da página do grupo.
5. **Given** a lista, **When** procura o link de um convite antigo, **Then** a tela deixa claro que
   o link só aparece na criação e que, para compartilhar de novo, é preciso gerar outro.

---

### User Story 5 - Um link para várias pessoas, com validade escolhida (Priority: P3)

Ao gerar o link, dono ou admin pode escolher para quantas pessoas ele vale (por exemplo, a turma
inteira de uma viagem) e por quanto tempo, dentre opções simples.

**Why this priority**: Conveniência sobre o padrão de uso único; pode ficar para depois sem quebrar
nada.

**Independent Test**: Gerar um link para 3 pessoas; três contas diferentes entram; a quarta vê
"Este convite não vale mais".

**Acceptance Scenarios**:

1. **Given** o modal de convite, **When** escolhe "Várias pessoas" com um limite entre 1 e 100 e uma
   validade entre as opções oferecidas, **Then** o link gerado mostra esse limite e essa validade.
2. **Given** um valor fora do intervalo, **When** tenta gerar, **Then** vê o erro junto ao campo
   antes de qualquer chamada.
3. **Given** um convite por e-mail, **When** a pessoa preenche o e-mail, **Then** a opção "Várias
   pessoas" não fica disponível (convite por e-mail é sempre de uso único).

### Edge Cases

- O link expira, é revogado ou se esgota entre abrir a página e tocar em "Entrar no grupo": a página
  mostra "Este convite não vale mais" no lugar da ação, sem erro genérico.
- O grupo é apagado depois do convite: mesmo tratamento de convite inválido.
- Token malformado na URL (vazio, curto, caracteres estranhos): mesmo tratamento de convite
  inválido, sem chamar dados do grupo.
- Limite de tentativas ao aceitar ou gerar: mensagem "Muitas tentativas, aguarde um pouco e tente de
  novo", sem perder o que foi preenchido.
- Sessão expira com a página do convite aberta: ao tentar entrar, a pessoa vai ao login e volta para
  o convite.
- A pessoa logada abre o link de um convite com e-mail que é dela, mas digitado com outra
  capitalização: entra normalmente (a comparação é da API e ignora maiúsculas).
- Quem gerou o link deixa de ser admin: a ação "Convidar" e a lista somem para essa pessoa; os
  convites já criados continuam valendo.
- Área de transferência indisponível (navegador sem permissão): o link fica visível e selecionável
  para copiar manualmente, com aviso.
- Compartilhamento nativo indisponível: o botão não aparece; copiar e QR seguem disponíveis.
- Tela de 375px: link longo quebra ou rola dentro do próprio campo, sem criar rolagem horizontal na
  página; QR legível.
- O link do convite contém um segredo: a página do convite não pode repassá-lo a terceiros nem ser
  indexada por buscadores.

## Requirements *(mandatory)*

### Functional Requirements

**Página pública do convite**

- **FR-001**: O sistema MUST oferecer a página `/convite/[token]`, acessível com e sem sessão; ela
  MUST NOT redirecionar visitantes sem sessão para o login nem redirecionar visitantes logados para o
  Painel.
- **FR-002**: Para convite válido, a página MUST mostrar só: emoji e nome do grupo, nome de quem
  convidou e validade do convite. MUST NOT mostrar membros, valores ou qualquer outro dado do grupo.
- **FR-003**: Sem sessão, a página MUST oferecer "Criar conta" e "Já tenho conta", ambos preservando
  o retorno para a mesma página de convite através do cadastro, da confirmação de e-mail e do login.
- **FR-004**: Com sessão, a página MUST oferecer "Entrar no grupo"; a entrada MUST exigir esse toque
  explícito (nunca acontecer só por abrir o link).
- **FR-005**: Ao entrar com sucesso, ou se já for membro, a pessoa MUST ser levada à página do grupo
  com um aviso que diferencie "Você entrou em <grupo>" de "Você já fazia parte de <grupo>".
- **FR-006**: Todos os casos de convite inválido (desconhecido, expirado, revogado, esgotado, grupo
  apagado, token malformado) MUST mostrar a mesma mensagem, com orientação de pedir um novo link e um
  caminho para o Painel ou para entrar.
- **FR-007**: Pessoa logada sem e-mail confirmado MUST ser levada à confirmação de e-mail e voltar ao
  convite depois de confirmar.
- **FR-008**: Convite enviado para outro e-mail MUST mostrar mensagem específica e a opção de sair e
  entrar com outra conta, voltando ao convite; o convite MUST continuar válido.
- **FR-009**: A página MUST NOT ser indexada por buscadores e MUST NOT repassar o endereço com o
  segredo a outros sites (por exemplo, como origem de navegação ou em recursos externos).

**Modal "Convidar"**

- **FR-010**: Só dono e admin MUST ver a ação "Convidar" e a lista de convites do grupo; membros
  comuns não.
- **FR-011**: O modal MUST permitir gerar um link de uso único válido por 7 dias com um toque, sem
  preencher nada.
- **FR-012**: Após gerar, o modal MUST mostrar o link completo, "Copiar link", o QR code do mesmo
  link, a validade e o número de usos, e avisar que o link só é exibido agora.
- **FR-013**: "Copiar link" MUST confirmar com "Link copiado" anunciado em região viva; se copiar
  falhar, o link MUST permanecer visível e selecionável, com aviso para copiar manualmente.
- **FR-014**: Quando o aparelho suportar compartilhamento nativo, o modal MUST oferecer
  "Compartilhar"; quando não suportar, a ação MUST NOT aparecer.
- **FR-015**: O modal MUST permitir informar um e-mail (com rótulo visível e validação de formato
  junto ao campo antes de enviar) para criar convite por e-mail; o resultado MUST confirmar o envio
  para aquele endereço e também exibir o link.
- **FR-016**: O modal MUST ser acessível: foco vai para dentro ao abrir, fica preso nele enquanto
  aberto, Esc fecha, e o foco volta ao botão "Convidar" ao fechar.
- **FR-017**: Falhas ao gerar MUST aparecer dentro do modal, com mensagem que diga o que fazer, sem
  perder o que foi preenchido e permitindo tentar de novo; durante a geração o botão MUST indicar
  carregamento e não aceitar toques repetidos.
- **FR-018** (P3): O modal MUST permitir escolher "Várias pessoas" (limite de 1 a 100) e a validade
  dentre opções entre 1 hora e 30 dias, validando antes de enviar; essa opção MUST ficar indisponível
  quando houver e-mail preenchido.

**Lista de convites**

- **FR-019**: A lista MUST separar "Pendentes" (válidos) de "Encerrados" (usados, expirados ou
  revogados), mostrando por convite: e-mail alvo ou "Link", quem criou, usos/máximo, "vale até" ou o
  motivo do encerramento, e quando foi criado.
- **FR-020**: Convites pendentes MUST ter "Revogar", com confirmação; após revogar, o item MUST
  mudar para "Revogado" na tela e a mudança MUST ser anunciada em região viva.
- **FR-021**: A lista MUST ter estados de carregando, vazio (com chamada para gerar o primeiro link)
  e erro (com tentar de novo), sem bloquear o resto da página do grupo.
- **FR-022**: A lista MUST deixar claro que o link de um convite existente não pode ser exibido de
  novo e que é preciso gerar outro.
- **FR-023**: Um convite recém-gerado no modal MUST aparecer em "Pendentes" sem recarregar a página.

**Transversais**

- **FR-024**: O limite de tentativas da API MUST virar a mensagem "Muitas tentativas, aguarde um
  pouco e tente de novo" em qualquer ação desta feature.
- **FR-025**: Todas as telas desta feature MUST seguir o `DESIGN.md` e os tokens do projeto e
  funcionar em 375px e no desktop sem rolagem horizontal.
- **FR-026**: As regras sem interface desta feature (validação do token na URL, classificação do
  convite em pendente/encerrado e motivo, tradução dos erros da API em mensagens, validação de e-mail,
  limite e validade, montagem do retorno para o convite) MUST ter testes automatizados da lógica.

### Key Entities *(include if feature involves data)*

- **Convite do grupo**: permissão revogável e com prazo para entrar em um grupo. Visto pela web com:
  grupo, quem criou, e-mail alvo (opcional), usos e máximo, validade, revogação, criação. O link com o
  segredo só existe no momento da criação.
- **Prévia do convite**: o que a página pública mostra: emoji e nome do grupo, nome de quem convidou,
  validade.
- **Membro do grupo** (existente): ganha novas pessoas pelo aceite, sempre com papel de membro.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa já logada com e-mail confirmado vai do toque no link a estar dentro do
  grupo em até 2 toques e menos de 30 segundos.
- **SC-002**: Uma pessoa sem conta vai do link a estar dentro do grupo, passando por cadastro e
  confirmação de e-mail, sem precisar reabrir o link nem navegar manualmente de volta.
- **SC-003**: Um admin gera e copia um link de convite em até 3 toques a partir da página do grupo.
- **SC-004**: 100% dos casos de convite inválido mostram a mesma mensagem na página do convite.
- **SC-005**: Todas as telas da feature passam na verificação em 375px e desktop sem rolagem
  horizontal, e todas as ações são operáveis só pelo teclado, com foco visível.
- **SC-006**: Um convite revogado deixa de funcionar imediatamente: abrir seu link logo após revogar
  mostra a mensagem de convite inválido em 100% das tentativas.
- **SC-007**: Nenhuma ação "Convidar" ou lista de convites aparece para membros comuns.

## Assumptions

- Os endpoints da API F1 (spec 071) estão em produção e são a única fonte de verdade sobre validade,
  permissões, comparação de e-mail e limite de tentativas; a web só reflete as respostas.
- A API monta o link como `<URL pública da web>/convite/<token>`; a web não inventa outro formato.
- Política de e-mail diferente é **recusar** (decidida na API); a web só explica e oferece trocar de
  conta.
- A entrada no grupo é sempre um toque explícito na página do convite, mesmo logo após o
  cadastro/login, para a pessoa ver em qual grupo está entrando.
- A lista de convites e o modal ficam no contexto do grupo acessível a dono/admin (página do grupo
  ou de membros); o lugar exato é decisão de plano, seguindo o `DESIGN.md`.
- Gerar QR code exige uma capacidade que o projeto ainda não tem (hoje só lê QR); a escolha da
  forma de gerar fica para o plano, seguindo a regra de dependências da constituição.
- A tela de Membros continua oferecendo adicionar quem está nos seus outros grupos; o convite
  complementa, não substitui.
- Fora do escopo: membro fantasma (F6/B6), convites que dão papel de admin, reenviar e-mail de um
  convite existente, editar convite, limpeza automática de convites antigos, e qualquer mudança na
  API.
