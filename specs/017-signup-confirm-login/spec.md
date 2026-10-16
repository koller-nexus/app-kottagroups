# Feature Specification: Rever fluxo de criar conta, confirmação de e-mail e login

**Feature Branch**: `feature/017-signup-confirm-login`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/13 implement essa issue"

## Contexto

O caminho **criar conta → confirmar e-mail → entrar** funciona no caso feliz, mas tem telas sem
saída, estados quebrados e mensagens que não ajudam:

- Se a conta é criada e o login automático logo depois falha, a pessoa vê um erro. Ao tentar de
  novo, recebe "e-mail já cadastrado" e fica presa.
- Os erros de validação aparecem só no topo, genéricos, e só depois de enviar.
- Em "Confirme seu e-mail", o botão "Já confirmei" volta para a mesma tela sem aviso quando a
  confirmação ainda não aconteceu, e o reenvio pede "espere alguns minutos" quando o limite real é
  de 60 segundos.
- A tela aberta pelo link do e-mail diz "Abra o app Kotta Groups", mas **não existe app nativo
  publicado**: o produto hoje é só a web. Os estados "link expirado", "link incompleto" e
  "link inválido" não oferecem saída, e um link já usado aparece como inválido.
- Quem entra sem ter confirmado o e-mail perde a página para onde ia.
- O cadastro não pede aceite de Termos de Uso e Política de Privacidade, exigido pela LGPD, e essas
  páginas não existem.

Issue de origem: koller-nexus/app-kottagroups#13. Relacionadas: specs 002 e 003, #12 (spec 016),
koller-nexus/api-kottagroups#159 (renovação de sessão).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criar conta pelo celular e chegar logado ao Painel, sem telas sem saída (Priority: P1)

Uma pessoa nova cria a conta, recebe o e-mail de confirmação, toca no link e cai logada no Painel.
Em nenhum ponto do caminho ela fica numa tela sem ação possível, e nenhuma tela manda "abrir o app".

**Why this priority**: é a porta de entrada do produto. Cada tela sem saída é um cadastro perdido.

**Independent Test**: num celular de 375px, criar uma conta nova, abrir o link do e-mail no mesmo
aparelho e verificar que a pessoa chega ao Painel logada, sem passar por mensagens sobre app.

**Acceptance Scenarios**:

1. **Given** uma pessoa sem conta, **When** preenche o cadastro corretamente e envia, **Then** a
   conta é criada, ela entra automaticamente e vai para "Confirme seu e-mail".
2. **Given** a conta foi criada mas o login automático falhou, **When** o cadastro termina,
   **Then** a pessoa vai para `/entrar` com o e-mail já preenchido e a mensagem "Conta criada!
   Entre para continuar", e não vê erro de e-mail já cadastrado.
3. **Given** a pessoa está logada e abre o link de confirmação válido, **When** a confirmação dá
   certo, **Then** vê "E-mail confirmado" com a ação "Continuar", que leva ao Painel já com o
   estado de confirmado atualizado.
4. **Given** a pessoa não está logada (abriu o link em outro aparelho) e o link é válido, **When**
   a confirmação dá certo, **Then** vê "E-mail confirmado" com a ação "Entrar", que leva ao login e
   depois ao Painel.
5. **Given** qualquer tela do fluxo, **When** a pessoa lê os textos, **Then** nenhum deles menciona
   um app nativo.

---

### User Story 2 - Aceitar Termos de Uso e Política de Privacidade no cadastro (Priority: P1)

O cadastro só é concluído com o aceite explícito dos Termos de Uso e da Política de Privacidade.
Os dois documentos podem ser lidos por qualquer pessoa, sem login.

**Why this priority**: exigência legal (LGPD). Sem isso o cadastro não deveria estar aberto.

**Independent Test**: tentar cadastrar sem marcar o aceite (deve ser recusado no campo, sem criar
conta); marcar e cadastrar (deve criar). Abrir `/termos` e `/privacidade` deslogado e logado.

**Acceptance Scenarios**:

