# Feature Specification: Performance do front — baseline, fim dos waterfalls e decisão sobre cache de dados no cliente

**Feature Branch**: `feature/018-front-performance`

**Created**: 2026-10-16

**Status**: Draft

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/14 implemente essa issue"

## Contexto

Hoje toda tela busca seus dados no servidor a cada navegação, sem cache entre requisições, e
recarrega também o "shell" (perfil, contador de notificações e lista de grupos). Os pontos
mais caros, segundo a issue #14:

- **Painel**: lista os grupos, depois busca o detalhe de cada grupo e, para cada um, pagina as
  despesas até o início do mês anterior. São 1 + N + N·k chamadas por visita, em cascata.
- **Detalhes de grupos (N+1)**: Nova despesa, Notificações, Grupos e Membros buscam o detalhe
  de cada grupo um por um.
- **Notas pendentes**: a tela inteira (shell incluído) é recarregada a cada 3 s enquanto há
  nota em leitura, mesmo com a aba em segundo plano.
- **Lista de compras**: marcar um item espera a ida e volta ao servidor e recarrega o app
  inteiro, sem resposta visual imediata.
- **Invalidação**: 25 das 29 invalidações após mutations recarregam o app inteiro.
- **Carregamento**: há um único estado de carregamento para toda a área logada; a página
  espera a chamada mais lenta.

