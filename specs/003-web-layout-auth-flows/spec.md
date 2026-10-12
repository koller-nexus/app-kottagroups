# Feature Specification: Layout web e fluxos de entrar e sair

**Feature Branch**: `003-web-layout-auth-flows`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "use as skills em .agents/skills de frontend e ui-ux-pro-max, as paginas não estão com spaces corretos para versão web. copiamos do mobile e não ficou bacana, revise também os fluxos das paginas, principalmente login e logout"

## Contexto

As telas da web foram portadas do app mobile e herdaram medidas pensadas para um celular. Num
levantamento das páginas atuais:

- Cada página escolhe a própria largura de conteúdo (sete larguras diferentes entre as páginas
  logadas), então o conteúdo "pula" de largura ao navegar.
- O Painel, a tela mais usada, é uma coluna estreita de celular no meio de uma área de desktop
  vazia.
- Espaços entre título, seções e listas variam de página para página.
- "Sair da conta" só existe no fim da página Perfil. No desktop não há como sair a partir da
  barra lateral.
- Quando a sessão expira, a pessoa entra de novo, mas cai no Painel em vez de voltar à página
  onde estava.
- As telas abertas por links de e-mail (confirmação e redefinição de senha) repetem a moldura das
  telas de acesso com um cabeçalho diferente (sem o ícone da marca).
- Abrir um endereço de "sair" a partir de qualquer site encerra a sessão sem ação da pessoa.

O sistema visual (cores, tipografia, raios, escala de espaços 4/8/12/16/20/24/32/48) continua o
mesmo de `DESIGN.md`. Esta feature muda **onde e quanto espaço** cada coisa ocupa na web e
**como a pessoa entra, sai e volta**, não a identidade visual.

## Clarifications

### Session 2026-10-12

- Q: No desktop, o Painel deve virar duas colunas ou continuar numa coluna só, mais larga? → A: Duas colunas no desktop: saldo e gastos do mês à esquerda; últimas quitações e grupos à direita. No celular continua uma coluna na ordem atual.
- Q: No celular, onde a pessoa deve encontrar "Sair"? → A: Na aba Perfil, com "Sair" visível sem rolar, logo abaixo do resumo da conta.
- Q: Se a sessão expirar no envio de um formulário, o que foi digitado deve ser recuperado depois de entrar? → A: Não; a pessoa volta ao formulário vazio, com aviso de que a sessão expirou e o envio não foi salvo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sair da conta de qualquer lugar (Priority: P1)

Como pessoa logada, quero encontrar "Sair" rapidamente em qualquer tela, no computador ou no
celular, e ter certeza de que saí, para proteger minhas contas e grupos num computador
compartilhado.

**Why this priority**: Sair é um requisito de segurança. Hoje está escondido no fim de uma única
página e não confirma que a sessão terminou.

**Independent Test**: Logado, abrir qualquer página interna, sair, e tentar voltar a uma página
interna pelo botão voltar e pelo recarregar.

**Acceptance Scenarios**:

1. **Given** a pessoa está em qualquer página logada no desktop, **When** ela procura sair,
   **Then** encontra "Sair" na área da conta da barra lateral e conclui a saída em no máximo 2
   interações.
2. **Given** a pessoa está em qualquer página logada no celular, **When** ela procura sair,
   **Then** toca em Perfil na navegação inferior e encontra "Sair" logo abaixo do resumo da
   conta, sem rolar.
3. **Given** a pessoa acionou "Sair", **When** a saída está em andamento, **Then** o controle
   mostra que está saindo e não pode ser acionado de novo.
4. **Given** a pessoa saiu, **When** a tela de entrar abre, **Then** ela vê o aviso "Você saiu da
   conta." e o campo de e-mail vazio.
5. **Given** a pessoa saiu, **When** ela usa o voltar do navegador ou recarrega uma página
   interna, **Then** é levada à tela de entrar e nenhum dado da conta aparece.
6. **Given** a pessoa está logada, **When** ela abre um link de outro site que aponta para o
   endereço de saída, **Then** a sessão continua ativa.

---

### User Story 2 - Entrar e voltar para onde estava (Priority: P1)

Como pessoa que abriu um link interno ou teve a sessão expirada, quero entrar e cair exatamente
na página que eu queria, para não precisar navegar de novo.