1. **Given** o formulário de cadastro, **When** ele é aberto, **Then** a caixa "Li e aceito os
   Termos de Uso e a Política de Privacidade" aparece desmarcada, com links para os dois documentos
   que abrem em nova aba.
2. **Given** a caixa desmarcada, **When** a pessoa envia, **Then** vê um erro junto da caixa e a
   conta não é criada.
3. **Given** a caixa marcada e os demais campos válidos, **When** a pessoa envia, **Then** a conta é
   criada registrando a versão dos Termos e da Política aceitas.
4. **Given** uma pessoa deslogada ou logada, **When** abre `/termos` ou `/privacidade`, **Then** vê o
   documento com índice, data da última atualização e versão, sem ser redirecionada.
5. **Given** as telas de acesso e o Perfil, **When** a pessoa procura os documentos, **Then**
   encontra links para `/termos` e `/privacidade`.

---

### User Story 3 - Confirmação de e-mail que informa o que está acontecendo (Priority: P2)

Na tela "Confirme seu e-mail", a pessoa sabe o que fazer, quanto esperar para reenviar e o que
acontece quando diz que já confirmou. A tela aberta pelo link do e-mail mostra o estado correto
para cada situação do link, sempre com uma ação.

**Why this priority**: é onde a pessoa mais fica presa hoje, mas o caso feliz já funciona.

**Independent Test**: com uma conta não confirmada, tocar "Já confirmei", reenviar duas vezes
seguidas e abrir links válido, expirado, incompleto, adulterado e já usado.

**Acceptance Scenarios**:

1. **Given** a pessoa não confirmou, **When** toca "Já confirmei", **Then** continua na tela com o
   aviso "Ainda não recebemos a confirmação. Abra o link no seu e-mail".
2. **Given** a pessoa já confirmou em outro aparelho, **When** toca "Já confirmei", **Then** segue
   para a página para onde ia (ou o Painel).
3. **Given** a pessoa acabou de reenviar o link, **When** olha o botão de reenvio, **Then** ele fica
   desabilitado com uma contagem regressiva de 60 segundos e volta a funcionar ao final.
4. **Given** a tela "Confirme seu e-mail", **When** a pessoa a lê, **Then** vê a dica de conferir a
   caixa de spam/lixo eletrônico e uma forma de corrigir o e-mail se ele foi digitado errado.
5. **Given** a confirmação acontece em outra aba ou aparelho, **When** a pessoa volta para a aba de
   "Confirme seu e-mail", **Then** a tela percebe a confirmação e avança sozinha.
6. **Given** o link expirou, **When** a pessoa o abre, **Then** vê "Link inválido ou expirado" com
   a ação de pedir um novo link.
7. **Given** o link está incompleto ou é inválido, **When** a pessoa o abre, **Then** vê a mensagem
   correspondente com as ações "Reenviar link" e "Ir para o início".
8. **Given** o link já foi usado ou o e-mail já está confirmado, **When** a pessoa o abre, **Then**
   vê a tela de sucesso, não a de link inválido.

---

### User Story 4 - Entrar sem perder o caminho (Priority: P2)

O login preenche o e-mail quando ele já é conhecido, deixa ver a senha, funciona com o gerenciador
de senhas do celular, explica quanto esperar quando há muitas tentativas e preserva a página de
destino mesmo quando a pessoa precisa confirmar o e-mail antes.

**Why this priority**: o login já funciona; os ajustes reduzem atrito e perda de contexto.

**Independent Test**: abrir `/entrar?email=…&next=/grupos/1` com uma conta não confirmada, entrar,
confirmar o e-mail e verificar que a pessoa termina em `/grupos/1`.

**Acceptance Scenarios**:

1. **Given** um link para o login com e-mail informado, **When** a tela abre, **Then** o campo
   e-mail já vem preenchido.
2. **Given** o campo de senha, **When** a pessoa toca no botão de mostrar, **Then** a senha fica
   visível, e o botão anuncia o estado para leitor de tela.
3. **Given** uma conta não confirmada e uma página de destino, **When** a pessoa entra, **Then** vai
   para "Confirme seu e-mail" e, depois de confirmar, chega à página de destino original.