A API já entregou o que o front precisa para acabar com os waterfalls
(koller-nexus/api-kottagroups#162, PR #209, spec `069-dashboard-aggregates`):

- resumo do Painel em uma chamada (totais, gasto do mês corrente e anterior, grupos ativos
  com saldo do usuário e nº de membros, 3 notificações recentes e contagem de não pagas);
- lista de grupos com membros e saldos em lote (até 50 grupos por página);
- filtro de despesas por intervalo de datas (`since`/`until`, até 366 dias).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Medir antes de mudar e decidir com dados (Priority: P1)

A equipe registra um baseline de performance das rotas principais no mobile (métricas reais de
experiência, nº de chamadas à API por tela e tamanho do código enviado por rota) e, com esses
números, publica um registro de decisão sobre adotar, adotar parcialmente ou não adotar uma
biblioteca de cache de dados no cliente (TanStack Query e as demais da família: Virtual,
Table, Form), comparando com o uso do cache e do carregamento progressivo do próprio framework.

**Why this priority**: Toda melhoria seguinte precisa de um "antes" para provar ganho, e a
decisão de arquitetura define como as stories 3, 4 e 5 serão feitas.

**Independent Test**: Abrir o documento de baseline e o registro de decisão; conferir que
cada rota listada tem números e que a decisão cita esses números, custos e riscos.

**Acceptance Scenarios**:

1. **Given** as rotas Painel, Grupos, Grupo, Lista de compras, Notas, Nova despesa e Perfil,
   **When** o baseline é coletado em perfil mobile com rede 4G lenta, **Then** cada rota tem
   LCP, INP, CLS e TTFB, nº de chamadas à API por visita e tamanho do código por rota
   registrados.
2. **Given** o baseline, **When** o registro de decisão é publicado, **Then** ele compara ao
   menos três opções (biblioteca de cache + camada intermediária no servidor; cache e
   streaming nativos do framework; híbrido), com impacto em tamanho, complexidade, segurança
   (sessão em cookie não legível pelo navegador, CSRF, sessão expirada) e uma decisão
   explícita para cada biblioteca avaliada.
3. **Given** que o tráfego real começa a ser medido, **When** um usuário navega no app,
   **Then** as métricas de experiência por rota passam a ser coletadas em produção.

---

### User Story 2 - Painel carrega rápido, independente do nº de grupos (Priority: P1)

Um usuário com muitos grupos abre o Painel e vê totais, gasto do mês, grupos e atividade
recente sem esperar uma cascata de chamadas que cresce com cada grupo.

**Why this priority**: É a tela inicial e o pior waterfall do app; o ganho é direto para
todo usuário logado.

**Independent Test**: Abrir o Painel com 1 e com 20 grupos e contar as chamadas à API; o
número deve ser o mesmo, e os valores exibidos devem bater com os de hoje.

**Acceptance Scenarios**:

1. **Given** um usuário com N grupos ativos, **When** ele abre o Painel, **Then** o número de
   chamadas à API da visita é constante (não depende de N) e não passa de 5.
2. **Given** os mesmos dados, **When** o Painel é exibido antes e depois da mudança, **Then**
   totais (a receber / a pagar), gasto do mês corrente e anterior, saldo por grupo e
   atividade recente são idênticos.
3. **Given** que o resumo demora ou falha, **When** o Painel abre, **Then** o shell e o
   restante da tela aparecem e a seção afetada mostra estado de carregamento ou erro com
   ação para tentar de novo, sem derrubar a página.

---

### User Story 3 - Marcar item da lista de compras responde na hora (Priority: P2)

No mercado, com sinal fraco, o usuário toca num item da lista e o item aparece marcado
imediatamente; se o servidor recusar, o item volta ao estado anterior e o usuário é avisado.

**Why this priority**: É a interação mais frequente da tela usada em movimento, e hoje cada
toque espera a rede inteira.

**Independent Test**: Com rede lenta simulada, marcar e desmarcar itens e medir o tempo até
a mudança visual; forçar erro do servidor e conferir que o item volta e a mensagem aparece.

**Acceptance Scenarios**:

1. **Given** uma lista com itens, **When** o usuário marca um item, **Then** o item aparece
   marcado em menos de 100 ms, antes da resposta do servidor.
2. **Given** que o servidor recusa a mudança, **When** a resposta chega, **Then** o item
   volta ao estado anterior e uma mensagem explica o que falhou.
3. **Given** toques rápidos em vários itens, **When** as respostas chegam fora de ordem,
   **Then** o estado final de cada item corresponde ao último toque do usuário.
4. **Given** um item marcado, **When** a mudança é confirmada, **Then** só a lista afetada
   é atualizada; o resto do app não é recarregado.

---

### User Story 4 - Acompanhar notas em leitura sem pesar o app (Priority: P2)

Enquanto uma nota fiscal está sendo lida, o usuário vê o status atualizar sozinho, mas o app
não recarrega o shell inteiro a cada poucos segundos nem continua consultando em segundo plano.

**Why this priority**: O recarregamento a cada 3 s multiplica chamadas à API e trabalho no
aparelho enquanto a nota está pendente.

**Independent Test**: Abrir uma nota pendente, observar o intervalo entre consultas, trocar
de aba e voltar, e contar chamadas ao shell durante a espera.

**Acceptance Scenarios**:

1. **Given** uma nota pendente aberta, **When** o status é consultado, **Then** só o status
   das notas é buscado; perfil, contador de notificações e lista de grupos não são recarregados.
2. **Given** consultas seguidas sem mudança, **When** o tempo passa, **Then** o intervalo
   cresce (3 s → 5 s → 10 s) e as consultas param após 10 minutos, oferecendo uma ação para
   atualizar manualmente.
3. **Given** que a aba fica em segundo plano, **When** ela está oculta, **Then** as consultas
   pausam e retomam ao voltar.
4. **Given** que a nota termina (lida ou falhou), **When** o novo status chega, **Then** a
   tela mostra o resultado e as consultas param.

---

### User Story 5 - Telas de grupo e navegação sem recarregar tudo (Priority: P3)

O usuário navega entre Grupos, Membros, Nova despesa e Notificações e cada tela aparece
progressivamente, sem buscar grupo por grupo e sem que uma ação pequena recarregue o app
inteiro.

**Why this priority**: Ganho amplo, mas incremental; depende menos de decisão nova e pode
entrar aos poucos.

**Independent Test**: Contar chamadas à API nessas telas com 1 e 20 grupos; executar uma
mutation (ex.: marcar pagamento) e verificar que só as telas afetadas são atualizadas.

**Acceptance Scenarios**:

1. **Given** um usuário com N grupos, **When** ele abre Grupos, Membros, Nova despesa ou
   Notificações, **Then** os detalhes dos grupos chegam em lote, com nº de chamadas constante
   em relação a N.
2. **Given** qualquer mutation, **When** ela termina, **Then** só os dados das telas afetadas
   são atualizados, e não o app inteiro.
3. **Given** uma tela pesada (Painel, Grupo, Lista), **When** ela abre, **Then** o shell e
   as seções rápidas aparecem primeiro, e cada seção lenta mostra um esqueleto do design
   system até seus dados chegarem.
4. **Given** a lista de notificações, **When** o usuário pede a próxima página, **Then** os
   itens novos são anexados sem recarregar o shell.

---

### Edge Cases

- Usuário sem nenhum grupo: Painel mostra o estado vazio atual, com a mesma quantidade
  constante de chamadas.
- Grupo arquivado ou do qual o usuário saiu: não aparece no Painel nem nos detalhes em lote.
- Virada de mês (fuso America/Sao_Paulo): gasto do mês corrente e anterior batem com o
  cálculo atual.
- Usuário com mais de 50 grupos: detalhes em lote são paginados respeitando o limite da API.
- Sessão expira durante uma marcação otimista ou durante o polling de notas: o item volta ao
  estado anterior / o polling para, e o fluxo de sessão expirada já existente (spec 016) assume.
- Usuário fica offline ao marcar item: a marcação é desfeita e a mensagem diz que não houve
  conexão.
- Duas abas abertas na mesma lista: a outra aba reflete a mudança na próxima atualização,
  sem estado inconsistente.
- Lista muito longa (> 100 itens visíveis): registrar no baseline; virtualização só se o
  baseline mostrar necessidade.
- Imagens de avatar e de nota sem dimensões: não podem deslocar o layout ao carregar.

## Requirements *(mandatory)*

### Functional Requirements

**Medição e decisão**

- **FR-001**: O app MUST coletar métricas reais de experiência (LCP, INP, CLS, TTFB) por rota
  em produção.
- **FR-002**: O app MUST permitir registrar, por renderização no servidor, quantas chamadas à
  API foram feitas e quanto tempo levaram, sem expor tokens ou dados pessoais nos registros.
- **FR-003**: A equipe MUST publicar um baseline com as métricas do FR-001, o nº de chamadas à
  API por visita e o tamanho do código por rota, para as 7 rotas listadas na User Story 1,
  em perfil mobile com rede 4G lenta, e repetir a medição após as melhorias.
- **FR-004**: A equipe MUST publicar um registro de decisão em `docs/adr/0001-client-data-fetching.md`
  com problema, opções comparadas, impacto em tamanho, complexidade, segurança e decisão para
  TanStack Query, Virtual, Table e Form.

**Painel**

- **FR-005**: O Painel MUST obter totais, gasto do mês, grupos com saldo e atividade recente
  do resumo agregado da API, com nº de chamadas constante e no máximo 5 por visita (shell
  incluído).
- **FR-006**: Os valores exibidos no Painel MUST ser idênticos aos calculados hoje para os
  mesmos dados.
- **FR-007**: Falha ou lentidão de uma seção do Painel MUST NOT bloquear o shell nem as
  demais seções.

**Lista de compras**

- **FR-008**: Marcar e desmarcar um item MUST refletir na tela antes da resposta do servidor,
  em menos de 100 ms.
- **FR-009**: Em erro (servidor, rede ou sessão), o item MUST voltar ao estado anterior e uma
  mensagem MUST informar o motivo.
- **FR-010**: O estado final de cada item MUST corresponder à última ação do usuário, mesmo
  com respostas fora de ordem.

**Notas pendentes**

- **FR-011**: O acompanhamento de notas pendentes MUST consultar apenas o status das notas,
  sem recarregar o shell.
- **FR-012**: O intervalo entre consultas MUST crescer de 3 s para 5 s e depois 10 s, MUST
  pausar com a aba oculta, MUST parar quando nenhuma nota estiver pendente e MUST parar após
  10 minutos oferecendo atualização manual.

**Telas de grupo, invalidação e carregamento**

- **FR-013**: Grupos, Membros, Nova despesa, Notificações e o shell MUST obter detalhes de
  grupos em lote, com nº de chamadas constante em relação ao nº de grupos.
- **FR-014**: Cada mutation MUST atualizar apenas os dados das rotas/segmentos que ela afeta;
  atualizar o app inteiro só é permitido quando a mutation afeta o shell (perfil, grupos do
  menu ou contador de notificações), com justificativa.
- **FR-015**: Painel, Grupo e Lista de compras MUST exibir o shell primeiro e um esqueleto do
  design system por seção lenta até seus dados chegarem.
- **FR-016**: A paginação de notificações MUST anexar itens sem recarregar o shell.
- **FR-017**: Avatares e imagens de nota MUST carregar sob demanda, decodificar sem travar a
  renderização e reservar suas dimensões para não deslocar o layout.
- **FR-018**: Os links da barra de navegação inferior MUST ser pré-carregados no mobile.

**Não regressão**

- **FR-019**: Nenhuma rota MUST aumentar mais de 10% em código enviado ao navegador sem
  justificativa no registro de decisão.
- **FR-020**: Comportamentos existentes MUST ser mantidos: tratamento de sessão expirada e
  páginas de erro (spec 016), 404 de grupo inexistente, badges das lojas na home e textos
  atuais da interface.

### Key Entities

- **Resumo do Painel**: totais a receber/a pagar, gasto do mês corrente e anterior (mês
  `YYYY-MM`), grupos ativos com saldo do usuário e nº de membros, 3 notificações recentes,
  contagem de não pagas. Vem pronto da API.
- **Detalhe de grupo em lote**: grupo com membros e saldos, entregue em páginas de até 50.
- **Status de nota**: pendente, lida ou falhou; é o único dado consultado durante o
  acompanhamento.
- **Item da lista de compras**: marcado/desmarcado, com estado otimista provisório até a
  confirmação do servidor.
- **Baseline de performance**: por rota, métricas de experiência, nº de chamadas à API e
  tamanho do código, antes e depois.
- **Registro de decisão (ADR)**: problema, opções, critérios, decisão e consequências.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Baseline publicado para as 7 rotas, com métricas de experiência, nº de chamadas à
  API e tamanho do código, antes e depois.
- **SC-002**: Registro de decisão aprovado em review, com decisão explícita para cada uma das
  4 bibliotecas avaliadas.
- **SC-003**: O Painel faz o mesmo nº de chamadas à API (no máximo 5) para usuários com 1, 10
  ou 50 grupos.
- **SC-004**: Grupos, Membros, Nova despesa e Notificações fazem nº de chamadas constante em
  relação ao nº de grupos.
- **SC-005**: Marcar item da lista de compras muda visualmente em menos de 100 ms com rede 4G
  lenta, e 100% dos erros forçados desfazem a marcação com mensagem.
- **SC-006**: Durante 2 minutos com nota pendente, nenhuma recarga do shell ocorre; com a aba
  oculta, zero consultas.
- **SC-007**: No mobile com rede 4G lenta, LCP < 2,5 s e INP < 200 ms nas rotas principais,
  ou melhoria documentada em relação ao baseline em cada uma.
- **SC-008**: Nenhuma rota cresce mais de 10% em código enviado sem justificativa registrada.
- **SC-009**: Os testes de valores do Painel (vários grupos, grupo arquivado, ex-membro,
  virada de mês) passam com os mesmos números de antes.

## Assumptions

- Os endpoints da API de koller-nexus/api-kottagroups#162 (PR #209) estão disponíveis em
  produção: resumo do Painel, grupos com membros e saldos em lote e filtro de despesas por data.
- O resumo do Painel usa o fuso America/Sao_Paulo, igual ao cálculo atual do front.
- O token de sessão continua em cookie não legível pelo navegador; qualquer busca de dados no
  cliente passa por uma camada no servidor do próprio app, que trata sessão expirada como hoje.
- O baseline é coletado com as ferramentas de medição já usadas pelo time (Lighthouse mobile,
  análise de bundle do build, métricas reais de produção); a coleta é trabalho da equipe e o
  resultado também é registrado na issue #14.
- O ADR é aprovado pelo responsável do repositório no review do PR.
- Virtualização de listas fica fora de escopo, salvo se o baseline mostrar listas com mais de
  ~100 itens visíveis.
- Os textos visíveis ao usuário continuam em pt-BR e seguem o tom atual; mensagens de erro
  novas reutilizam o padrão de mensagens existente.
