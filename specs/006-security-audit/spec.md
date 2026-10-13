# Feature Specification: Auditoria de segurança do front

**Feature Branch**: `feature/006-security-audit`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "implemente essa issue: https://github.com/koller-nexus/app-kottagroups/issues/10"

## Contexto

O app web nunca passou por uma auditoria de segurança. O repositório não tem a skill de auditoria
usada no `api-kottagroups` nem nenhuma checagem de segurança na CI. Vulnerabilidades em sessão,
redirecionamentos, ações do servidor, dependências ou cabeçalhos HTTP só seriam descobertas por um
atacante ou por acaso.

O objetivo é encontrar vulnerabilidades **reais** (com evidência), registrá-las de forma rastreável
e cruzar os achados de autenticação/sessão com a auditoria da API
(koller-nexus/api-kottagroups#158). Quem se beneficia são os mantenedores (backlog de correções
priorizado) e, indiretamente, os usuários do Kotta Groups (dados de grupos e despesas protegidos).

Esta feature **não corrige** as vulnerabilidades encontradas: cada correção vira uma issue própria.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mantenedor conhece as dependências vulneráveis (Priority: P1)

O mantenedor roda a auditoria de dependências do projeto (só produção e completa), além do lint e
dos testes, e obtém um resumo por severidade publicado na issue #10.

**Why this priority**: É o passo mais barato e de maior sinal; dependências vulneráveis são o
vetor mais comum e independem do resto da auditoria.

**Independent Test**: Rodar a auditoria de dependências num checkout limpo de `main` e conferir
que a issue #10 recebeu um comentário com contagem por severidade (crítica, alta, moderada, baixa)
separando dependências de produção das de desenvolvimento.

**Acceptance Scenarios**:

1. **Given** um checkout limpo de `main` com o lockfile congelado, **When** a auditoria de
   dependências roda, **Then** o resultado lista contagens por severidade para produção e para o
   conjunto completo.
2. **Given** a auditoria de dependências concluída, **When** o resumo é publicado, **Then** a issue
   #10 contém o resumo e o resultado de lint e testes (passou/falhou).
3. **Given** uma dependência de produção com vulnerabilidade alta ou crítica, **When** o resumo é
   escrito, **Then** ela aparece nominalmente com a versão corrigida, se houver.

---

### User Story 2 - Auditoria guiada do código-fonte (Priority: P1)

O mantenedor instala a skill de auditoria de segurança no repositório (mesma origem e registro que
o `api-kottagroups`) e executa uma rodada no perfil padrão sobre o repositório inteiro, seguindo
todas as fases da skill e cobrindo as superfícies prioritárias da issue. O resultado é validado
pelos verificadores da própria skill.

**Why this priority**: É o núcleo da issue; encontra falhas de lógica que nenhuma ferramenta de
dependências pega (sessão, redirecionamento aberto, autorização nas ações do servidor, XSS).

**Independent Test**: Conferir que a skill está registrada e listada nas instruções do projeto, que
existe uma pasta de execução fora do repositório com os achados e o registro de cobertura, e que os
dois verificadores terminam sem erro.

**Acceptance Scenarios**:

1. **Given** o repositório sem a skill, **When** ela é instalada, **Then** aparece na pasta de
   skills, no arquivo de travas de skills (com origem e hash) e na lista de skills das instruções
   do projeto.
2. **Given** a skill instalada, **When** uma rodada é executada, **Then** a saída fica fora do
   repositório, numa pasta numerada por execução, e nada dela é versionado.
3. **Given** a rodada concluída, **When** os verificadores de achados e de cobertura rodam,
   **Then** ambos passam; se a rodada não puder terminar, ela é marcada como incompleta com o
   motivo registrado.
4. **Given** as superfícies prioritárias (lista em FR-006), **When** o registro de cobertura é
   lido, **Then** cada uma aparece como revisada, com achado ou com justificativa de "sem achado".

---