**Why this priority**: Entrar é a porta de todo uso logado. Perder o destino após a sessão
expirar é o atrito mais frequente.

**Independent Test**: Sem sessão, abrir o endereço de um grupo, entrar e verificar o destino;
repetir com uma sessão expirada no meio do uso.

**Acceptance Scenarios**:

1. **Given** a pessoa não tem sessão, **When** abre uma página interna, **Then** vai para a tela
   de entrar e, depois de entrar, volta para aquela página.
2. **Given** a sessão expirou enquanto a pessoa usava uma página interna, **When** ela é levada a
   entrar, **Then** vê "Sua sessão expirou. Entre de novo para continuar." e, depois de entrar,
   volta para a mesma página.
3. **Given** a pessoa erra a senha, **When** envia o formulário, **Then** a mensagem de erro
   aparece junto ao formulário, é anunciada por leitores de tela, o e-mail digitado permanece e o
   foco vai para o primeiro campo a corrigir.
4. **Given** a pessoa usa um gerenciador de senhas ou cola a senha, **When** entra, **Then** o
   preenchimento automático e o colar funcionam.
5. **Given** a conta ainda não confirmou o e-mail, **When** a pessoa entra, **Then** vai para
   "Confirme seu e-mail" e consegue trocar de conta dali.
6. **Given** a pessoa já está logada, **When** abre entrar, cadastrar ou esqueci a senha,
   **Then** vai para o Painel.
7. **Given** o destino pedido aponta para outro site, **When** a pessoa entra, **Then** ela vai
   para o Painel.

---

### User Story 3 - Páginas com espaço de web (Priority: P2)

Como pessoa usando o Kotta Groups no computador, quero que as páginas usem a tela de forma
organizada e consistente, para ler saldos e listas sem sensação de "app de celular esticado".

**Why this priority**: É o pedido central de qualidade visual. Depende menos de segurança que as
histórias 1 e 2, mas afeta todas as páginas.

**Independent Test**: Navegar por todas as páginas logadas a 1440 px e a 375 px e conferir
largura de conteúdo, margens e espaços contra as regras desta spec.

**Acceptance Scenarios**:

1. **Given** a pessoa navega entre páginas do mesmo tipo no desktop, **When** troca de página,
   **Then** a borda esquerda do conteúdo e a largura do conteúdo não mudam.
2. **Given** o Painel no desktop (≥ 1024 px), **When** a página abre, **Then** saldo e gastos ficam na
   coluna esquerda e quitações e grupos na coluna direita (FR-012).
3. **Given** um formulário (novo grupo, nova despesa, perfil, categoria), **When** aberto no
   desktop, **Then** os campos ficam numa coluna de leitura confortável, alinhada à mesma borda
   esquerda do título da página.
4. **Given** qualquer página no celular, **When** a pessoa rola até o fim, **Then** a última ação
   ou item fica totalmente visível acima da barra de navegação inferior.

---

### User Story 4 - Telas de acesso consistentes (Priority: P3)

Como pessoa que entra, se cadastra, recupera a senha ou abre um link de e-mail, quero que todas
essas telas pareçam a mesma porta de entrada, para confiar que estou no Kotta Groups.

**Why this priority**: Melhora confiança e acabamento; não bloqueia uso.

**Independent Test**: Abrir as seis telas de acesso e comparar moldura, marca, largura e espaços.

**Acceptance Scenarios**:

1. **Given** as telas entrar, cadastrar, esqueci a senha, confirme seu e-mail, link de
   confirmação e link de redefinição, **When** abertas, **Then** todas têm a mesma moldura, a
   mesma marca (ícone e nome) com link para o início, e a mesma largura.
2. **Given** a página inicial sem login, **When** aberta no desktop, **Then** segue as mesmas
   margens das páginas web, mantendo os selos das lojas como definidos em `AGENTS.md`.

---

### Edge Cases

- Nomes longos de pessoa, grupo ou e-mail: truncam com reticências sem empurrar o layout nem
  criar rolagem horizontal.
- Pessoa sem grupos: o Painel e "Grupos" mostram o estado vazio com a ação "Criar grupo",
  respeitando as mesmas larguras.
- Muitos grupos na barra lateral: a lista rola dentro da barra e a área da conta com "Sair"
  continua visível.
- Zoom de 200% ou largura de 320 px: o conteúdo reflui para uma coluna, sem rolagem horizontal e
  sem texto cortado.
