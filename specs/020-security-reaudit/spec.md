# Feature Specification: Re-auditoria de segurança do front

**Feature Branch**: `feature/020-security-reaudit`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "rode security audit e procure vulnerabilidade nesse frontend"

## Contexto

A primeira auditoria (feature 006, rodada `run-1` sobre `e41375c`) terminou **incompleta**: um
achado confirmado de severidade baixa (redirecionamento aberto via `/sair?next=/%09/host`) e dois
itens "precisa de validação" (redirecionamento pós-login e compartilhamento do limite de tentativas
por IP entre usuários web) não passaram pela verificação final. O achado confirmado continua sem
correção no código atual.

Desde então entraram 13 features (007–019) com superfícies novas que nunca foram auditadas:
convite por link, QR code e e-mail; leitura de QR a partir de imagem; foto e reenvio de nota
fiscal; rota de status de leitura de nota consultada pelo navegador; páginas de erro e expiração
de sessão; cadastro, confirmação de e-mail e redefinição de senha com token na URL; avatar do
perfil; mudanças no proxy e na configuração do servidor.

O objetivo é uma segunda rodada que (a) cubra todas as superfícies novas, (b) revalide os itens
pendentes da rodada anterior e (c) entregue um backlog de correções priorizado. Beneficia os
mantenedores e, indiretamente, os usuários do Kotta Groups (sessão, convites e dados de grupos e
despesas protegidos).

Como na 006, esta feature **não corrige** as vulnerabilidades: cada correção vira uma issue própria.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mantenedor sabe o que mudou desde a última auditoria (Priority: P1)

O mantenedor executa uma nova rodada de auditoria que parte do resultado da rodada anterior,
revalida cada item pendente contra o código atual e cobre as superfícies criadas desde então.

**Why this priority**: É o núcleo do pedido. Sem a rodada, nenhuma outra história tem insumo; e o
achado anterior ainda aberto mostra que o risco é real.

**Independent Test**: Conferir que existe uma nova pasta de rodada (fora do repositório), que o
registro de cobertura lista cada superfície de FR-003 com resultado explícito e que cada item da
rodada anterior aparece com estado atual (ainda presente, corrigido ou descartado).

**Acceptance Scenarios**:

1. **Given** a rodada anterior com achados e itens pendentes, **When** a nova rodada é planejada,
   **Then** cada item anterior é carregado e revalidado contra o código atual, sem ser omitido
   nem dado como resolvido sem evidência.
2. **Given** o achado anterior de redirecionamento aberto, **When** ele é revalidado, **Then** o
   relatório informa se ele continua reproduzível no código atual.
3. **Given** as superfícies novas (FR-003), **When** o registro de cobertura é lido, **Then** cada
   uma aparece como revisada, com achado ou com justificativa de "sem achado".
4. **Given** a rodada concluída, **When** os verificadores de achados e de cobertura rodam,
   **Then** ambos passam; se a rodada não puder terminar, ela fica marcada como incompleta com o
   motivo e a última fase concluída.

---

### User Story 2 - Dependências vulneráveis conhecidas (Priority: P1)

O mantenedor roda a auditoria de dependências (só produção e completa), além do lint e dos testes,
e compara o resultado com o da rodada anterior.

**Why this priority**: Barato, alto sinal e independente do resto; as dependências mudaram desde
a 006 (ex.: leitores de QR, analytics).

**Independent Test**: Num checkout limpo de `main`, a auditoria de dependências produz contagens
por severidade para produção e para o conjunto completo, e o resumo indica o que surgiu ou sumiu
em relação à rodada anterior.

**Acceptance Scenarios**:

1. **Given** um checkout limpo com o lockfile congelado, **When** a auditoria de dependências
   roda, **Then** o resultado lista contagens por severidade para produção e para o conjunto
   completo.
2. **Given** uma dependência de produção com vulnerabilidade alta ou crítica, **When** o resumo é
   escrito, **Then** ela aparece nominalmente com a versão corrigida, se houver.
3. **Given** o resumo pronto, **When** é comparado com a rodada anterior, **Then** novas
   vulnerabilidades e as que deixaram de existir aparecem separadas.

---

### User Story 3 - Achados viram trabalho rastreável (Priority: P2)

Cada achado confirmado vira uma issue própria; cada item que precisa de validação fica listado,
num único lugar, com o fato que falta para confirmá-lo ou descartá-lo.