### User Story 3 - Achados viram trabalho rastreável (Priority: P2)

Cada achado confirmado vira uma issue própria no repositório do app; cada achado que precisa de
validação é listado na issue #10 com o fato que falta para confirmá-lo ou descartá-lo.

**Why this priority**: Sem isso a auditoria vira um relatório esquecido; mas depende das histórias
1 e 2.

**Independent Test**: Para cada achado confirmado no relatório, existe uma issue com severidade,
evidência (arquivo e linha ou reprodução local) e correção sugerida; a issue #10 lista os itens
pendentes de validação.

**Acceptance Scenarios**:

1. **Given** um achado confirmado, **When** ele é registrado, **Then** a nova issue traz
   severidade, evidência, impacto e correção sugerida, e referencia a issue #10.
2. **Given** um achado de autenticação ou sessão, **When** ele é registrado, **Then** a issue cita
   se o mesmo problema aparece (ou foi descartado) na auditoria da API #158.
3. **Given** um achado que precisa de validação, **When** a issue #10 é atualizada, **Then** ele
   aparece com o fato faltante (ex.: "depende de como a API valida o dono do grupo").
4. **Given** uma issue de achado já existente com o mesmo problema, **When** o achado é registrado,
   **Then** nenhuma duplicata é criada; a issue existente é referenciada.

---

### User Story 4 - Decisão sobre checagem contínua na CI (Priority: P3)

O mantenedor avalia se vale adicionar uma checagem de segurança automática em cada PR (auditoria de
dependências e análise estática) e registra a decisão.

**Why this priority**: Evita regressões futuras, mas a issue pede só a avaliação; a implementação
fica em issue separada.

**Independent Test**: A issue #10 contém a decisão (sim/não) com o motivo; se "sim", existe uma
issue separada descrevendo a checagem.

**Acceptance Scenarios**:

1. **Given** os resultados das histórias 1 e 2, **When** a avaliação é feita, **Then** a decisão e
   o motivo ficam registrados na issue #10.
2. **Given** a decisão "sim", **When** ela é registrada, **Then** uma issue separada descreve o que
   a checagem roda e quando deve falhar o PR.

### Edge Cases

- A auditoria de dependências falha por rede ou indisponibilidade do registro: repetir; se
  persistir, registrar como não executada com o erro, sem inventar números.
- Lint ou testes já falham em `main`: registrar o estado como encontrado, sem bloquear a auditoria.
- Ferramentas opcionais (varredura de sistema de arquivos, análise estática) não instaladas:
  registrar como não executadas; não são requisito.
- Achado que só se confirma com acesso a produção ou à API de produção: fica como "precisa de
  validação", nunca é testado contra produção.
- A rodada da skill não termina (tempo, contexto, erro): marcada como incompleta, com motivo e a
  última fase concluída.
- Achado com dado sensível (token, segredo real no histórico): a issue pública não reproduz o
  segredo; descreve local e tipo e recomenda rotação.
- Zero achados confirmados: a issue #10 registra isso explicitamente com a cobertura revisada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A skill de auditoria de segurança MUST ser instalada no repositório a partir da mesma
  origem usada no `api-kottagroups`, registrada no arquivo de travas de skills e listada nas
  instruções de agentes do projeto.
- **FR-002**: A auditoria de dependências MUST ser executada sobre o lockfile congelado em dois
  recortes: só dependências de produção e o conjunto completo.
- **FR-003**: Lint e testes do projeto MUST ser executados e seu resultado (passou/falhou) MUST
  constar no resumo.
- **FR-004**: Um resumo com contagem por severidade de cada recorte de dependências MUST ser
  publicado como comentário na issue #10.
- **FR-005**: Uma rodada da skill MUST ser executada no perfil padrão, sobre o repositório inteiro
  na referência `main`, seguindo todas as fases da skill.
