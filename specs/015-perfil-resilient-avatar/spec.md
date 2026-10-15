# Feature Specification: Perfil que sempre abre, com todos os dados da conta e foto

**Feature Branch**: `feature/015-perfil-resilient-avatar`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/11 implement essa issue"

## Contexto

Em produção (12/10/2026, celular), abrir **Perfil** mostrou só a mensagem genérica "Não foi possível
carregar seus dados — verifique sua conexão". Cabeçalho, sino e barra de abas apareceram, mas nada
da conta. Hoje o Perfil busca três coisas ao mesmo tempo (dados da conta, grupos e categorias) e,
se **qualquer uma** falha, a página inteira cai. A mensagem sempre culpa a conexão, mesmo quando o
erro é outro, e nada fica registrado para quem investiga. A suspeita principal é a busca de
categorias, que só existe no Perfil, em despesas e no detalhe do grupo (Painel e Grupos abriram).

Além disso, o Perfil mostra só parte do que a conta já tem: não exibe a foto, a data de entrada,
se o e-mail está confirmado, nem a chave Pix fora do formulário. E não há como trocar a foto, embora
o serviço já aceite o envio.

Issue de origem: koller-nexus/app-kottagroups#11.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Perfil abre mesmo quando uma parte falha (Priority: P1)

A pessoa abre Perfil. Se grupos ou categorias não carregarem, ela ainda vê nome, e-mail e o
formulário "Seus dados", e só a seção que falhou mostra um aviso com "Tentar de novo".

**Why this priority**: é o bug reportado. Sem isso a pessoa não consegue ver nem editar a própria
conta, nem sair dela pelo Perfil.

**Independent Test**: forçar a busca de categorias (e, separado, a de grupos) a falhar e abrir
`/perfil`: dados da conta e formulário aparecem; a seção afetada mostra erro local e "Tentar de
novo".

**Acceptance Scenarios**:

1. **Given** a busca de categorias falha, **When** a pessoa abre Perfil, **Then** vê nome, e-mail,
   formulário "Seus dados" e botão "Sair da conta", e a seção Categorias mostra "Não foi possível
   carregar suas categorias" com "Tentar de novo".
2. **Given** a busca de grupos falha, **When** a pessoa abre Perfil, **Then** o resumo mostra os
   dados da conta sem o contador de grupos, e nada mais é afetado.
3. **Given** a seção Categorias está em erro, **When** a pessoa toca "Tentar de novo" e o serviço
   responde, **Then** a lista de categorias aparece sem recarregar o resto da página.
4. **Given** os dados da conta não carregam, **When** a pessoa abre Perfil, **Then** vê a tela de
   erro da área logada com "Tentar de novo" (sem dados da conta não há o que mostrar).
5. **Given** todos os serviços respondem, **When** a pessoa abre Perfil no celular com o mesmo
   usuário do relato, **Then** a página abre completa.

---

### User Story 2 - Erros explicam o que aconteceu e deixam rastro (Priority: P1)

Quando uma tela da área logada cai no erro geral, a mensagem diz se o problema parece ser de
conexão/serviço indisponível ou um erro inesperado, e o erro fica registrado com seu identificador
para quem investiga.

**Why this priority**: sem registro, o próximo caso fica invisível como este; e a mensagem atual
manda a pessoa checar a conexão quando a conexão pode estar ótima.

**Independent Test**: provocar (a) uma falha de rede/serviço e (b) um erro inesperado de exibição
em uma tela da área logada; conferir as duas mensagens diferentes e que o registro contém o erro e
seu identificador.

**Acceptance Scenarios**:

1. **Given** o serviço não respondeu ou está indisponível, **When** a tela cai no erro geral,
   **Then** a mensagem fala de conexão/serviço e sugere tentar de novo.
2. **Given** ocorreu um erro inesperado que não é de rede, **When** a tela cai no erro geral,
   **Then** a mensagem diz que algo deu errado do nosso lado, sem pedir para verificar a conexão.
3. **Given** qualquer erro chega ao erro geral, **When** ele é exibido, **Then** o registro de
   erros recebe a mensagem e o identificador (digest) do erro.

---

### User Story 3 - Perfil mostra todos os dados da conta (Priority: P2)

No Perfil a pessoa vê, além de nome e e-mail: foto (ou iniciais), e-mail completo em "Seus dados"
(somente leitura), chave Pix no resumo, "Membro desde {mês/ano}" e se o e-mail está confirmado.

**Why this priority**: os dados já chegam do serviço e hoje são descartados; mostrá-los dá
confiança e leva quem não confirmou o e-mail a confirmá-lo.

**Independent Test**: abrir Perfil com uma conta que tenha foto, chave Pix e e-mail confirmado, e
com outra sem foto, sem chave Pix e com e-mail não confirmado; conferir cada campo.

**Acceptance Scenarios**:

1. **Given** a conta tem foto, **When** a pessoa abre Perfil, **Then** a foto aparece redonda no
   resumo e no avatar do cabeçalho.