**Why this priority**: Sem isso a auditoria vira relatório esquecido (como aconteceu com o achado
da 006); depende das histórias 1 e 2.

**Independent Test**: Para cada achado confirmado existe uma issue com severidade, evidência
(arquivo e linha ou reprodução local), impacto e correção sugerida; existe uma issue de
acompanhamento desta rodada com o resumo de dependências e a lista de itens pendentes.

**Acceptance Scenarios**:

1. **Given** um achado confirmado, **When** ele é registrado, **Then** a issue traz severidade,
   evidência, impacto e correção sugerida, e referencia a issue de acompanhamento.
2. **Given** um achado que já tem issue aberta, **When** ele é registrado, **Then** nenhuma
   duplicata é criada; a issue existente é atualizada com o estado atual.
3. **Given** um achado de sessão, autenticação ou convite, **When** ele é registrado, **Then** a
   issue diz se o mesmo problema depende da API e, se sim, aponta o repositório da API.
4. **Given** um item que precisa de validação, **When** a issue de acompanhamento é atualizada,
   **Then** ele aparece com o fato faltante e um plano seguro de validação.

---

### User Story 4 - Endurecimento recomendado priorizado (Priority: P3)

As notas de endurecimento da rodada anterior (cabeçalhos de segurança, prefixo e flags do cookie
de sessão, confirmação extra para trocar a chave Pix) são reavaliadas e registradas com decisão.

**Why this priority**: Reduz risco futuro, mas não são vulnerabilidades com evidência; podem
esperar as correções dos achados.

**Independent Test**: A issue de acompanhamento lista cada nota de endurecimento com decisão
(adotar / não adotar) e motivo; cada "adotar" tem uma issue própria.

**Acceptance Scenarios**:

1. **Given** as notas de endurecimento anteriores, **When** são reavaliadas, **Then** cada uma
   recebe decisão e motivo.
2. **Given** a decisão "adotar", **When** ela é registrada, **Then** existe uma issue separada
   descrevendo a mudança.

### Edge Cases

- Um item da rodada anterior se refere a código que mudou: tratado como trabalho novo, nunca
  herdado como "confirmado" ou "resolvido" sem revalidação.
- A auditoria de dependências falha por rede ou indisponibilidade do registro: repetir; se
  persistir, registrar como não executada com o erro, sem inventar números.
- Lint ou testes já falham em `main`: registrar o estado encontrado, sem bloquear a auditoria.
- O ambiente não permite execução isolada do código: a rodada segue só com leitura do código e
  registra itens que dependem de execução como "precisa de validação".
- Achado que só se confirma com produção, com a API de produção ou com a configuração da
  hospedagem: fica como "precisa de validação", nunca é testado contra produção.
- Token de convite, de confirmação ou de redefinição de senha aparece em evidência: a issue
  pública não reproduz token real; usa valores fictícios.
- Segredo real encontrado no código ou no histórico: a issue descreve local e tipo, não o valor, e
  recomenda rotação.
- A rodada não termina (tempo, limite de agentes, permissão negada): marcada como incompleta, com
  motivo, fases concluídas e lista de unidades não cobertas.
- Zero achados confirmados: registrado explicitamente com a cobertura revisada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Uma nova rodada de auditoria MUST ser executada no perfil padrão, sobre o
  repositório inteiro na referência `main` atual, seguindo todas as fases da skill de auditoria
  de segurança já instalada no projeto.
- **FR-002**: A rodada MUST carregar o resultado da rodada anterior (`run-1`) e revalidar contra o
  código atual: o achado confirmado de redirecionamento aberto, os dois itens "precisa de
  validação" e as notas de endurecimento.
- **FR-003**: A rodada MUST cobrir, no mínimo, as superfícies criadas ou alteradas desde a rodada
  anterior:
  - convite por link, QR code e e-mail (token na URL, quem pode gerar e aceitar, destino após
    aceitar, vazamento do token por referência entre páginas);
  - cadastro, confirmação de e-mail e redefinição de senha (tokens na URL, enumeração de contas,
    destino após confirmar);
  - leitura de QR a partir de imagem, foto e reenvio de nota fiscal (tamanho e tipo de arquivo,
    conteúdo do QR tratado como entrada não confiável);
  - rota de status de leitura de nota consultada pelo navegador (exige sessão, só devolve dados do
    próprio usuário, não vaza erros internos);
  - páginas de erro, "não encontrado" e expiração de sessão (não expõem detalhes internos; o aviso
    de sessão entre abas não aceita mensagens de outra origem);
  - avatar do perfil e demais imagens vindas da API (origens permitidas, conteúdo exibido);
  - proxy e configuração do servidor (checagem de sessão, redirecionamentos, cabeçalhos);
  - todas as ações do servidor novas ou alteradas (sessão, validação de entrada, IDs de grupo,
    nota, lista e despesa vindos do cliente).
