# Feature Specification: Páginas de erro padronizadas e logout automático quando a sessão expira

**Feature Branch**: `feature/016-error-pages-session-expiry`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/12 implemente essa issue"

## Contexto

Hoje o Kotta Groups não tem páginas próprias para os erros mais comuns. Uma rota que não existe,
ou um grupo/despesa/lista/nota/categoria a que a pessoa não tem acesso, cai na página padrão do
framework: em inglês, sem logo, sem barra de abas. Uma falha na raiz da aplicação não tem tela
nenhuma.

A sessão dura 24 horas. Quando uma chamada ao serviço recusa a credencial, o fluxo já funciona:
a pessoa vai para `/entrar` com o aviso "Sua sessão expirou" e volta para onde estava depois de
entrar. Mas há três buracos:

- Quando a credencial vence e o cookie ainda existe, ou quando o cookie some sozinho, a pessoa é
  mandada para `/entrar` **sem aviso** e sem entender por quê.
- Com a aba aberta e parada, nada acontece no momento em que a sessão vence. A pessoa só descobre
  ao clicar ou enviar um formulário, e nesse caso perde o que enviou.
- Se o serviço estiver fora do ar no momento de sair, a pessoa entra num pingue-pongue entre
  `/sair`, `/entrar` e `/`, terminando numa tela de erro genérica.

A spec 015 já entregou, na tela de erro geral, a distinção entre "sem conexão", "serviço fora do
ar" e "algo deu errado", e o registro do erro com seu identificador. Esta feature reaproveita esse
trabalho e cobre o que falta: 404, sessão expirada, falha na raiz, e o logout automático.

Issue de origem: koller-nexus/app-kottagroups#12. Relacionada: #11 (spec 015).

Fora de escopo: "Continuar logado" (renovar a sessão sem entrar de novo) depende de
koller-nexus/api-kottagroups#159 e fica para depois.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A sessão vence e a pessoa é deslogada na hora, com aviso (Priority: P1)

Quando a sessão vence, a pessoa é levada para `/entrar` com o aviso "Sua sessão expirou. Entre de
novo para continuar." e, depois de entrar, volta para a página onde estava. Isso vale tanto para
quem navega depois do vencimento quanto para quem deixou a aba aberta e parada, inclusive no
celular que volta do segundo plano.

**Why this priority**: é o principal buraco de segurança e de experiência. Hoje a pessoa pode ficar
horas numa tela que parece logada mas não está, e perde o envio de um formulário ao descobrir.

**Independent Test**: entrar, forçar a credencial a vencer (ou esperar o vencimento) e (a) navegar
para qualquer página protegida, (b) deixar a aba aberta parada até o horário, (c) mandar o celular
para segundo plano e voltar depois do horário. Nos três casos a pessoa cai em `/entrar` com o
aviso, e depois de entrar volta para a página de origem.

**Acceptance Scenarios**:

1. **Given** a credencial venceu mas o cookie ainda existe, **When** a pessoa abre qualquer página
   protegida, **Then** vai para `/entrar` com o aviso "Sua sessão expirou", o cookie é apagado e,
   depois de entrar, volta para a página que tentou abrir.
2. **Given** a aba está aberta e parada numa página da área logada, **When** chega o horário de
   vencimento, **Then** sem nenhuma ação da pessoa a aba vai para `/entrar` com o aviso e com o
   retorno para a página onde estava.
3. **Given** o celular foi para segundo plano antes do vencimento, **When** a pessoa volta ao app
   depois do horário, **Then** é deslogada imediatamente como no cenário 2, sem precisar tocar em
   nada.
4. **Given** faltam 2 minutos para o vencimento e a aba está aberta, **When** o horário chega,
   **Then** a pessoa vê o aviso "Sua sessão vai expirar em 2 minutos. Salve o que estiver fazendo."
   antes de ser deslogada.
5. **Given** a pessoa está preenchendo um formulário e a sessão vence ao enviar, **When** o envio é
   recusado, **Then** ela vai para `/entrar` com o aviso de sessão expirada e, depois de entrar,
   volta ao formulário com o aviso "Seu envio não foi salvo" (comportamento atual preservado).
6. **Given** o cookie de sessão sumiu sozinho (por exemplo, o navegador o descartou), **When** a
   pessoa abre uma página protegida, **Then** vê o mesmo aviso de sessão expirada, não um `/entrar`
   mudo.

---

### User Story 2 - Página não encontrada com a cara do Kotta Groups (Priority: P1)