4. **Given** muitas tentativas de login, **When** o serviço recusa e informa quanto esperar,
   **Then** a mensagem diz esse tempo; se não informar, diz para tentar de novo em instantes.

---

### User Story 5 - Erros por campo, acessíveis, no cadastro e no login (Priority: P3)

Cada campo é validado antes do envio e mostra o erro embaixo dele, anunciado ao leitor de tela.
Erros devolvidos pelo serviço sobre um campo específico (ex.: chave Pix inválida) aparecem no campo
certo, com a mensagem útil. Após enviar com erro, o foco vai para o primeiro campo com problema.

**Why this priority**: melhora a qualidade, mas o fluxo funciona sem isso.

**Independent Test**: enviar o cadastro com e-mail malformado, senha de 5 caracteres, nome vazio e
Pix inválido, usando leitor de tela; verificar mensagens por campo e foco no primeiro erro.

**Acceptance Scenarios**:

1. **Given** campos inválidos, **When** a pessoa envia, **Then** cada campo inválido mostra sua
   mensagem embaixo, é marcado como inválido para tecnologias assistivas e o foco vai para o
   primeiro deles.
2. **Given** o campo de senha no cadastro, **When** a pessoa digita, **Then** vê o requisito de 8 a
   72 caracteres e se ele foi atendido, e pode mostrar/ocultar a senha.
3. **Given** o serviço recusa o cadastro apontando um campo, **When** a resposta chega, **Then** a
   mensagem aparece naquele campo; se não for possível associar a um campo, aparece no topo com o
   texto do serviço.
4. **Given** um envio em andamento, **When** a pessoa olha o botão, **Then** ele está desabilitado
   e mostra um texto de carregamento.

---

### Edge Cases

- Conta criada e login automático falha por rede ou limite de tentativas: vai para `/entrar` com o
  e-mail preenchido e "Conta criada! Entre para continuar" (US1).
- Pessoa tenta cadastrar um e-mail que já tem conta: mensagem no campo e-mail com link para entrar
  e para recuperar a senha.
- Reenvio pedido antes de 60 segundos (ex.: recarregou a página): a contagem mostra o tempo
  restante informado pelo serviço, ou 60 segundos se ele não informar.
- Link de confirmação aberto com sessão de **outra** conta: confirma o e-mail do link e não troca a
  sessão; a ação leva ao Painel da sessão atual.
- `next` apontando para fora do site: ignorado, destino padrão é o Painel.
- Rotas antigas em inglês (`/confirm-email`, `/forget-password`) usadas em e-mails já enviados:
  continuam funcionando, redirecionando para as rotas em português com os mesmos parâmetros.
- Pessoa logada com credencial vencida abre `/entrar` ou `/cadastrar`: tratada pelo fluxo de sessão
  expirada da spec 016, não é mandada ao Painel.
- Serviço fora do ar ao tocar "Já confirmei": mensagem de falha de conexão, sem sair da tela.

## Requirements *(mandatory)*

### Functional Requirements

**Criar conta**

- **FR-001**: Se a criação de conta der certo e o login automático falhar, o sistema MUST levar a
  pessoa para o login com o e-mail preenchido e a mensagem "Conta criada! Entre para continuar".
- **FR-002**: O cadastro MUST validar antes do envio: nome obrigatório, e-mail em formato válido,
  senha entre 8 e 72 caracteres e chave Pix no formato aceito, com mensagem embaixo de cada campo.
- **FR-003**: O campo de senha MUST ter controle de mostrar/ocultar e indicar o requisito de 8 a 72
  caracteres e se foi atendido.
- **FR-004**: Erros de validação devolvidos pelo serviço MUST aparecer no campo correspondente
  quando identificável, preservando a mensagem do serviço; caso contrário, no topo do formulário.
- **FR-005**: O cadastro MUST exigir a caixa de aceite dos Termos de Uso e da Política de
  Privacidade, desmarcada por padrão, com links para os dois documentos abrindo em nova aba.