- **FR-006**: A rodada MUST cobrir, no mínimo: flags do cookie de sessão; criação e encerramento de
  sessão; a checagem de sessão no proxy (que hoje só verifica a existência do cookie);
  redirecionamento aberto no parâmetro `next` e no cabeçalho de caminho do proxy; ações do servidor
  (autenticação, CSRF, validação de entrada, IDs de grupo/despesa vindos do cliente); vazamento de
  token ou de erros da API para o navegador; variáveis públicas e segredos no pacote do navegador;
  XSS na renderização de dados da API, notas e OCR; cabeçalhos de segurança (CSP, frame-ancestors,
  HSTS); upload e leitura de NFC-e.
- **FR-007**: A saída da rodada MUST ficar fora do repositório, em
  `~/security-audit-skill/app-kottagroups/run-<N>`, e nenhum artefato dela MUST ser versionado.
- **FR-008**: Os verificadores de achados e de cobertura da skill MUST terminar sem erro; se a
  rodada não terminar, ela MUST ser marcada como incompleta com o motivo.
- **FR-009**: A auditoria MUST NOT enviar requisições ao ambiente de produção do app nem à API de
  produção; só leitura do código e execução local isolada.
- **FR-010**: Cada achado confirmado MUST virar uma issue própria com severidade, evidência,
  impacto e correção sugerida, referenciando a issue #10, sem criar duplicatas.
- **FR-011**: Achados de autenticação/sessão MUST ser cruzados com a auditoria da API (#158) e o
  resultado do cruzamento MUST constar na issue do achado.
- **FR-012**: Achados que precisam de validação MUST ser listados na issue #10 com o fato faltante.
- **FR-013**: Issues e comentários públicos MUST NOT conter segredos ou tokens reais.
- **FR-014**: A decisão sobre uma checagem de segurança contínua na CI MUST ser registrada na issue
  #10; se positiva, MUST ser aberta uma issue separada para implementá-la.
- **FR-015**: Esta feature MUST NOT alterar o código do app para corrigir achados; correções ficam
  nas issues geradas.

### Key Entities

- **Rodada de auditoria**: uma execução numerada da skill; tem perfil, referência auditada, estado
  (concluída/incompleta + motivo), registro de cobertura e lista de achados.
- **Achado**: problema de segurança; tem severidade, estado (confirmado / precisa de validação /
  descartado), superfície afetada, evidência, correção sugerida e, se aplicável, link para a issue
  criada e para o achado correspondente na API.
- **Registro de cobertura**: lista das superfícies auditadas, cada uma com resultado (achado ou
  "sem achado" com justificativa).
- **Resumo de dependências**: contagens por severidade para produção e completo, mais resultado de
  lint e testes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das superfícies prioritárias listadas em FR-006 aparecem no registro de
  cobertura com resultado explícito.
- **SC-002**: 100% dos achados confirmados têm uma issue com severidade, evidência e correção
  sugerida; 0 achados confirmados sem issue.
- **SC-003**: Os dois verificadores da skill terminam sem erro (ou a rodada está marcada como
  incompleta com motivo).
- **SC-004**: A issue #10 contém, num único lugar, o resumo de dependências, a lista de itens que
  precisam de validação e a decisão sobre checagem na CI.
- **SC-005**: 0 requisições feitas a ambientes de produção durante a auditoria.
- **SC-006**: 0 arquivos de saída da auditoria versionados no repositório.

## Assumptions

- A origem e o formato de registro da skill são os mesmos já usados no `api-kottagroups`; o
  instalador de skills do projeto é o mesmo.
- O mantenedor tem permissão para comentar na issue #10 e criar issues no repositório do app.
- A auditoria da API (#158) pode ainda não ter terminado; nesse caso o cruzamento registra "não
  verificado na API" e o item fica na lista de validação.
- A checagem de segurança na CI é só avaliada aqui; sua implementação está fora de escopo.
- Ferramentas de varredura opcionais só são usadas se já estiverem instaladas na máquina.
- Severidades seguem a escala da própria skill (e, para dependências, a do relatório de auditoria
  de pacotes).
