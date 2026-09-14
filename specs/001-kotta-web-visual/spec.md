# Feature Specification: Kotta Web Visual Landing

**Feature Branch**: `001-kotta-web-visual`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "quero que crie a versão web do ../kotta, mesmo layout. mas só parte visual, sem login, com icones de em breve do app em apple store e play store"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a home com o mesmo layout do Kotta (Priority: P1)

Um visitante abre o site e reconhece o Kotta: marca no topo, frase de apoio, grade de cartões de saldo (seu saldo, você recebe, você deve, grupos), gráfico de gastos do mês passado versus este mês, lista de quitações recentes e lista de grupos com emoji, nome, quantidade de membros e chip de saldo. A composição, hierarquia, cores, tipografia e cantos arredondados batem com a tela inicial pública do aplicativo Kotta existente (dashboard sem sessão).

**Why this priority**: Sem essa tela o produto web não existe. É o único pedaço que precisa estar pronto para demonstrar a marca.

**Independent Test**: Abrir o endereço principal do site e conferir, lado a lado com a home pública do app, que as mesmas seções aparecem na mesma ordem e com a mesma linguagem visual.

**Acceptance Scenarios**:

1. **Given** um visitante sem conta, **When** ele abre o site, **Then** ele vê a home completa do dashboard público (marca, cartões, gastos do mês, quitações, grupos) sem passo intermediário.
2. **Given** a home aberta, **When** ele percorre a página de cima a baixo, **Then** as seções aparecem na mesma ordem da home pública do aplicativo Kotta.
3. **Given** a home aberta em uma janela estreita (telefone) e em uma janela larga (computador), **When** ele compara o conteúdo, **Then** o conteúdo é o mesmo; em tela larga o layout permanece fiel ao app (coluna central no espírito de um aparelho, não um painel administrativo novo).

---

### User Story 2 - Descobrir que o app nas lojas ainda não chegou (Priority: P2)

No lugar dos botões de entrar e cadastrar, o visitante vê os selos reconhecíveis da Apple App Store e da Google Play, cada um marcado como **Em breve**. Ele entende que o aplicativo móvel será publicado nessas lojas, mas ainda não está disponível.

**Why this priority**: É o pedido explícito que diferencia esta versão web da home do app (que hoje convida a autenticar).

**Independent Test**: Olhar o canto superior direito (ou equivalente no topo) e confirmar os dois selos com indicação de “Em breve”, sem formulário de acesso.

**Acceptance Scenarios**:

1. **Given** a home aberta, **When** o visitante olha o topo, **Then** ele vê o selo da App Store e o selo da Play Store, ambos com a indicação **Em breve**.
2. **Given** a home aberta, **When** o visitante procura “Entrar” ou “Cadastrar”, **Then** esses convites de autenticação não aparecem.
3. **Given** o visitante toca ou clica em um selo de loja, **When** a ação é concluída, **Then** ele não é levado a uma página de loja vazia nem a um fluxo de login; permanece no site (selo informativo). Opcionalmente uma dica breve reforça “Em breve”.

---

### User Story 3 - Explorar o visual sem criar sessão (Priority: P3)

O visitante pode olhar números de demonstração, grupos de exemplo e chips de saldo. Nada pede e-mail, senha ou cadastro. Controles que no app exigiriam conta (criar grupo, editar perfil, pagar, autenticar) não disparam fluxos reais: ou não existem nesta versão, ou são só aparência.

**Why this priority**: Garante o recorte “só visual / sem login” depois que a página já existe.

**Independent Test**: Percorrer a página e interagir com cartões e selos; confirmar que nenhum formulário de credencial aparece e que o estado da sessão não muda.

**Acceptance Scenarios**:

1. **Given** qualquer visitante, **When** ele usa o site, **Then** nenhum formulário de e-mail, senha ou cadastro é exibido.
2. **Given** a lista de grupos visível, **When** ele clica em um grupo, **Then** não abre um espaço autenticado (abas Grupos/Perfil, detalhe editável, notificações reais). O cartão permanece informativo.
3. **Given** dois visitantes em aparelhos diferentes, **When** ambos abrem o site, **Then** veem o mesmo conteúdo de demonstração (não há dados pessoais persistidos por visitante).

---

### Edge Cases