- **FR-006**: Sem o aceite, o sistema MUST recusar o envio com erro no campo, tanto no navegador
  quanto no servidor, sem chamar o serviço de cadastro.
- **FR-007**: Com o aceite, o sistema MUST enviar ao serviço de cadastro a versão dos Termos e a
  versão da Política aceitas (o serviço registra versões, data/hora, IP e navegador; api-kottagroups
  spec 066).

**Confirmação de e-mail**

- **FR-008**: "Já confirmei" MUST consultar o estado da conta: se confirmada, segue para o destino;
  se não, mostra "Ainda não recebemos a confirmação. Abra o link no seu e-mail" na mesma tela.
- **FR-009**: Após um reenvio (ou recusa por limite), o botão de reenvio MUST ficar desabilitado com
  contagem regressiva visível até completar 60 segundos (ou o tempo informado pelo serviço).
- **FR-010**: A tela "Confirme seu e-mail" MUST mostrar a dica de spam/lixo eletrônico e oferecer
  corrigir o e-mail, levando a sair e cadastrar ou entrar com o e-mail correto.
- **FR-011**: A tela "Confirme seu e-mail" MUST verificar de novo o estado da conta quando a aba
  volta a ficar ativa e avançar sozinha se a confirmação aconteceu.
- **FR-012**: A tela do link de confirmação MUST distinguir os estados: sucesso, já confirmado
  (exibido como sucesso), incompleto, inválido ou expirado, e falha inesperada. Expirado e inválido
  compartilham a tela "Link inválido ou expirado" enquanto o serviço responder igual para os dois;
  quando ele os diferenciar, "Link expirado" ganha tela própria.
- **FR-013**: No sucesso, com sessão ativa, a ação MUST ser "Continuar" para o Painel, com o estado
  de confirmação atualizado; sem sessão, a ação MUST ser "Entrar" com destino no Painel.
- **FR-014**: Os estados expirado, incompleto e inválido MUST oferecer "Reenviar link" (que exige
  login e volta para "Confirme seu e-mail") e "Ir para o início".
- **FR-015**: As rotas do fluxo MUST ser em português; `/confirm-email` e `/forget-password` MUST
  redirecionar para as equivalentes em português preservando os parâmetros.

**Entrar**

- **FR-016**: O login MUST preencher o e-mail recebido no endereço (`email`).
- **FR-017**: O campo de senha do login MUST ter controle de mostrar/ocultar e ser reconhecido pelos
  gerenciadores de senha como senha atual; o do cadastro, como senha nova.
- **FR-018**: Quando o serviço recusar por excesso de tentativas e informar o tempo de espera, a
  mensagem MUST mostrar esse tempo.
- **FR-019**: Quem entra sem e-mail confirmado MUST ir para "Confirme seu e-mail" mantendo o destino
  original, e chegar a ele depois de confirmar. Destinos fora do site MUST ser ignorados.

**Geral**

- **FR-020**: Todos os formulários do fluxo MUST desabilitar o botão e mostrar texto de carregamento
  durante o envio, e mover o foco para o primeiro erro após um envio com falha.
- **FR-021**: Campos com erro MUST ser marcados como inválidos para tecnologias assistivas e ter a
  mensagem associada ao campo.
- **FR-022**: Os códigos de erro do serviço ainda sem mensagem amigável (e-mail não confirmado,
  credencial/link inválido, link expirado, link já usado) MUST ter mensagens em PT-BR.
- **FR-023**: Nenhuma tela do fluxo (cadastro, login, confirmação, recuperação de senha) MUST
  mencionar um app nativo; onde hoje se manda "abrir o app", MUST haver a ação "Entrar" ou link para
  `/esqueci-a-senha`.
- **FR-024**: Cada tela do fluxo MUST ter título da página e título principal coerentes entre si.
- **FR-025**: O armazenamento da sessão após login e cadastro MUST aceitar uma credencial de
  renovação quando o serviço passar a enviá-la, continuando a funcionar com a resposta atual.

**Termos e Privacidade**