Uma rota que não existe mostra "Página não encontrada" em português, com a identidade do Kotta
Groups. Dentro da área logada, um item que não existe (ou a que a pessoa não tem acesso) mostra a
mesma página dentro do app, com cabeçalho e barra de abas.

**Why this priority**: é a tela de erro mais comum e hoje aparece em inglês, sem marca e sem
caminho de volta. Também é a única tela que uma pessoa sem conta pode ver por acidente.

**Independent Test**: abrir `/qualquer-coisa` sem estar logado e `/grupos/<id-inexistente>`
logado; conferir texto, idioma, logo, ações e, no segundo caso, cabeçalho e barra de abas.

**Acceptance Scenarios**:

1. **Given** a pessoa não está logada, **When** abre uma rota que não existe, **Then** vê a página
   "Página não encontrada" com o logo, sem barra de abas, e as ações "Ir para o início" e "Voltar".
2. **Given** a pessoa está logada, **When** abre um grupo, despesa, lista, nota ou categoria que não
   existe ou a que não tem acesso, **Then** vê, dentro do app (cabeçalho e barra de abas), "Página
   não encontrada" com o texto "Esse item não existe ou você não tem acesso a ele." e as ações "Ir
   para o Painel" e "Voltar".
3. **Given** um item existe mas pertence a outra pessoa, **When** ela tenta abrir, **Then** vê a
   mesma página do cenário 2, sem nenhuma pista de que o item existe.
4. **Given** qualquer página não encontrada, **When** é exibida, **Then** o título da aba é "Página
   não encontrada — Kotta Groups" e buscadores não a indexam.

---

### User Story 3 - Serviço fora do ar não vira um loop de redirecionamentos (Priority: P2)

Se o serviço estiver fora do ar quando a sessão precisa ser verificada ou encerrada, a pessoa vê
"O Kotta Groups está fora do ar" com "Tentar de novo", em vez de ser jogada entre `/sair`,
`/entrar` e `/`.

**Why this priority**: o loop atual termina numa tela de erro genérica que não explica nada e pode
deixar a pessoa presa até o serviço voltar.

**Independent Test**: com o serviço indisponível e uma sessão válida no navegador, acessar `/sair`
(fluxo de sessão expirada) e conferir que a pessoa vê a tela "fora do ar" com "Tentar de novo" e
nenhum redirecionamento circular.

**Acceptance Scenarios**:

1. **Given** o serviço está fora do ar e a pessoa tem um cookie de sessão, **When** o fluxo de
   sessão expirada tenta confirmar a credencial, **Then** a pessoa vê "O Kotta Groups está fora do
   ar" com "Tentar de novo", mantém o cookie e não é mandada para `/entrar`.
2. **Given** a tela "fora do ar" está aberta, **When** o serviço volta e a pessoa toca "Tentar de
   novo", **Then** volta para a página de onde veio, logada.
3. **Given** o serviço está fora do ar, **When** a pessoa sai de propósito pelo botão "Sair da
   conta", **Then** o comportamento atual é mantido (a sessão local é encerrada e ela vai para
   `/entrar` com "Você saiu da conta.").

---

### User Story 4 - Sair em uma aba desloga as outras (Priority: P2)

Quando a pessoa sai da conta, ou a sessão vence, em uma aba do navegador, as outras abas abertas
do Kotta Groups também vão para `/entrar`.

**Why this priority**: evita abas "fantasma" que parecem logadas e falham no primeiro clique. É
simples de entregar depois do logout automático.

**Independent Test**: abrir duas abas logadas; sair em uma; a outra vai para `/entrar` sem
nenhuma ação. Repetir deixando a sessão vencer em vez de sair.

**Acceptance Scenarios**:

1. **Given** duas abas logadas no mesmo navegador, **When** a pessoa toca "Sair da conta" em uma,
   **Then** a outra vai para `/entrar` com "Você saiu da conta." em até 2 segundos.
2. **Given** duas abas logadas, **When** a sessão vence e uma aba executa o logout automático,
   **Then** a outra também vai para `/entrar` com o aviso de sessão expirada e seu próprio
   caminho de retorno.
3. **Given** uma aba está em `/entrar` depois de deslogada por outra, **When** a pessoa entra de
   novo em qualquer aba, **Then** as demais não interferem (nenhum logout em cascata).

---

### User Story 5 - Erros inesperados têm uma única tela, com código para suporte (Priority: P2)