- Janela muito estreita: o topo empilha marca e selos sem sobrepor texto; a grade de cartões continua legível (dois por linha ou um por linha, como no app).
- Janela muito larga: o conteúdo não estica em faixa infinita; mantém a proporção da home do app.
- Imagens dos selos das lojas indisponíveis: o visitante ainda lê o nome da loja e “Em breve”.
- Visitante com movimento reduzido ou zoom alto: textos e selos continuam visíveis; nada essencial fica só em cor.
- Clique repetido nos selos: não abre login nem várias abas de loja.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O site MUST apresentar, no endereço principal, uma única experiência visual equivalente à home pública do aplicativo Kotta (dashboard sem sessão).
- **FR-002**: A home MUST incluir, nesta ordem: identificação da marca “Kotta Groups”; frase de apoio sobre dividir gastos; grade de quatro indicadores (saldo, a receber, a pagar, quantidade de grupos); bloco de gastos dos grupos (mês passado e este mês); seção de últimas quitações; seção de grupos.
- **FR-003**: Cores, tipografia, raios, espaçamento e hierarquia MUST seguir o sistema visual do Kotta (verde profundo, fundo claro, cartões brancos, marca em destaque, rótulos em caixa alta, valores em estilo tabular).
- **FR-004**: Textos da interface MUST estar em português do Brasil, alinhados aos rótulos da home do app (por exemplo “SEU SALDO”, “VOCÊ RECEBE”, “VOCÊ DEVE”, “GRUPOS”, “GASTOS DOS GRUPOS”, “ÚLTIMAS QUITAÇÕES”, “SEUS GRUPOS”).
- **FR-005**: O site MUST NOT oferecer login, cadastro, recuperação de senha ou qualquer coleta de credencial.
- **FR-006**: O topo MUST exibir selos da Apple App Store e da Google Play Store com a indicação visível **Em breve** no lugar dos botões Entrar e Cadastrar do app.
- **FR-007**: Os selos das lojas MUST ser informativos: MUST NOT autenticar o visitante e MUST NOT redirecionar para listagens reais das lojas enquanto o app não estiver publicado.
- **FR-008**: Conteúdo numérico e listas MUST ser de demonstração fixa (saldo, grupos, quitações), suficiente para parecer um produto vivo, sem persistir dados do visitante.
- **FR-009**: Telas autenticadas do app (abas Grupos e Perfil, detalhe de grupo, nova despesa, membros, categorias, notificações, edição de perfil) MUST permanecer fora desta entrega.
- **FR-010**: Interações que no app alteram dados MUST NOT alterar dados nesta versão (não criar grupo, não marcar quitação, não sair de uma conta).
- **FR-011**: A página MUST permanecer utilizável em telefone e em computador, preservando o layout do app em vez de inventar uma estrutura nova de painel.

### Key Entities

- **Landing home**: a página pública única; contém marca, indicadores, comparativo mensal, quitações e grupos.
- **Store badge**: selo de loja (Apple ou Google) com estado “Em breve”; não representa um aplicativo publicado.
- **Demo group**: grupo de exemplo (nome, emoji, quantidade de membros, saldo líquido ilustrativo).
- **Demo balance snapshot**: totais ilustrativos de receber, pagar e saldo líquido do visitante fictício.
- **Demo settlement**: linha ilustrativa de quem paga quem e se está pendente ou pago.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em uma revisão lado a lado, um avaliador que conhece o app identifica a home do site como a mesma composição da home pública do Kotta em no máximo 10 segundos (mesmas seções, mesma ordem).
- **SC-002**: 100% dos visitantes alcançam o conteúdo principal (marca + indicadores) sem preencher formulário e em menos de 3 segundos de espera percebida em conexão normal.
- **SC-003**: 100% das sessões de avaliação concluem que não existe caminho de login ou cadastro na primeira tela nem após clicar nos selos e nos cartões.
- **SC-004**: Os dois selos de loja e o texto “Em breve” são reconhecidos por pelo menos 9 em cada 10 avaliadores sem explicação extra.
- **SC-005**: Em telefone (largura típica de 375) e em computador (largura típica de 1280), um avaliador percorre toda a home sem rolagem horizontal obrigatória e sem texto cortado nos cartões principais.
- **SC-006**: Nenhuma ação na home cria conta, grava preferência pessoal ou envia o visitante para uma loja vazia.

## Assumptions

- A referência visual é o aplicativo móvel Kotta já existente, em especial a home pública (dashboard com marca e cartões), não as telas que só existem depois de “entrar”.
- “Mesmo layout” significa a mesma composição e sistema visual dessa home, adaptada a uma página web; não significa recriar todo o aplicativo (abas, modais, formulários).
- “Só parte visual” significa aparência e conteúdo de demonstração, sem backend, sem sessão e sem regras de negócio reais de divisão de gastos.
- “Sem login” substitui Entrar/Cadastrar pelos selos de loja; o estado vazio da home do app que convida a autenticar não se aplica — a home web mostra dados de demonstração preenchidos.
- Os selos usam a aparência habitual das lojas (símbolo e nome da loja) mais o rótulo **Em breve**; não há data de lançamento nesta entrega.
- O público é o mesmo do Kotta (Brasil); moeda exibida é real (R$).
- Acessibilidade mínima: contraste do sistema visual do Kotta e textos alternativos nos selos (“App Store, em breve”, “Google Play, em breve”).
- Esta entrega não publica o app nas lojas nem exige links reais quando as páginas de loja ainda não existem.
