# Feature Specification: Testes E2E dos fluxos principais

**Feature Branch**: `feature/005-e2e-playwright-tests`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "implemente essa issue: https://github.com/koller-nexus/app-kottagroups/issues/9"

## Contexto

Hoje o app só tem testes unitários das regras em `lib/`. Nenhum teste abre o app num navegador e
percorre os fluxos reais (entrar, criar grupo, lançar despesa, usar lista de compras). Uma
regressão em rota, formulário ou redirecionamento só aparece quando alguém usa o app.

Os dados das páginas são buscados pelo servidor do app, não pelo navegador. Por isso os testes não
conseguem simular o backend interceptando requisições na página: precisam de um backend de verdade
(a API local com dados de desenvolvimento) ou de um substituto controlado.

Quem se beneficia são os desenvolvedores e revisores: cada PR passa a mostrar, antes do merge, se
os fluxos principais continuam funcionando.

## Clarifications

### Session 2026-10-13

- Q: Na CI, a suíte roda contra a API real ou contra um mock HTTP? → A: API real, subida no job
  com o seed de desenvolvimento (opção A). Decidido no `/speckit-plan` porque a pergunta ficou sem
  resposta; ver `research.md` R1.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rodar a suíte localmente e confiar nos fluxos de acesso (Priority: P1)

Um desenvolvedor roda um único comando e a suíte abre o app num navegador, cobre os fluxos de
acesso (entrar com sucesso, senha inválida, cadastrar, esqueci a senha, rota protegida sem sessão
levando a `/entrar`, sair) e o painel inicial com e sem sessão. A sessão é criada uma vez e
reaproveitada pelos demais testes.

**Why this priority**: Sem o comando, a configuração e a sessão reaproveitada, nenhum outro teste
existe. Os fluxos de acesso são a porta de entrada de todo o app: se quebram, nada mais funciona.

**Independent Test**: Num checkout limpo, seguir o README, rodar o comando de E2E e ver os testes
de acesso e do painel passarem; quebrar de propósito o redirecionamento de rota protegida e ver o
teste correspondente falhar.

**Acceptance Scenarios**:

1. **Given** credenciais válidas de teste, **When** o teste preenche e envia `/entrar`, **Then** o
   usuário chega ao painel com seus dados.
2. **Given** senha inválida, **When** o teste envia `/entrar`, **Then** a página mostra a mensagem
   de erro e continua em `/entrar`.
3. **Given** nenhuma sessão, **When** o teste abre uma rota da conta (ex.: `/grupos`), **Then** é
   levado para `/entrar`.
4. **Given** uma sessão ativa, **When** o teste abre `/sair`, **Then** a sessão termina e uma rota
   protegida volta a levar para `/entrar`.
5. **Given** nenhuma sessão, **When** o teste abre `/`, **Then** vê o painel em modo de prévia;
   **Given** sessão ativa, **Then** vê os dados reais do usuário.
6. **Given** o formulário de `/cadastrar` e o de `/esqueci-a-senha`, **When** o teste envia dados
   válidos, **Then** a página mostra a confirmação esperada.

---

### User Story 2 - Cobrir grupos, despesas e lista de compras (Priority: P2)

Com a sessão de teste, a suíte cria e edita um grupo, abre seus membros, cria uma despesa, abre o
detalhe e edita, e usa uma lista de compras de um grupo (adicionar e marcar item).

**Why this priority**: São os fluxos que geram valor no app e os que mais mudam. Dependem da base
da US1.

**Independent Test**: Rodar só os testes de grupos, despesas e listas contra um ambiente com dados
de teste e confirmar que cada fluxo termina vendo o dado criado ou editado na tela.

**Acceptance Scenarios**:

1. **Given** sessão ativa, **When** o teste cria um grupo em `/grupos/novo`, **Then** o grupo
   aparece com o nome informado; **When** edita o nome, **Then** o novo nome aparece.
2. **Given** um grupo, **When** o teste abre a página de membros, **Then** vê pelo menos o próprio
   usuário na lista.
3. **Given** um grupo, **When** o teste cria uma despesa em `/despesas/nova`, **Then** a despesa
   aparece no detalhe com descrição e valor; **When** edita, **Then** o detalhe mostra a mudança.
4. **Given** uma lista de compras do grupo, **When** o teste adiciona um item e o marca como
   comprado, **Then** a linha mostra o item no estado comprado.

---

### User Story 3 - Cobrir notas, notificações, perfil e categorias (Priority: P3)

A suíte abre `/notas`, as notificações, o perfil e `/perfil/categorias`, confirmando que cada
página carrega com o conteúdo do usuário e que a ação principal de categorias (criar uma
categoria) funciona.

**Why this priority**: Páginas secundárias, mas que hoje não têm nenhuma cobertura.

**Independent Test**: Rodar só esses testes e ver cada página carregar com o título e o conteúdo
esperados.

**Acceptance Scenarios**:

1. **Given** sessão ativa, **When** o teste abre `/notas`, as notificações e o perfil, **Then**
   cada página mostra seu título e o conteúdo do usuário (ou o estado vazio previsto).
2. **Given** sessão ativa, **When** o teste cria uma categoria em `/perfil/categorias`, **Then** a
   categoria aparece na lista.

---

### User Story 4 - Rodar a suíte automaticamente em todo PR (Priority: P2)