- Falha de rede ao sair: a sessão local é encerrada mesmo assim e a pessoa vai para entrar.
- Sessão encerrada em outra aba: na próxima navegação desta aba, a pessoa vai para entrar.
- Sessão expira durante o envio de um formulário: nada é salvo; a pessoa vai para entrar com o
  aviso de sessão expirada e, depois de entrar, volta à página do formulário vazio, com o aviso "A
  sessão expirou e o envio não foi salvo. Preencha de novo." O conteúdo digitado não é recuperado.
- Destino de retorno inválido ou externo: ignorado; a pessoa vai para o Painel.
- Pessoa com e-mail não confirmado abre uma página interna: vai para "Confirme seu e-mail".

## Requirements *(mandatory)*

### Functional Requirements

**Sair**

- **FR-001**: Todas as páginas logadas MUST oferecer "Sair" em no máximo 2 interações, no
  desktop (área da conta na barra lateral) e no celular (aba Perfil da navegação inferior, com
  "Sair" logo abaixo do resumo da conta, visível sem rolar).
- **FR-002**: O controle de sair MUST mostrar estado de andamento e MUST ignorar novos acionamentos
  enquanto a saída acontece.
- **FR-003**: Depois de sair, a pessoa MUST ver a tela de entrar com o aviso "Você saiu da conta."
- **FR-004**: Depois de sair, nenhuma página interna MUST exibir dados da conta, nem por voltar,
  recarregar ou abrir de novo o endereço.
- **FR-005**: Encerrar a sessão de propósito MUST exigir uma ação da pessoa dentro do Kotta Groups;
  um link ou recurso vindo de outro site MUST NOT encerrar a sessão.
- **FR-006**: Ao sair, a sessão MUST ser encerrada também no serviço do Kotta Groups quando o
  serviço oferecer essa operação; se a chamada falhar, a sessão local MUST ser encerrada mesmo
  assim.

**Entrar**

- **FR-007**: Sem sessão, abrir uma página interna MUST levar à tela de entrar e, após entrar, de
  volta à página pedida (incluindo filtros e abas do endereço).
- **FR-008**: Quando a sessão expira, a pessoa MUST ver o aviso de sessão expirada e, após entrar,
  MUST voltar à página onde estava. Se a expiração interrompeu um envio de formulário, a página
  MUST avisar que o envio não foi salvo; o conteúdo digitado não é recuperado.
- **FR-009**: Destinos de retorno MUST ser apenas páginas do próprio Kotta Groups; qualquer outro
  valor MUST levar ao Painel.
- **FR-010**: Erros de entrar MUST aparecer junto ao formulário, MUST ser anunciados por leitores de
  tela, MUST manter o e-mail digitado e MUST mover o foco para o campo a corrigir.
- **FR-011**: Os campos de e-mail e senha MUST aceitar preenchimento automático de gerenciadores de
  senha e colar.

**Layout web**

- **FR-012**: No desktop (≥ 1024 px), o Painel MUST ocupar a largura "visão" em duas colunas: à
  esquerda o campo de saldo e "Gastos dos grupos"; à direita "Últimas quitações" e "Seus grupos".
  Abaixo de 1024 px o Painel MUST ser uma coluna única na ordem de `DESIGN.md` (frase de apoio,
  saldo, gastos, quitações, grupos). A página inicial sem login (prévia do Painel) MUST seguir o
  mesmo arranjo.
- **FR-013**: Toda página logada MUST usar exatamente uma de duas larguras de conteúdo:
  **leitura** (formulários, detalhes de despesa e nota, até 720 px) ou **visão** (Painel, listas,
  grupo, notificações, perfil, até 1120 px). Nenhuma página MUST definir largura própria.
- **FR-014**: O conteúdo de todas as páginas logadas MUST começar na mesma borda esquerda dentro
  da área de conteúdo, em qualquer das duas larguras.
- **FR-015**: As margens laterais da página MUST ser 16 px no celular (< 640 px), 32 px no tablet
  (640–1023 px) e 40 px no desktop (≥ 1024 px).
- **FR-016**: Os espaços verticais MUST seguir um ritmo único em todas as páginas: título da página
  até o primeiro bloco 32 px; entre seções 32 px no celular e 48 px no desktop; título de seção até
  seu conteúdo 12 px. Todos os espaços MUST vir da escala 4/8/12/16/20/24/32/48.
