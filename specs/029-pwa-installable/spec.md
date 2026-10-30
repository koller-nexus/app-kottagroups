# Feature Specification: Kotta Groups instalável como app (PWA)

**Feature Branch**: `feature/029-pwa-installable`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/16"

## Contexto

Issue A1 do guarda-chuva #15. Só front: não depende de API nova.

**Hoje:** o Kotta Groups só existe como site no navegador. A pessoa precisa abrir o navegador e
digitar ou buscar o endereço; não há ícone na tela inicial, a janela mostra a barra do navegador e,
sem internet, aparece o erro do próprio navegador.

**O que muda:** o site passa a poder ser instalado no celular ou no computador, com nome, ícone e
cores do Kotta Groups, abrindo em janela própria (sem barra do navegador). Sem internet, a pessoa vê
uma página do Kotta Groups explicando que está offline, em vez do erro do navegador. Um aviso
discreto convida a instalar. A instalação também deixa o app pronto para receber notificações no
futuro (item B13, fora desta spec).

## Clarifications

### Session 2026-10-29

- Decisões tomadas por padrão (sem perguntas): ver seção Assumptions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instalar o Kotta Groups na tela inicial (Priority: P1)

A pessoa abre o site no celular ou no computador e instala o Kotta Groups. O ícone aparece na tela
inicial (ou no menu de apps), com o nome "Kotta Groups". Ao tocar nele, o app abre em janela própria,
sem barra do navegador, com as cores da marca, direto na página inicial.

**Why this priority**: é o núcleo da issue. Sem instalação válida, os demais itens (aviso, offline,
base para notificações) não têm sentido.

**Independent Test**: abrir o site em um navegador compatível, instalar pelo menu do navegador e
conferir nome, ícone, cores e janela própria ao abrir o app instalado.

**Acceptance Scenarios**:

1. **Given** a pessoa abre o site em um navegador compatível, **When** ela escolhe instalar pelo
   navegador, **Then** o navegador oferece a instalação com o nome "Kotta Groups" e o ícone da marca.
2. **Given** o app instalado, **When** a pessoa o abre pelo ícone, **Then** ele abre em janela própria
   (sem barra de endereço), com as cores da marca na barra de status e na tela de abertura, na página
   inicial.
3. **Given** o ícone em telas que recortam ícones em formas diferentes (círculo, quadrado
   arredondado), **When** exibido, **Then** a marca aparece inteira, sem cortes, sobre o fundo claro
   da marca (o logotipo é verde e sumiria em fundo verde).

---

### User Story 2 - Ver uma página de "sem conexão" em vez do erro do navegador (Priority: P2)

Sem internet, a pessoa abre o app (ou recarrega uma página) e vê uma página do Kotta Groups dizendo
que está sem conexão, com um botão para tentar de novo. Quando a conexão volta, tentar de novo leva
de volta ao conteúdo normal.

**Why this priority**: evita a impressão de app quebrado; mas só ajuda quem já abriu o app antes.

**Independent Test**: com o app já visitado, desligar a rede, abrir uma página e conferir a página
offline; religar a rede, tocar em "Tentar de novo" e conferir que a página carrega.

**Acceptance Scenarios**:

1. **Given** a pessoa já abriu o app com internet pelo menos uma vez, **When** ela abre uma página
   sem internet, **Then** vê a página "Sem conexão" do Kotta Groups, no visual da marca.
2. **Given** a página "Sem conexão", **When** a pessoa toca em "Tentar de novo" com a conexão de
   volta, **Then** a página que ela queria é carregada.
3. **Given** a página "Sem conexão", **When** a pessoa toca em "Tentar de novo" ainda sem conexão,
   **Then** continua na página e recebe aviso de que a conexão ainda não voltou (anunciado a leitores
   de tela).
4. **Given** a pessoa autenticada e sem internet, **When** o app tenta mostrar dados da conta
   (notas, grupos, saldos), **Then** nenhum dado de conta antigo é exibido; só a página "Sem
   conexão".

---

### User Story 3 - Receber o convite para instalar, e dispensá-lo (Priority: P3)

Na primeira visita em que a instalação é possível, aparece um aviso discreto convidando a adicionar o
Kotta Groups à tela inicial. No Android/Chrome e em navegadores equivalentes, o aviso tem um botão
"Instalar" que abre a instalação. No iPhone/iPad (Safari), onde não há botão automático, o aviso
mostra a instrução manual (Compartilhar → Adicionar à Tela de Início). A pessoa pode dispensar o
aviso, e ele não volta a aparecer.