- **FR-026**: O sistema MUST oferecer `/termos` e `/privacidade`, acessíveis com ou sem login.
- **FR-027**: Cada documento MUST exibir índice, "Última atualização" e versão (ex.: `2026-10`), e um
  aviso de rascunho enquanto o texto não tiver revisão jurídica.
- **FR-028**: O texto de cada versão MUST ficar versionado junto com o produto, mantendo histórico.
- **FR-029**: A Política de Privacidade MUST cobrir no mínimo: controlador e contato do encarregado;
  dados coletados (nome, e-mail, chave Pix, foto, grupos, despesas, notas fiscais e imagens enviadas,
  dados de uso, IP e registros); finalidades e bases legais; compartilhamento com operadores
  (hospedagem, armazenamento, e-mail transacional, monitoramento de erros, provedores de IA/OCR);
  retenção; direitos do titular e como exercê-los; cookies (sessão estritamente necessária e
  analytics); transferência internacional.
- **FR-030**: As telas de acesso (rodapé) e o Perfil MUST ter links para `/termos` e `/privacidade`.

### Key Entities

- **Documento legal**: Termos de Uso ou Política de Privacidade; tem tipo, versão, data da última
  atualização, status (rascunho/vigente) e texto com seções.
- **Aceite**: registro de que uma pessoa aceitou uma versão de cada documento no cadastro (versões,
  data/hora, IP). Guardado pelo serviço; o modelo prevê comparar com a versão vigente para um
  futuro re-aceite.
- **Estado do link de confirmação**: sucesso, já confirmado, expirado, incompleto ou inválido,
  derivado da resposta do serviço.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa nova completa criar conta → confirmar pelo link → chegar logada ao Painel
  usando só um celular de 375px, sem nenhuma tela sem ação disponível.
- **SC-002**: Em 100% dos casos em que a conta é criada e o login automático falha, a pessoa chega
  ao login com o e-mail preenchido, e nunca vê "e-mail já cadastrado" por causa disso.
- **SC-003**: Cada estado do link de confirmação (sucesso, já confirmado, incompleto, inválido ou
  expirado, falha inesperada) mostra tela com pelo menos uma ação.
- **SC-004**: É impossível criar conta sem o aceite marcado, e `/termos` e `/privacidade` abrem sem
  login.
- **SC-005**: Todos os erros de validação de cadastro e login são anunciados por leitor de tela
  junto ao campo.
- **SC-006**: Uma busca pelos textos do fluxo não encontra nenhuma instrução para abrir um app.
- **SC-007**: A escolha do estado da confirmação (incluindo expirado e já confirmado), o mapeamento
  dos códigos de erro e o redirecionamento pós-cadastro quando o login falha têm testes automatizados
  passando.

## Assumptions

- O produto é só web; não há app nativo publicado.
- O serviço limita o reenvio a 1 a cada 60 segundos e o link de confirmação vale 24 horas.
- Confirmar senha (segundo campo) não é exigido: mostrar/ocultar cobre o risco de erro de digitação.
- A atualização ao voltar para a aba atende a "avançar sozinha"; polling contínuo não é necessário.
- O texto inicial de Termos e Privacidade é um rascunho para revisão jurídica, marcado como tal.
- O aceite é registrado pelo serviço como prova (versões, data/hora, IP, navegador), implementado na
  api-kottagroups spec 066 (versão 0.6.0). A API precisa ser publicada **antes** deste front: versões
  anteriores recusam campos desconhecidos e o cadastro quebraria.
- O serviço hoje responde igual para link expirado, já usado e inválido. "Já confirmado" é detectado
  consultando a conta quando há sessão; distinguir expirado de inválido depende de issue na API.
- A tela de re-aceite quando a versão muda fica fora de escopo; só o modelo de dados a prevê.
- Alinhar a URL do e-mail de confirmação no serviço às rotas em português é issue separada na API;
  os redirects garantem que os links atuais continuem funcionando.
- Redirecionar quem tem credencial vencida em `/entrar`/`/cadastrar` é coberto pela spec 016.
- A cobertura por testes de ponta a ponta no navegador fica para quando a #9 entrar.