- **FR-004**: A auditoria de dependências MUST rodar sobre o lockfile congelado em dois recortes
  (só produção e completo), e o resumo MUST comparar com o resultado da rodada anterior.
- **FR-005**: Lint e testes do projeto MUST ser executados e o resultado (passou/falhou) MUST
  constar no resumo.
- **FR-006**: A saída da rodada MUST ficar fora do repositório, em
  `~/security-audit-skill/app-kottagroups/run-<N>` (próximo número livre), e nada dela MUST ser
  versionado.
- **FR-007**: Os verificadores de achados e de cobertura da skill MUST terminar sem erro; se a
  rodada não terminar, ela MUST ser marcada como incompleta com o motivo.
- **FR-008**: A auditoria MUST NOT enviar requisições ao ambiente de produção do app nem à API de
  produção; só leitura do código e execução local isolada quando o isolamento estiver disponível.
- **FR-009**: Cada achado confirmado MUST virar uma issue com severidade, evidência, impacto e
  correção sugerida, referenciando a issue de acompanhamento, sem duplicar issues existentes.
- **FR-010**: Uma issue de acompanhamento desta rodada MUST conter, num único lugar: resumo de
  dependências, resultado de lint e testes, estado de cada item da rodada anterior, itens que
  precisam de validação com o fato faltante e decisões de endurecimento.
- **FR-011**: Issues e comentários públicos MUST NOT conter segredos, tokens reais ou dados de
  usuários reais.
- **FR-012**: Esta feature MUST NOT alterar o código do app para corrigir achados; correções ficam
  nas issues geradas.

### Key Entities

- **Rodada de auditoria**: execução numerada; tem perfil, referência auditada, rodada anterior
  considerada, estado (concluída/incompleta + motivo), registro de cobertura e achados.
- **Achado**: problema de segurança; tem estado (confirmado / precisa de validação / descartado),
  severidade (só se confirmado), superfície, evidência, correção sugerida, origem (novo ou herdado
  da rodada anterior) e link para a issue.
- **Registro de cobertura**: superfícies auditadas, cada uma com resultado (achado ou "sem achado"
  com justificativa).
- **Resumo de dependências**: contagens por severidade (produção e completo), diferença em relação
  à rodada anterior, resultado de lint e testes.
- **Nota de endurecimento**: recomendação sem vulnerabilidade comprovada; tem decisão e motivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das superfícies de FR-003 aparecem no registro de cobertura com resultado
  explícito.
- **SC-002**: 100% dos itens da rodada anterior (1 achado, 2 pendentes, notas de endurecimento)
  têm estado atual registrado; 0 itens omitidos.
- **SC-003**: 100% dos achados confirmados têm issue com severidade, evidência e correção sugerida;
  0 achados confirmados sem issue e 0 issues duplicadas.
- **SC-004**: Os dois verificadores da skill terminam sem erro, ou a rodada está marcada como
  incompleta com motivo e unidades não cobertas.
- **SC-005**: 0 requisições feitas a ambientes de produção durante a auditoria.
- **SC-006**: Um mantenedor encontra, numa única issue de acompanhamento, tudo o que precisa para
  priorizar as correções, sem abrir os arquivos da rodada.

## Assumptions

- A skill de auditoria de segurança instalada na 006 continua no repositório e é a ferramenta da
  rodada; não precisa ser reinstalada.
- O escopo é o app web deste repositório; a API e a infraestrutura são auditadas nos próprios
  repositórios e só são citadas quando um achado depende delas.
- Seguindo a convenção da 006, a feature entrega achados e issues, não correções. Corrigir o
  redirecionamento aberto ainda pendente é a primeira candidata a uma feature própria.
- As issues ficam no repositório GitHub do app (`koller-nexus/app-kottagroups`).
- Se o ambiente não oferecer isolamento para executar o código, vale o mesmo critério da 006:
  auditoria só por leitura, com itens dependentes de execução marcados como "precisa de validação".