Todo erro que derruba uma tela usa a mesma tela de erro: ícone, título, descrição, ação principal,
ação secundária e um código discreto para suporte. Isso inclui falhas na raiz da aplicação, que
hoje não têm tela nenhuma.

**Why this priority**: a spec 015 já escolhe a mensagem certa (sem conexão / fora do ar / algo deu
errado) e registra o erro. Falta cobrir a raiz da aplicação, mostrar o código em todas as
variantes e unificar o componente para que 404 e sessão expirada usem a mesma base.

**Independent Test**: provocar (a) um erro de exibição numa tela da área logada, (b) um erro numa
tela pública e (c) um erro na raiz da aplicação; conferir que as três mostram a tela padrão com o
código e as ações corretas, e que o registro contém o erro e o código.

**Acceptance Scenarios**:

1. **Given** um erro inesperado em qualquer tela, **When** a tela de erro aparece, **Then** mostra
   "Algo deu errado", as ações "Tentar de novo" e "Ir para o Painel" (ou "Ir para o início" fora da
   área logada) e "Código: <identificador>" em texto discreto.
2. **Given** a raiz da aplicação falha, **When** a pessoa abre qualquer página, **Then** vê a tela
   de erro padrão (não uma página em branco nem a página padrão do framework).
3. **Given** o erro tem um código conhecido do serviço, **When** a tela de erro aparece, **Then** a
   descrição usa a mensagem amigável já existente para esse código, sem textos duplicados.
4. **Given** qualquer tela de erro é exibida, **When** ela aparece, **Then** o registro de erros
   recebe o erro e seu identificador (comportamento da spec 015 preservado em todas as telas).

---

### User Story 6 - Página "Sua sessão expirou" (Priority: P3)

Existe uma página própria para sessão expirada, com "Sua sessão expirou" e a ação "Entrar de
novo", acessível tanto logado quanto deslogado, que leva para `/entrar` preservando o caminho de
retorno e o aviso de envio perdido quando houver.

**Why this priority**: dá um destino estável para fluxos que precisam mostrar o estado "expirou"
antes de pedir login (por exemplo, links antigos ou integrações futuras). Os fluxos principais
(histórias 1 e 4) já levam direto a `/entrar` com aviso.

**Independent Test**: abrir `/sessao-expirada?next=/grupos/1` logado e deslogado; conferir que a
página abre nos dois casos e que "Entrar de novo" leva a `/entrar?next=/grupos/1`.

**Acceptance Scenarios**:

1. **Given** qualquer pessoa, logada ou não, **When** abre `/sessao-expirada`, **Then** vê "Sua
   sessão expirou" com "Entrar de novo", sem ser redirecionada para `/` nem para `/entrar`.
2. **Given** a página foi aberta com um caminho de retorno e o aviso de envio perdido, **When** a
   pessoa toca "Entrar de novo", **Then** vai para `/entrar` com o mesmo caminho de retorno e o
   mesmo aviso.

---

### Edge Cases

- Credencial em formato inválido ou ilegível no cookie: tratada como vencida (logout com aviso),
  nunca como válida.
- Relógio do dispositivo atrasado ou adiantado: a aba pode deslogar um pouco antes ou depois do
  servidor; o serviço continua sendo a autoridade e qualquer chamada recusada mantém o fluxo
  atual de sessão expirada.
- Sessão com menos de 2 minutos restantes ao abrir a página: o aviso de "vai expirar" aparece na
  hora, sem esperar.
- Vencimento enquanto a aba está sem conexão: ao reconectar ou voltar ao foco, a aba desloga; se a
  pessoa tentar algo antes, vê "Sem conexão" com "Tentar de novo".
- Várias abas em páginas diferentes: cada uma volta para o seu próprio caminho depois de entrar
  de novo.
- URL que não corresponde a nenhuma rota, mesmo sob um prefixo da área logada (por exemplo
  `/grupos/abc/xyz`): mostra a página pública de não encontrada, sem abas, com "Ir para o Painel"
  quando há sessão. Só o que a área logada reconhece como item (grupo, despesa, lista, nota,
  categoria) ganha a versão com cabeçalho e abas.
- Página não encontrada aberta por uma pessoa logada numa rota pública: a página pública basta;
  a ação primária leva ao Painel quando há sessão.
- "Voltar" quando não há histórico (link direto): leva ao início ou ao Painel.
- Falha na raiz da aplicação enquanto a pessoa está deslogada: a tela de erro oferece "Tentar de
  novo" e "Ir para o início", nunca uma ação que exija sessão.