- **FR-017**: Todas as páginas logadas MUST usar o mesmo cabeçalho de página (título, descrição
  opcional e ações), com um único tamanho de título por faixa de largura.
- **FR-018**: Nenhuma página MUST ter rolagem horizontal entre 320 px e 1920 px de largura nem com
  zoom de 200%.
- **FR-019**: Linhas de texto corrido MUST ter no máximo cerca de 75 caracteres.
- **FR-020**: No celular, a última ação ou item de qualquer página MUST ficar totalmente visível
  acima da barra de navegação inferior.
- **FR-021**: Alvos de toque MUST ter no mínimo 44×44 px, com pelo menos 8 px entre alvos vizinhos.

**Telas de acesso**

- **FR-022**: As seis telas de acesso (entrar, cadastrar, esqueci a senha, confirme seu e-mail,
  link de confirmação, link de redefinição) MUST compartilhar a mesma moldura, a mesma marca (ícone
  e nome) com link para o início e a mesma largura, inclusive nos estados de carregamento.
- **FR-023**: A página inicial sem login MUST seguir as margens de FR-015 e MUST manter os selos das
  lojas com o texto oficial em duas linhas, lado a lado, sem navegar para as lojas, conforme
  `AGENTS.md`.

**Escopo visual**

- **FR-024**: A feature MUST NOT introduzir cores, fontes ou raios fora de `DESIGN.md`.

### Key Entities

- **Sessão**: o vínculo entre a pessoa e o Kotta Groups neste navegador. Estados: ativa, expirada,
  encerrada pela pessoa.
- **Destino de retorno**: a página interna que a pessoa queria ver antes de precisar entrar.
- **Largura de conteúdo**: leitura ou visão; toda página logada pertence a exatamente uma.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir de 100% das páginas logadas, sair leva no máximo 2 interações, no celular e
  no desktop.
- **SC-002**: Depois de sair, 0 páginas internas mostram dados da conta via voltar, recarregar ou
  endereço direto.
- **SC-003**: Em 100% das rotas internas testadas, entrar após sessão expirada devolve a pessoa à
  página onde estava.
- **SC-004**: 100% das páginas logadas usam uma das duas larguras definidas; nenhuma tem largura
  própria.
- **SC-005**: 0 páginas com rolagem horizontal nas larguras 320, 375, 768, 1024, 1440 e 1920 px.
- **SC-006**: Ao navegar entre páginas do mesmo tipo no desktop, a borda esquerda do conteúdo
  varia 0 px.
- **SC-007**: Uma pessoa com gerenciador de senhas entra em menos de 15 segundos a partir da tela de
  entrar.
- **SC-008**: Em revisão lado a lado, as seis telas de acesso são identificadas como a mesma moldura
  por 5 de 5 avaliadores.
- **SC-009**: A 1440×900 px, o saldo e o primeiro item de "Seus grupos" do Painel aparecem sem
  rolar.

## Assumptions

- O sistema visual de `DESIGN.md` (cores, tipografia, raios, escala de espaços) não muda; só o uso
  do espaço na web. A seção "Painel" de `DESIGN.md` ganha a nota do arranjo em duas colunas no
  desktop (FR-012); a ordem no celular continua a mesma.
- Breakpoints: celular < 640 px, tablet 640–1023 px, desktop ≥ 1024 px (a barra lateral aparece a
  partir de 1024 px, como hoje).
- Sair não pede confirmação em diálogo: a ação é reversível entrando de novo, e o aviso "Você saiu
  da conta." confirma o resultado.
- Se o serviço do Kotta Groups não oferecer encerramento de sessão no servidor, sair encerra apenas
  a sessão deste navegador (FR-006).
- Login social, passkeys, "lembrar de mim" e mostrar/ocultar senha estão fora de escopo.
- Conteúdo, textos e regras de negócio das páginas não mudam, exceto os avisos de sair e de sessão
  expirada.
- As skills `frontend-design` e `ui-ux-pro-max` em `.agents/skills/` guiam a revisão visual na
  implementação; a orientação de acessibilidade usada aqui (refluxo de texto, sem rolagem
  horizontal, autenticação acessível, alvos de toque) veio da base do ui-ux-pro-max.