2. **Given** a conta não tem foto, ou o link da foto expirou/quebrou, **When** a imagem não pode
   ser exibida, **Then** aparecem as iniciais, sem ícone de imagem quebrada.
3. **Given** a conta tem chave Pix, **When** a pessoa abre Perfil, **Then** o resumo mostra
   "Chave Pix: {chave}"; **Given** não tem, **Then** mostra "Nenhuma chave Pix cadastrada" com um
   atalho para o campo de chave Pix do formulário.
4. **Given** a conta foi criada em março de 2026, **When** a pessoa abre Perfil, **Then** o resumo
   mostra "Membro desde março de 2026".
5. **Given** o e-mail está confirmado, **Then** aparece "E-mail confirmado"; **Given** não está,
   **Then** aparece "E-mail não confirmado" com link para a tela de confirmação de e-mail.
6. **Given** um e-mail longo, **When** a pessoa vê "Seus dados" em 375px, **Then** o e-mail aparece
   completo (quebrando linha se preciso), não truncado.

---

### User Story 4 - Trocar a foto de perfil (Priority: P3)

No resumo do Perfil a pessoa toca "Alterar foto" (ou na própria foto, no celular), escolhe uma
imagem da galeria ou câmera, vê a prévia na hora e, quando o envio termina, a nova foto aparece no
Perfil e no cabeçalho, sem recarregar a página.

**Why this priority**: valor real, mas depende da US3 (exibir a foto) e não resolve o bug.

**Independent Test**: com e-mail confirmado, enviar um JPG de 1 MB e conferir a foto nova no Perfil
e no cabeçalho; enviar um GIF e um JPG de 6 MB e conferir as mensagens sem envio ao serviço.

**Acceptance Scenarios**:

1. **Given** a pessoa escolheu um JPG, PNG ou WebP de até 5 MB, **When** confirma a escolha,
   **Then** vê a prévia imediata, o botão fica "Enviando…" e desabilitado, e ao final aparece
   "Foto atualizada." com a foto nova no Perfil e no cabeçalho.
2. **Given** a pessoa escolheu um arquivo de outro tipo ou maior que 5 MB, **When** confirma a
   escolha, **Then** vê "Use uma foto JPG, PNG ou WebP de até 5 MB" e nada é enviado.
3. **Given** o serviço recusa o envio (arquivo grande demais, tipo inválido, sem arquivo, muitas
   tentativas, armazenamento indisponível), **When** a resposta chega, **Then** a prévia é desfeita,
   a foto anterior volta e aparece uma mensagem em português específica para o caso.
4. **Given** o e-mail não está confirmado, **When** a pessoa tenta trocar a foto, **Then** é
   avisada de que precisa confirmar o e-mail, com link para a tela de confirmação.
5. **Given** a pessoa usa leitor de tela ou teclado, **When** chega ao botão, **Then** ele se
   anuncia como "Alterar foto de perfil", tem foco visível, e o andamento/resultado é anunciado.

---

### Edge Cases

- Grupos **e** categorias falham juntos: dados da conta e formulário continuam visíveis; cada seção
  mostra seu próprio erro.
- O serviço de categorias responde em formato inesperado (sem lista): tratado como falha da seção,
  não derruba a página.
- Conta sem nenhuma categoria: a seção mostra estado vazio com o atalho "Gerenciar categorias".
- Link da foto expira com a página aberta: a imagem cai para as iniciais.
- A pessoa escolhe outra foto enquanto um envio está em andamento: o botão está desabilitado; não
  há envios concorrentes.
- A pessoa cancela o seletor de arquivo: nada muda.
- Data de criação ausente ou inválida: a linha "Membro desde" não aparece.
- Erro de envio sem código conhecido: mensagem genérica "Não foi possível atualizar a foto. Tente
  de novo."

## Requirements *(mandatory)*

### Functional Requirements

**Resiliência e erros**

- **FR-001**: O Perfil MUST exibir os dados da conta, o formulário "Seus dados" e "Sair da conta"
  mesmo quando a busca de grupos, de categorias, ou ambas, falharem.
- **FR-002**: Cada seção que depende de grupos ou de categorias MUST mostrar seu próprio estado de
  erro com a ação "Tentar de novo", que recarrega só os dados daquela seção.
- **FR-003**: Quando a busca de grupos falhar, o resumo MUST omitir o contador de grupos em vez de
  mostrar um número errado.
- **FR-004**: Uma resposta de categorias em formato inesperado MUST ser tratada como falha da seção.
- **FR-005**: Se os dados da conta não carregarem, o Perfil MUST mostrar a tela de erro geral da
  área logada.
- **FR-006**: A tela de erro geral da área logada MUST registrar o erro e seu identificador (digest)
  no registro de erros do servidor/navegador.
- **FR-007**: A tela de erro geral MUST distinguir "serviço indisponível/sem conexão" de "erro
  inesperado", com textos diferentes; só o primeiro sugere verificar a conexão.