Ao abrir ou atualizar um PR, a integração contínua roda a suíte num navegador (Chromium). Se algo
falha, o PR fica vermelho e o revisor baixa o relatório com o rastro do teste que falhou.

**Why this priority**: Sem rodar no PR, a suíte depende de alguém lembrar de rodar localmente.

**Independent Test**: Abrir um PR com uma mudança que quebra um fluxo coberto e ver a verificação
falhar com o relatório disponível; abrir um PR sem quebra e ver a verificação passar.

**Acceptance Scenarios**:

1. **Given** um PR aberto, **When** a CI roda, **Then** a suíte E2E é executada e o resultado
   aparece como verificação do PR.
2. **Given** um teste falhando na CI, **When** o revisor abre a execução, **Then** encontra o
   relatório e o rastro do teste que falhou para download.

### Edge Cases

- O backend não está disponível quando a suíte começa: a suíte para cedo com uma mensagem clara
  dizendo que o backend não respondeu, em vez de falhar em cada teste com timeouts.
- Dados criados por uma execução não podem quebrar a próxima: nomes de grupos, despesas e
  categorias levam um sufixo único por execução, e os testes não dependem de contagens totais.
- A sessão de teste expira ou é invalidada no meio da suíte: o setup cria uma sessão nova a cada
  execução, em vez de reaproveitar uma sessão salva de uma execução anterior.
- O cadastro em `/cadastrar` usa um e-mail único por execução para não colidir com contas já
  existentes.
- Um teste instável (passa e falha sem mudança de código) deve ser corrigido ou removido, não
  ignorado indefinidamente (Constituição, princípio V).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O projeto MUST ter um único comando de E2E que sobe o app e roda toda a suíte num
  navegador.
- **FR-002**: Os testes de E2E MUST ficar numa pasta própria, separados dos testes unitários, e o
  comando de testes unitários existente MUST continuar funcionando sem mudança.
- **FR-003**: A suíte MUST criar a sessão de teste uma vez por execução e reaproveitá-la nos
  testes que precisam de usuário logado.
- **FR-004**: A suíte MUST cobrir os fluxos de acesso da US1: entrar (sucesso e senha inválida),
  cadastrar, esqueci a senha, rota protegida sem sessão levando a `/entrar`, e sair.
- **FR-005**: A suíte MUST cobrir o painel `/` sem sessão (prévia) e com sessão (dados reais).
- **FR-006**: A suíte MUST cobrir grupos (criar, editar, membros), despesas (criar, ver, editar) e
  lista de compras (adicionar e marcar item) conforme a US2.
- **FR-007**: A suíte MUST cobrir `/notas`, notificações, perfil e `/perfil/categorias` conforme a
  US3.
- **FR-008**: Os testes MUST localizar elementos pelo que o usuário vê (papel do elemento, rótulo,
  texto visível), não por classes de estilo.
- **FR-009**: A suíte MUST rodar contra a API real com os dados de desenvolvimento: na CI, a API é
  subida no próprio job; localmente, o desenvolvedor aponta a suíte para a API local. Não há
  substituto (mock) da API neste repositório.
- **FR-010**: A CI MUST rodar a suíte em todo PR no Chromium e MUST publicar o relatório e o
  rastro dos testes como artefato quando houver falha.
- **FR-011**: O README MUST explicar como preparar o ambiente e rodar a suíte localmente, incluindo
  as variáveis de ambiente e as credenciais de teste necessárias.
- **FR-012**: Credenciais de teste MUST vir de variáveis de ambiente ou segredos da CI; nenhuma
  senha MUST ser versionada.
- **FR-013**: Dados criados pelos testes MUST usar identificadores únicos por execução para que
  execuções repetidas não interfiram umas nas outras.

### Key Entities

- **Usuário de teste**: conta usada pela suíte para entrar; credenciais vindas do ambiente.
- **Sessão de teste**: sessão criada uma vez por execução e compartilhada entre os testes logados.
- **Dados de teste**: grupo, despesa, item de lista e categoria criados durante a execução, com
  sufixo único.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Num checkout limpo, um desenvolvedor segue o README e roda a suíte inteira com
  sucesso em menos de 15 minutos de preparação.
- **SC-002**: A suíte completa termina em menos de 5 minutos na CI.
- **SC-003**: 100% dos fluxos listados na issue #9 têm pelo menos um teste que falha quando o fluxo
  quebra.
- **SC-004**: 100% dos PRs abertos após o merge mostram o resultado da suíte E2E como verificação.
- **SC-005**: Rodar a suíte 5 vezes seguidas sem mudança de código dá o mesmo resultado nas 5
  (sem instabilidade).

## Assumptions

- O app roda na porta 3002 durante os testes, como no desenvolvimento.
- A API local (`api-kottagroups`) tem um seed de desenvolvimento com um usuário que a suíte pode
  usar; se não tiver, a suíte cria o usuário pelo próprio fluxo de cadastro.
- O fluxo de esqueci a senha é verificado até a confirmação na tela; a leitura do e-mail enviado
  fica fora do escopo.
- O cadastro é verificado até a tela de "confirme seu e-mail"; a confirmação por link de e-mail
  fica fora do escopo.
- Só o Chromium é exigido; outros navegadores ficam fora do escopo desta feature.
- Captura de nota fiscal por câmera (feature 004) fica fora do escopo: depende de câmera e de
  processamento assíncrono do backend.
- A nova dependência de teste é só de desenvolvimento e será justificada no PR (Constituição,
  princípio I).
