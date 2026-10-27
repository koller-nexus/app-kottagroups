# Feature Specification: Pedir a senha atual para trocar a chave Pix no perfil

**Feature Branch**: `feature/027-pix-key-password`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/82"

## Contexto

Parte do front de koller-nexus/api-kottagroups#251. Origem: re-auditoria run-2 (#63), nota
"Confirmação extra para trocar chave Pix".

**Hoje:** o formulário "Seus dados" em `/perfil` envia o nome e a chave Pix juntos a cada
salvamento, mesmo quando só o nome mudou. Não há campo de senha. A chave Pix vira o código de
cobrança dos acertos do grupo: quem paga confia na chave mostrada.

**Do lado da API (api#251, entregue na PR api#254):** definir, trocar ou apagar a chave Pix passa a
exigir a senha atual da conta. Sem senha, a API recusa com "senha atual obrigatória"; com a senha
errada, recusa com "senha atual incorreta" (nunca como sessão expirada). Mandar a mesma chave já
salva, em qualquer formato, não pede senha. Há um limite de 5 tentativas de senha por conta a cada
15 minutos, com o tempo de espera informado. Uma recusa não salva nada, nem o nome. A API avisa o
dono da conta por e-mail a cada troca aceita.

**Ordem de entrega:** a API já está no ar. Até esta mudança chegar, trocar a chave pelo app falha
com um erro genérico; editar só o nome continua funcionando.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trocar a chave Pix confirmando a senha (Priority: P1)

A pessoa abre o perfil e digita uma chave Pix diferente da salva. Logo abaixo aparece o campo
"Senha atual". Ela digita a senha, salva, e vê "Alterações salvas." com a chave nova no resumo da
conta.

**Why this priority**: é o objetivo da issue. Sem isso, ninguém consegue mais trocar a chave Pix
pelo app web depois que a API passou a exigir a senha.

**Independent Test**: no `/perfil`, trocar a chave, informar a senha correta e salvar; a chave
nova aparece no resumo da conta.

**Acceptance Scenarios**:

1. **Given** a pessoa no perfil com uma chave salva, **When** ela altera o texto da chave,
   **Then** o campo "Senha atual" aparece, com rótulo visível, antes do botão de salvar.
2. **Given** a chave alterada e a senha correta, **When** ela salva, **Then** a troca é aceita, a
   mensagem "Alterações salvas." aparece e o resumo mostra a chave nova.
3. **Given** uma chave salva, **When** a pessoa apaga a chave, **Then** o campo "Senha atual"
   também aparece, e apagar só é aceito com a senha correta.
4. **Given** uma conta sem chave, **When** a pessoa cadastra a primeira chave, **Then** o campo
   "Senha atual" também é pedido.
5. **Given** a troca aceita, **When** o formulário volta ao estado salvo, **Then** o campo de senha
   fica vazio e some até a próxima mudança de chave.

---

### User Story 2 - Editar só o nome continua sem senha (Priority: P1)

A pessoa muda apenas o nome e salva. Nenhum campo de senha aparece e o nome novo é salvo como hoje.

**Why this priority**: editar o nome é o uso mais comum do formulário e não pode ficar mais difícil
por causa da proteção da chave. Se o app mandar a chave sem necessidade, a API pede senha para uma
troca que a pessoa não fez.

**Independent Test**: no `/perfil`, mudar só o nome e salvar sem senha; o nome novo aparece no
shell e no resumo.

**Acceptance Scenarios**:

1. **Given** a pessoa no perfil, **When** ela muda só o nome e salva, **Then** nenhum campo de
   senha aparece e o nome é salvo.
2. **Given** a pessoa mudou a chave e depois voltou ao valor salvo, **When** ela salva, **Then** o
   campo de senha some e o salvamento não pede senha.
3. **Given** a pessoa mudou só o nome, **When** o app envia o salvamento, **Then** a chave Pix não
   vai junto.

---

### User Story 3 - Erro de senha mostrado no campo, sem perder o que foi digitado (Priority: P1)

A pessoa troca a chave e salva sem senha, ou com a senha errada. O erro aparece ao lado do campo
"Senha atual", o nome e a chave digitados continuam no formulário, e ela só precisa corrigir a
senha.

**Why this priority**: sem o erro no lugar certo, a pessoa não entende por que a troca falhou; se o
formulário apagar o que ela digitou, ela desiste.

**Independent Test**: no `/perfil`, trocar a chave e salvar sem senha; o erro aparece no campo de
senha e a chave digitada continua lá. Repetir com a senha errada.

**Acceptance Scenarios**:

1. **Given** a chave alterada e a senha vazia, **When** a pessoa salva, **Then** aparece "Digite
   sua senha atual para trocar a chave Pix." junto ao campo de senha, e o nome e a chave digitados
   continuam no formulário.
2. **Given** a chave alterada e a senha errada, **When** a pessoa salva, **Then** aparece "Senha
   incorreta." junto ao campo de senha, o campo de senha volta vazio e o nome e a chave digitados
   continuam no formulário.
3. **Given** um erro de senha, **When** a pessoa vê o resultado, **Then** ela continua logada no
   perfil (não é mandada para a tela de entrar).
4. **Given** um erro de senha, **When** o formulário é exibido de novo, **Then** o foco ou o
   anúncio para leitores de tela chega ao erro do campo de senha.
5. **Given** muitas tentativas erradas seguidas, **When** a API recusa por excesso de tentativas,
   **Then** aparece a mensagem de muitas tentativas com o tempo de espera, e o que foi digitado
   continua no formulário.

---

### Edge Cases

- **Chave igual em outro formato** (ex.: telefone com e sem máscara): o app pode mostrar o campo de
  senha porque o texto mudou; se a pessoa salvar sem senha e a API considerar a chave igual, o
  salvamento é aceito normalmente.
- **Sem JavaScript ou antes de o formulário carregar por completo**: a pessoa troca a chave e
  salva sem ver o campo de senha; a recusa da API faz o formulário voltar com o campo de senha
  visível e o erro "Digite sua senha atual…", sem perder o que foi digitado.
- **Recusa salva nada**: se a pessoa mudou nome e chave e a senha falhou, nem o nome é salvo; o
  formulário mantém os dois valores digitados para ela tentar de novo.
- **Senha nunca volta para a tela**: depois de qualquer resposta, o campo de senha volta vazio; a
  senha não aparece em mensagens, URLs nem no estado devolvido ao navegador.
- **Nome vazio com chave alterada**: o erro de nome vazio aparece como hoje, antes de qualquer
  chamada à API; nenhuma tentativa de senha é gasta.
- **Formato de chave inválido**: a API recusa antes de checar a senha; aparece o erro genérico de
  campos ("Confira os campos e tente de novo.") e nenhuma tentativa de senha é gasta.
- **API indisponível ou limite indisponível**: aparece a mensagem genérica de falha, sem perder o
  que foi digitado.
- **Sessão expirada de verdade**: continua indo para a tela de entrar, como hoje.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O salvamento do perfil MUST enviar a chave Pix só quando o valor digitado for
  diferente da chave salva (incluindo apagar ou cadastrar a primeira chave). Sem mudança na chave,
  só o nome é enviado.
- **FR-002**: Quando a chave digitada for diferente da salva, o formulário MUST mostrar o campo
  "Senha atual", com rótulo visível, ligado aos erros dele, e reconhecido por gerenciadores de
  senha como a senha atual da conta.
- **FR-003**: Quando a chave voltar ao valor salvo, o campo "Senha atual" MUST sumir e a senha
  digitada MUST NOT ser enviada.
- **FR-004**: Ao salvar com a chave alterada, o app MUST enviar a senha atual junto com a chave,
  no formato definido pelo contrato da API (api#251).
- **FR-005**: Quando a API recusar por senha ausente, o formulário MUST mostrar "Digite sua senha
  atual para trocar a chave Pix." junto ao campo de senha, e MUST mostrar esse campo mesmo que ele
  não estivesse visível antes do envio.
- **FR-006**: Quando a API recusar por senha incorreta, o formulário MUST mostrar "Senha
  incorreta." junto ao campo de senha, e a pessoa MUST continuar na sessão.
- **FR-007**: Quando a API recusar por excesso de tentativas, o formulário MUST mostrar a mensagem
  de muitas tentativas já usada no app, com o tempo de espera quando a API informar.
- **FR-008**: Em qualquer recusa, o formulário MUST manter o nome e a chave digitados e MUST
  devolver o campo de senha vazio.
- **FR-009**: A senha MUST NOT aparecer em mensagens, URLs, logs do app nem no estado do formulário
  devolvido ao navegador.
- **FR-010**: Depois de uma troca aceita, o campo de senha MUST ficar vazio e escondido, e o resumo
  da conta MUST mostrar a chave nova.
- **FR-011**: Editar só o nome MUST continuar funcionando sem senha, com o mesmo comportamento de
  hoje.
- **FR-012**: Os testes de ponta a ponta de `/perfil` MUST cobrir: trocar só o nome sem senha;
  trocar a chave sem senha mostra o erro no campo; trocar a chave com senha errada mostra o erro
  no campo; trocar a chave com a senha certa salva.

### Key Entities

- **Chave Pix salva**: a chave que a conta tem hoje; é a referência para decidir se a pessoa está
  trocando a chave.
- **Senha atual**: dado digitado só para confirmar a troca da chave; nunca guardado nem devolvido
  pelo app.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos salvamentos que mudam só o nome são aceitos sem pedir senha.
- **SC-002**: 100% das trocas de chave (definir, trocar, apagar) feitas pelo app pedem a senha
  atual antes de serem aceitas.
- **SC-003**: Em 100% das recusas por senha ausente, errada ou por excesso de tentativas, o nome e
  a chave digitados continuam no formulário e a pessoa continua logada.
- **SC-004**: A pessoa troca a chave Pix, do primeiro toque no campo até "Alterações salvas.", em
  menos de 30 segundos.
- **SC-005**: Nenhuma resposta, mensagem ou URL do app contém a senha digitada.

## Assumptions

- O contrato da API está fechado (api#251, PR api#254): a senha atual vai num campo próprio do
  salvamento do perfil; os erros são "senha atual obrigatória", "senha atual incorreta" (fora de
  sessão expirada) e excesso de tentativas com tempo de espera.
- A comparação com a chave salva é feita pelo texto como ele aparece no formulário; diferenças só
  de formato ficam a cargo da API, que não pede senha nesse caso.
- O e-mail de aviso ao dono da conta é enviado pela API; o app não mostra nada a mais sobre ele.
- Não há segundo fator nem reautenticação por sessão recente; só a senha atual a cada troca.
- Contas sem senha (ex.: entrada só por link) não existem hoje; não há fluxo alternativo para elas.
- Os textos das mensagens podem ser ajustados no plano, mantendo o sentido e o tom do app.