- **FR-008**: A causa raiz da queda de 12/10/2026 MUST ser investigada nos registros de produção;
  se estiver no serviço (API), MUST ser aberta uma issue no repositório da API com a evidência.

**Dados da conta**

- **FR-009**: O resumo do Perfil MUST mostrar foto (ou iniciais), nome, e-mail, chave Pix (ou
  "Nenhuma chave Pix cadastrada" com atalho para o campo), "Membro desde {mês} de {ano}" e o status
  do e-mail ("E-mail confirmado" / "E-mail não confirmado" com link para a confirmação).
- **FR-010**: "Seus dados" MUST mostrar o e-mail completo, somente leitura, sem truncar.
- **FR-011**: O avatar MUST exibir a foto da conta quando houver uma e cair para as iniciais quando
  não houver ou quando a imagem não carregar; nunca exibir imagem quebrada.
- **FR-012**: O avatar do cabeçalho da área logada MUST exibir a mesma foto do Perfil.
- **FR-013**: O link da foto MUST ser sempre o mais recente recebido do serviço; o cliente MUST NOT
  guardá-lo nem reaproveitá-lo depois (o link expira).

**Trocar foto**

- **FR-014**: O Perfil MUST oferecer "Alterar foto" no resumo; no celular, tocar a foto também abre
  a escolha de arquivo, que deve permitir galeria e câmera.
- **FR-015**: Antes de enviar, o sistema MUST aceitar só JPG, PNG ou WebP de até 5 MB e, fora
  disso, mostrar "Use uma foto JPG, PNG ou WebP de até 5 MB" sem enviar.
- **FR-016**: Durante o envio o sistema MUST mostrar a prévia da foto escolhida e o estado
  "Enviando…", com a ação desabilitada.
- **FR-017**: Ao concluir, o sistema MUST mostrar "Foto atualizada." e atualizar a foto no Perfil e
  no cabeçalho sem recarregar a página.
- **FR-018**: Em falha, o sistema MUST desfazer a prévia, manter a foto anterior e mostrar mensagem
  em português específica para: arquivo grande demais, tipo inválido, nenhum arquivo, muitas
  tentativas, armazenamento indisponível, e-mail não confirmado; e uma genérica para o resto.
- **FR-019**: A ação MUST se anunciar como "Alterar foto de perfil", ter foco visível e anunciar
  andamento e resultado para tecnologias assistivas.

**Qualidade**

- **FR-020**: MUST existir teste automatizado cobrindo o Perfil com a busca de categorias falhando
  (nome, e-mail e formulário continuam visíveis).
- **FR-021**: O layout do Perfil MUST funcionar em 375px de largura e no desktop, sem rolagem
  horizontal.

### Key Entities

- **Conta (usuário logado)**: id, nome, e-mail, chave Pix (opcional), link da foto (opcional,
  temporário), data de criação, e-mail confirmado (sim/não).
- **Foto de perfil**: imagem JPG/PNG/WebP de até 5 MB enviada pela própria pessoa; o serviço devolve
  a conta atualizada com o novo link.
- **Seção do Perfil**: bloco com dados próprios (resumo/grupos, categorias) que carrega, falha e
  tenta de novo de forma independente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Com grupos e/ou categorias indisponíveis, 100% das aberturas do Perfil mostram nome,
  e-mail e o formulário "Seus dados".
- **SC-002**: 100% dos erros que chegam à tela de erro geral da área logada ficam registrados com
  identificador.
- **SC-003**: O Perfil mostra os 6 dados visíveis da conta (foto/iniciais, nome, e-mail, chave Pix,
  membro desde, status do e-mail) para qualquer conta.
- **SC-004**: Trocar a foto com um arquivo válido leva menos de 10 segundos do toque em "Alterar
  foto" até a foto nova no Perfil e no cabeçalho (com conexão móvel comum).
- **SC-005**: Arquivos inválidos ou grandes demais são recusados com mensagem em menos de 1 segundo
  e nunca chegam ao serviço.
- **SC-006**: Nenhuma imagem quebrada aparece no avatar, mesmo com link expirado.
- **SC-007**: O Perfil abre em produção, no celular, para o usuário do relato original.

## Assumptions

- O serviço já oferece tudo o que é preciso: dados da conta com foto, data de criação e status do
  e-mail, e envio de foto (JPG/PNG/WebP, até 5 MB, exige e-mail confirmado, limite de tentativas).
  Nada muda no backend por esta feature, exceto se a investigação (FR-008) achar a causa lá.
- O acesso aos registros de produção (Vercel e API) para a investigação é feito pelo dono do
  projeto; se não houver acesso, a resiliência (US1) já impede a página de cair pela mesma causa.
- "Membro desde" usa o formato de datas já usado no app, em pt-BR.
- O atalho "Nenhuma chave Pix cadastrada" leva ao campo de chave Pix do formulário na mesma página.
- Fora de escopo: remover a foto (o serviço não permite hoje), recortar a foto no cliente e mostrar
  foto de outros membros (as respostas de grupos não trazem foto; o avatar fica pronto para quando
  trouxerem).