**Why this priority**: aumenta a instalação, mas o app já é instalável pelo menu do navegador sem
ele.

**Independent Test**: em navegador compatível, abrir o site sem ter dispensado nem instalado, ver o
aviso, dispensar, recarregar e conferir que não reaparece.

**Acceptance Scenarios**:

1. **Given** um navegador que permite instalar com um botão, e o app ainda não instalado nem
   dispensado, **When** a pessoa abre o site, **Then** vê o aviso com o botão "Instalar".
2. **Given** o aviso, **When** a pessoa toca em "Instalar" e confirma, **Then** o app é instalado e
   o aviso some.
3. **Given** iPhone/iPad no Safari, app não instalado nem dispensado, **When** a pessoa abre o site,
   **Then** vê o aviso com a instrução manual de instalação (sem botão "Instalar").
4. **Given** o aviso, **When** a pessoa toca em "Agora não", **Then** o aviso some e não reaparece
   nas próximas visitas neste aparelho.
5. **Given** o app já aberto como instalado (janela própria), **When** a pessoa usa o app, **Then**
   o aviso não aparece.

---

### User Story 4 - Base para notificações futuras (Priority: P3)

O app instalado mantém uma camada em segundo plano pronta para, numa entrega futura (B13), receber
notificações. Nesta entrega nenhuma notificação é pedida nem enviada.

**Why this priority**: só prepara terreno; sem valor visível agora.

**Independent Test**: conferir que, após a primeira visita, a camada em segundo plano está ativa e
que nenhuma permissão de notificação é solicitada.

**Acceptance Scenarios**:

1. **Given** a primeira visita com internet, **When** a página termina de carregar, **Then** a camada
   em segundo plano é registrada sem mensagem ou pedido de permissão à pessoa.

---

### Edge Cases

- Navegador sem suporte à instalação ou à camada em segundo plano: o site funciona normalmente, sem
  aviso de instalação e sem página offline; nenhum erro visível.
- Aparelho com a conexão intermitente (oscila durante o carregamento): a página offline só aparece
  quando a navegação falha; conteúdo já carregado não é substituído.
- Nova versão do app publicada: o app instalado passa a usar a versão nova na próxima abertura, sem
  a pessoa precisar reinstalar nem limpar dados.
- Armazenamento do navegador bloqueado ou cheio (modo privado): o aviso pode reaparecer a cada visita,
  mas nada quebra.
- Pessoa sai da conta (logout) ou troca de conta no mesmo aparelho: nenhum dado da conta anterior fica
  disponível offline.
- Aviso de instalação em tela de 375px: não cobre ações principais nem o conteúdo essencial; fica
  alcançável por teclado e leitor de tela.
- Pessoa desinstala o app e volta ao site: como dispensar foi lembrado, o aviso só reaparece se ela
  não tinha dispensado; se dispensou, continua oculto (a instalação segue possível pelo menu do
  navegador).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O site MUST declarar-se instalável com nome "Kotta Groups", abrindo em janela própria
  sem barra do navegador, na página inicial, com cor de tema e cor de fundo da marca definidas em
  `DESIGN.md`.
- **FR-002**: O site MUST fornecer ícones de instalação nos tamanhos 192 e 512 px, incluindo versões
  adaptáveis a recortes (maskable) com a marca inteira dentro da área segura.
- **FR-003**: O site MUST oferecer uma página "Sem conexão", no visual da marca, com texto claro em
  português, botão "Tentar de novo" e aviso anunciado a leitores de tela quando a conexão ainda não
  voltou.
- **FR-004**: Sem internet, uma navegação a qualquer página MUST mostrar a página "Sem conexão" em
  vez do erro do navegador, desde que a pessoa já tenha aberto o app com internet antes.
- **FR-005**: O app MUST NOT guardar para uso offline nenhuma resposta da API, nenhuma página que
  dependa de conta autenticada, nem dados de conta. Somente o visual compartilhado do app (arquivos
  estáticos) e a página "Sem conexão" podem ser guardados.
- **FR-006**: O app MUST NOT servir conteúdo de conta desatualizado: com ou sem internet, dados de
  conta só aparecem se vierem do servidor naquele momento.
- **FR-007**: Ao sair da conta ou trocar de conta, nenhum dado da conta anterior MUST ficar acessível
  offline.