## Requirements *(mandatory)*

### Functional Requirements

**Sessão expirada e logout automático**

- **FR-001**: Quando a credencial de acesso tiver vencido, mesmo com o cookie de sessão ainda
  presente, qualquer acesso a página protegida MUST apagar o cookie e levar a pessoa a `/entrar`
  com o aviso "Sua sessão expirou. Entre de novo para continuar." e o caminho de retorno.
- **FR-002**: A verificação de vencimento do lado do app MUST considerar uma folga de cerca de 30
  segundos antes do horário oficial, e MUST tratar credencial ilegível ou malformada como vencida.
  O serviço continua sendo a única autoridade sobre a validade da credencial.
- **FR-003**: O cookie de sessão MUST vencer no mesmo instante que a credencial, para que os dois
  nunca fiquem desalinhados.
- **FR-004**: Com uma página da área logada aberta, o app MUST deslogar automaticamente no horário
  de vencimento, levando a pessoa a `/entrar` com o aviso de sessão expirada e o retorno para a
  página onde estava, sem nenhuma ação dela.
- **FR-005**: Ao voltar ao foco ou do segundo plano, o app MUST reverificar o vencimento e deslogar
  imediatamente se o horário já passou.
- **FR-006**: Dois minutos antes do vencimento, o app MUST mostrar o aviso "Sua sessão vai expirar
  em 2 minutos. Salve o que estiver fazendo." Se restar menos de 2 minutos ao abrir a página, o
  aviso MUST aparecer na hora.
- **FR-007**: O horário de vencimento MUST ser informado à página pelo servidor sem expor a
  credencial ao navegador.
- **FR-008**: Sair da conta ou ser deslogado por vencimento em uma aba MUST levar as demais abas
  abertas do mesmo navegador para `/entrar` com o aviso correspondente, cada uma com seu próprio
  caminho de retorno.
- **FR-009**: Envios recusados por sessão expirada MUST continuar levando a `/entrar` com o aviso
  de sessão expirada e, após entrar, ao formulário com o aviso "Seu envio não foi salvo."

**Serviço fora do ar**

- **FR-010**: Quando o serviço não puder confirmar a credencial durante o fluxo de sessão expirada,
  o app MUST NOT apagar o cookie nem levar a pessoa a `/entrar`; MUST mostrar "O Kotta Groups está
  fora do ar" com "Tentar de novo" que volta à página de origem.
- **FR-011**: Sair de propósito (botão "Sair da conta") MUST continuar funcionando com o serviço
  fora do ar, encerrando a sessão local.

**Página não encontrada**

- **FR-012**: Rotas inexistentes fora da área logada MUST mostrar "Página não encontrada" com o
  logo do Kotta Groups, sem barra de abas, e as ações "Ir para o início" e "Voltar".
- **FR-013**: Itens inexistentes ou sem acesso dentro da área logada (grupo, despesa, lista, nota,
  categoria) MUST mostrar "Página não encontrada" dentro do app (cabeçalho e barra de abas) com o
  texto "Esse item não existe ou você não tem acesso a ele." e as ações "Ir para o Painel" e
  "Voltar". Uma URL que não corresponde a nenhuma rota, mesmo sob um prefixo da área logada, MUST
  mostrar a página pública de FR-012; quando há sessão, a ação primária MUST se chamar "Ir para o
  Painel".
- **FR-014**: Itens a que a pessoa não tem acesso MUST continuar sendo apresentados como não
  encontrados, sem revelar se existem.
- **FR-015**: Páginas não encontradas MUST ter o título "Página não encontrada — Kotta Groups" e
  MUST pedir aos buscadores que não as indexem.

**Tela de erro padrão**

- **FR-016**: MUST existir uma única tela de erro base com ícone, título, descrição, ação primária,
  ação secundária opcional e código discreto ("Código: <identificador>"), usada por todas as
  variantes abaixo e em todos os lugares que hoje usam a tela de erro geral.
- **FR-017**: As variantes e seus textos MUST ser:

  | Variante | Quando | Título | Ações |
  |---|---|---|---|
  | Não encontrada | rota ou item inexistente | "Página não encontrada" | Ir para o Painel/início · Voltar |
  | Sessão expirada | credencial recusada ou vencida | "Sua sessão expirou" | Entrar de novo |
  | Sem conexão | navegador sem internet ou falha de rede | "Sem conexão" | Tentar de novo |
  | Fora do ar | serviço indisponível ou bloqueado | "O Kotta Groups está fora do ar" | Tentar de novo |
  | Inesperado | qualquer outro erro | "Algo deu errado" | Tentar de novo · Ir para o Painel/início |