- **FR-008**: Em navegadores que oferecem instalação por botão, o app MUST exibir um aviso de
  instalação com o botão "Instalar" que abre a instalação; após instalar, o aviso MUST sumir.
- **FR-009**: No iPhone/iPad (Safari), o aviso MUST mostrar a instrução manual (Compartilhar →
  Adicionar à Tela de Início), sem botão "Instalar".
- **FR-010**: O aviso MUST ser dispensável por "Agora não"; a dispensa MUST ser lembrada neste
  aparelho e o aviso não reaparece enquanto a dispensa valer.
- **FR-011**: O aviso MUST NOT aparecer quando o app já estiver aberto como instalado, quando o
  navegador não suportar instalação, nem em páginas de fluxo sensível (ex.: durante envio de nota ou
  confirmação de pagamento).
- **FR-012**: O aviso e a página "Sem conexão" MUST seguir `DESIGN.md` e `lib/theme.ts` (cores,
  tipografia, raio, espaçamento), funcionar em 375px e no desktop, ter foco visível, rótulos
  acessíveis e estados anunciados via `aria-live` quando mudarem.
- **FR-013**: Nova versão do app MUST substituir a anterior para o app instalado sem ação da pessoa
  além de abrir o app novamente.
- **FR-014**: O app MUST registrar a camada em segundo plano sem pedir permissão nem mostrar mensagem
  à pessoa, e MUST NOT solicitar nem enviar notificações nesta entrega.
- **FR-015**: A lógica decisória (quando mostrar o aviso, qual variante, lembrar dispensa, o que pode
  ser guardado offline) MUST ficar em código isolado e testável sem navegador, com testes
  automatizados cobrindo cada regra acima.

### Key Entities

- **Dispensa do aviso**: registro local, por aparelho, de que a pessoa dispensou o aviso de
  instalação. Atributos: se foi dispensado e quando.
- **Estado de instalação**: se o app está aberto como instalado, se a instalação por botão está
  disponível, ou se é iPhone/iPad (instrução manual). Define qual variante do aviso aparece, se
  alguma.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em um celular Android atual com navegador compatível, a pessoa instala o Kotta Groups
  em até 3 toques a partir do aviso e vê o ícone da marca na tela inicial.
- **SC-002**: O app instalado abre em janela própria, sem barra do navegador, em 100% das aberturas
  nos aparelhos testados (Android, iPhone/iPad, desktop).
- **SC-003**: Com a rede desligada, 100% das navegações (após uma visita prévia com internet) mostram
  a página "Sem conexão" do Kotta Groups, nunca o erro do navegador.
- **SC-004**: 0 respostas da API ou páginas de conta ficam disponíveis offline (verificado após uso
  autenticado seguido de desligar a rede e de sair da conta).
- **SC-005**: Depois que a pessoa dispensa o aviso, ele não reaparece em nenhuma das visitas
  seguintes no mesmo aparelho (enquanto o armazenamento local estiver disponível).
- **SC-006**: A página "Sem conexão" e o aviso de instalação são totalmente operáveis por teclado e
  leitor de tela e sem rolagem horizontal em 375px.
- **SC-007**: O site em navegador sem suporte (sem instalação / sem camada em segundo plano) continua
  funcionando como hoje, com 0 erros visíveis.

## Assumptions

- Escopo só front; nenhuma API nova. Notificações (B13) ficam fora desta entrega; aqui só se prepara
  a base.
- "Banner" do issue = aviso discreto na tela, dispensável; texto em português, voz do `DESIGN.md`.
- Lembrar a dispensa vale por tempo indeterminado neste aparelho (sem prazo para reaparecer).
- A página "Sem conexão" só é garantida para quem já abriu o app com internet ao menos uma vez
  (limitação inerente a esse tipo de recurso).
- Não há modo offline de uso: nenhuma funcionalidade de conta funciona sem internet; só a página
  "Sem conexão" substitui o erro do navegador.
- Pessoas em iPhone/iPad dependem da instalação manual, pois o navegador não oferece botão.
- O ícone da marca já existente em `public/` serve de base para os ícones de instalação.
- As cores de tema/fundo são as da marca em `DESIGN.md` (verde jardim); os valores exatos ficam
  para o plano.
- Dependência: nenhuma dependência externa de serviço; a escolha da biblioteca/abordagem da camada
  em segundo plano (ex.: Serwist sugerido na issue) fica para o plano.