- **FR-018**: A escolha da variante MUST usar o código ou status do erro quando disponível e cair
  em "Inesperado" nos demais casos; as descrições MUST reutilizar as mensagens amigáveis já
  existentes para códigos conhecidos, sem duplicar textos.
- **FR-019**: Falhas na raiz da aplicação MUST mostrar a tela de erro padrão com "Tentar de novo"
  e "Ir para o início".
- **FR-020**: Toda tela de erro MUST registrar o erro e seu identificador (comportamento da spec
  015 estendido a todas as telas).
- **FR-021**: MUST existir a página `/sessao-expirada`, acessível logado ou não, com a variante
  "Sessão expirada"; "Entrar de novo" MUST levar a `/entrar` preservando o caminho de retorno e o
  aviso de envio perdido quando houver.

**Qualidade**

- **FR-022**: MUST existir testes automatizados para: leitura do horário de vencimento da
  credencial (malformada = vencida), escolha da variante por código/status, e o destino do fluxo
  de sessão expirada com o novo comportamento de serviço fora do ar.
- **FR-023**: Todas as telas desta feature MUST funcionar em 375px de largura e no desktop, com
  título principal como `h1`, foco visível nas ações e contraste legível.

### Key Entities

- **Sessão**: a credencial de acesso guardada no cookie, com um horário de vencimento. É a única
  coisa que decide se a pessoa está logada. Atributos relevantes: horário de vencimento, caminho
  de retorno após entrar de novo.
- **Estado de erro**: o que a tela de erro mostra. Atributos: variante (não encontrada, sessão
  expirada, sem conexão, fora do ar, inesperado), título, descrição, ação primária, ação
  secundária, código para suporte.
- **Aviso de login**: a mensagem mostrada em `/entrar` conforme o motivo (saiu, expirada, envio).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos acessos a páginas protegidas com credencial vencida terminam em `/entrar`
  com o aviso "Sua sessão expirou" e sem cookie de sessão.
- **SC-002**: Com a aba aberta e parada, a pessoa é deslogada em até 60 segundos após o horário de
  vencimento, e em até 5 segundos após voltar do segundo plano depois do horário.
- **SC-003**: Depois de entrar de novo, 100% das pessoas voltam à página em que estavam.
- **SC-004**: Sair em uma aba leva as outras abas para `/entrar` em até 2 segundos.
- **SC-005**: Com o serviço fora do ar, nenhum fluxo de sessão faz mais de um redirecionamento
  antes de mostrar uma tela com "Tentar de novo".
- **SC-006**: `/qualquer-coisa` e `/grupos/<id-inexistente>` mostram páginas em português com a
  identidade do Kotta Groups; nenhuma página padrão do framework é exibida em produção.
- **SC-007**: 100% dos erros que chegam a uma tela de erro ficam registrados com seu identificador,
  e o identificador aparece na tela para suporte.
- **SC-008**: Os testes automatizados da feature passam na suíte do projeto.

## Assumptions

- A duração da sessão continua sendo definida pelo serviço (hoje 24 horas); o app apenas lê o
  horário de vencimento, não o altera.
- Não há renovação de sessão ("Continuar logado") nesta entrega; o aviso de 2 minutos só pede para
  a pessoa salvar o que está fazendo. Quando o serviço ganhar renovação (api-kottagroups#159), o
  aviso ganha a ação "Continuar".
- Guardar rascunhos de formulários para sobreviver ao logout está fora de escopo; o aviso "Seu
  envio não foi salvo" já existente é suficiente nesta entrega.
- A folga de ~30 segundos cobre pequenas diferenças de relógio entre dispositivo e servidor; o
  serviço continua recusando qualquer credencial vencida, então uma diferença maior apenas cai no
  fluxo atual.
- A decisão de usar o mecanismo nativo de "não autorizado" do framework em vez de redirecionar
  fica para o plano; o comportamento visível é o descrito aqui em qualquer caso.
- "Ir para o início" leva a `/` (que já redireciona ao Painel quando há sessão).
- O registro de erros do lado do cliente continua sendo o console do navegador ligado ao
  identificador do servidor; integrar uma ferramenta de monitoramento externa só se já estiver
  configurada no projeto.
- Buscadores podem ver a página pública de não encontrada; as demais páginas desta feature estão
  atrás de login ou são de passagem.
