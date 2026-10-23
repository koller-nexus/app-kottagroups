# Feature Specification: Política de segurança de conteúdo completa, com nonce por requisição

**Feature Branch**: `feature/024-csp-nonce`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/83"

## Contexto

A spec `023-reaudit-run2-hardening` (#64, PR #76) passou a enviar cabeçalhos de segurança, mas a
política de segurança de conteúdo (CSP) ficou só com `frame-ancestors 'none'`. A política completa
foi deixada para outra entrega, que é esta (issue #83, origem run-2 #63).

**Hoje:** o navegador não recebe nenhuma restrição de origem para scripts, estilos, imagens ou
conexões. Se um dia entrar uma falha de injeção de HTML/script (XSS), o código injetado roda sem
barreira: pode ler a página, chamar a API em nome da pessoa e enviar dados para qualquer lugar.

**O que a página carrega hoje** (ponto de partida do inventário, a confirmar na Fase 0 do plano):

| Recurso | Origem |
|---------|--------|
| Código do app (chunks) e scripts inline de hidratação do framework | o próprio app |
| Analytics e Speed Insights da Vercel | scripts e envios do próprio domínio do app na Vercel |
| Fonte DM Mono | auto-hospedada pelo framework, servida pelo próprio app |
| Imagens otimizadas (fotos de nota, avatares) e ícones | o próprio app |
| Avatares e fotos servidos pela API atrás de CDN (spec 021) | origem da API/CDN |
| Prévia local da foto de perfil antes do envio | `blob:` gerado no navegador |
| Chamadas à API | o próprio app (`/api/v1`, repassado à API) |
| Estilos inline (`style=` em barras, avatar, preço etc.) | atributos inline em componentes |
| Leitura de QR da nota | biblioteca JS local e leitor nativo do navegador, sem recurso externo |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Script injetado não roda (Priority: P1)

Uma pessoa usa o app normalmente. Se, por uma falha futura, alguém conseguir inserir um script na
página (inline ou de outro domínio), o navegador se recusa a executá-lo, porque só roda scripts
que o próprio app autorizou naquela resposta.

**Why this priority**: é o objetivo da issue. Transforma um XSS futuro de "toma a conta" em
"bloqueado pelo navegador", sem depender de o bug nunca existir.

**Independent Test**: abrir uma página do app com a política ativa e tentar executar um script
inline sem a marca da resposta e um script de outra origem; ambos são bloqueados e geram violação
no console, enquanto o app continua funcionando.

**Acceptance Scenarios**:

1. **Given** qualquer página do app, **When** a resposta chega, **Then** ela traz uma política que
   só permite scripts marcados com um valor único daquela resposta (e os que eles carregarem),
   bloqueia plugins/objetos embutidos, restringe o endereço base ao próprio app, restringe envio de
   formulários ao próprio app e mantém a proibição de ser exibida em frame.
2. **Given** uma página carregada, **When** um script inline sem o valor da resposta é inserido,
   **Then** o navegador não o executa e registra violação.
3. **Given** uma página carregada, **When** um script de domínio externo é inserido, **Then** o
   navegador não o carrega.
4. **Given** duas requisições à mesma página, **When** as respostas são comparadas, **Then** o
   valor que autoriza scripts é diferente em cada uma e não é previsível.

---

### User Story 2 - O app funciona igual com a política ativa (Priority: P1)

Quem usa o app entra, vê os grupos, abre uma nota com foto, aceita um convite e troca a foto do
perfil sem perceber diferença nenhuma: nada some, nada quebra, nenhuma violação no console.

**Why this priority**: uma política que quebra telas vai ser desligada. Ativar só faz sentido se
as telas principais continuam inteiras; por isso está no mesmo nível da história 1.

**Independent Test**: rodar os testes de ponta a ponta das telas principais com a política em modo
de bloqueio; todos passam e nenhum registra violação de política no console.

**Acceptance Scenarios**:

1. **Given** a política em modo de bloqueio, **When** a pessoa percorre entrar, painel, grupos,
   nota com foto, convite e perfil, **Then** cada tela aparece completa e o console não mostra
   violação de política.
2. **Given** a página de perfil, **When** a pessoa escolhe uma foto nova, **Then** a prévia local
   aparece antes do envio.
3. **Given** uma nota com foto ou um avatar vindo da CDN da API, **When** a tela abre, **Then** a
   imagem aparece.
4. **Given** a tela de leitura de nota, **When** a pessoa envia a foto do QR, **Then** a leitura
   funciona como antes.
5. **Given** o analytics e o Speed Insights ativos em produção, **When** uma página é visitada,
   **Then** os eventos continuam sendo enviados.

---

### User Story 3 - Ativação gradual, com observação antes do bloqueio (Priority: P2)

Quem mantém o app primeiro publica a política em modo "só relatar" num deploy de preview, navega
pelas telas, corrige o que gerar violação e só então liga o bloqueio. Se algo escapar, dá para
voltar ao modo "só relatar" sem perder o resto.

**Why this priority**: reduz o risco de quebrar produção, mas é processo de entrega; as histórias
1 e 2 definem o estado final.

**Independent Test**: num deploy de preview com o modo "só relatar", navegar pelas telas
principais e conferir que o cabeçalho enviado é o de relato (não bloqueia) e que as violações
aparecem no console.

**Acceptance Scenarios**:

1. **Given** o modo "só relatar" ligado, **When** uma página carrega, **Then** a resposta traz a
   política como relato, nada é bloqueado e violações aparecem no console.
2. **Given** as violações corrigidas, **When** o modo de bloqueio é ligado, **Then** a mesma
   política passa a ser aplicada sem outra mudança de código além da troca de modo.

---

### User Story 4 - Saber o custo em desempenho antes de ativar (Priority: P3)

Quem mantém o app sabe quais páginas deixam de ser pré-geradas por causa do valor por requisição
e quanto isso pesa no tempo de resposta, comparado com a linha de base da spec 018.

**Why this priority**: o valor único por resposta obriga a montar a página a cada requisição. A
maior parte do app já é dinâmica (depende da sessão), então o impacto esperado é pequeno, mas
precisa ser medido, não suposto.

**Independent Test**: comparar a lista de páginas pré-geradas no build antes e depois, e medir o
tempo de resposta delas com o mesmo método da spec 018.

**Acceptance Scenarios**:

1. **Given** o build antes e depois da mudança, **When** a lista de páginas pré-geradas é
   comparada, **Then** cada página que mudou de pré-gerada para dinâmica está registrada.
2. **Given** as páginas que mudaram, **When** o tempo de resposta é medido, **Then** o resultado
   fica registrado junto com a decisão de aceitar ou mitigar.

---

### Edge Cases

- Arquivos estáticos (ícones, imagens de `/public`) e redirecionamentos: não carregam script, mas
  continuam com a proibição de frame; nenhuma resposta fica sem ela.
- Uma resposta não pode levar duas políticas conflitantes (a antiga só com frame e a nova
  completa); o navegador aplicaria as duas e o resultado seria o mais restritivo, quebrando o que
  a nova permite.
- Chamadas a `/api/v1` repassadas à API: a política de documento não se aplica a elas; os
  cabeçalhos da API continuam responsabilidade da API (mesmo critério da spec 023).
- Páginas de erro, 404 e a página de sessão expirada também precisam da política e do valor por
  requisição; um erro não pode abrir uma página sem proteção.
- Estilos inline em atributos (`style=`) usados por componentes: ou continuam permitidos com o
  risco residual documentado, ou são removidos; não podem ser bloqueados silenciosamente.
- Navegador sem suporte ao valor por resposta ou ao carregamento encadeado de scripts: o app
  continua funcionando (a política é proteção extra, não requisito para usar).
- Extensões do navegador que injetam scripts podem gerar violações no console da pessoa; isso não
  conta como regressão do app.
- Ambiente de desenvolvimento local, que recarrega código a quente, pode precisar de permissões
  extras; essas permissões não podem chegar a produção.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toda resposta de página do app MUST trazer uma política de segurança de conteúdo
  que restrinja, no mínimo: scripts, estilos, imagens, fontes, conexões, objetos embutidos
  (`object-src 'none'`), endereço base (`base-uri 'self'`), destino de formulários
  (`form-action 'self'`) e exibição em frame (`frame-ancestors 'none'`).
- **FR-002**: A política de scripts MUST permitir apenas scripts que carreguem um valor único
  gerado para aquela resposta, mais os scripts que esses carregarem; scripts inline sem o valor e
  scripts de outras origens MUST ser bloqueados.
- **FR-003**: O valor que autoriza scripts MUST ser gerado de novo a cada requisição, com
  aleatoriedade criptográfica suficiente para não ser adivinhado (no mínimo 128 bits), e MUST NOT
  ser reaproveitado entre respostas nem guardado em cache compartilhado.
- **FR-004**: Os scripts do framework, os de hidratação e os de analytics/Speed Insights MUST
  receber o valor da resposta e continuar funcionando.
- **FR-005**: A política de imagens MUST permitir apenas o próprio app, a origem de fotos da API
  (CDN da spec 021), `blob:` para a prévia local de foto e `data:` somente se o inventário provar
  que é usado; nenhuma outra origem.
- **FR-006**: A política de conexões MUST permitir apenas o próprio app (incluindo `/api/v1` e os
  envios de analytics/Speed Insights); chamadas diretas a outras origens MUST ser bloqueadas, a
  menos que o inventário mostre uma necessária, que então fica listada no plano.
- **FR-007**: A política de estilos MUST permitir os estilos do app; se atributos `style=` inline
  continuarem necessários, a permissão MUST ser restrita ao mínimo (atributos, não blocos
  `<style>` arbitrários, quando o navegador suportar essa separação) e o risco residual MUST ficar
  documentado no plano.
- **FR-008**: A proibição de exibição em frame (`frame-ancestors 'none'`) e o cabeçalho
  equivalente para navegadores antigos MUST continuar presentes em todas as respostas, inclusive
  arquivos estáticos e redirecionamentos.
- **FR-009**: Cada resposta MUST ter uma única política efetiva aplicada pelo navegador; a política
  antiga de só frame MUST NOT ser somada à nova nas páginas.
- **FR-010**: A política MUST poder ser enviada em modo "só relatar" ou em modo de bloqueio, com
  a troca de um para o outro sem alterar o conteúdo da política.
- **FR-011**: Permissões necessárias só para desenvolvimento local (recarga a quente, avaliação de
  código) MUST NOT aparecer na política de produção.
- **FR-012**: Páginas de erro, 404 e sessão expirada MUST receber a mesma política e o valor por
  requisição.
- **FR-013**: A mudança MUST registrar quais páginas deixaram de ser pré-geradas e o efeito no
  tempo de resposta delas, medido com o método da spec 018.
- **FR-014**: MUST existir teste automatizado de que (a) o cabeçalho da política está presente com
  as diretivas do FR-001, (b) o valor que autoriza scripts muda entre duas requisições, e (c) as
  telas principais (entrar, grupos, nota com foto, convite, perfil) abrem sem violação de política
  no console.
- **FR-015**: O teste de cabeçalhos de segurança existente (spec 023) MUST ser atualizado para a
  nova política, sem perder a verificação dos outros cabeçalhos.

### Key Entities

- **Política de segurança de conteúdo**: conjunto de regras por tipo de recurso (scripts, estilos,
  imagens, fontes, conexões, objetos, base, formulários, frame), enviado em modo de relato ou de
  bloqueio.
- **Valor por resposta (nonce)**: segredo de uso único gerado a cada requisição de página; aparece
  na política e nos scripts autorizados daquela resposta, e em nenhum outro lugar.
- **Inventário de recursos**: lista do que cada tela principal carrega e de onde, usada para
  justificar cada origem permitida.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das respostas de página do app trazem a política completa em modo de bloqueio;
  100% das respostas (páginas, arquivos estáticos, redirecionamentos) mantêm a proibição de frame.
- **SC-002**: Em 20 requisições seguidas à mesma página, os 20 valores que autorizam scripts são
  distintos.
- **SC-003**: 0 violações de política no console nas 5 telas principais (entrar, grupos, nota com
  foto, convite, perfil) e no painel, em navegação automatizada com a política em bloqueio.
- **SC-004**: Um script inline sem o valor da resposta e um script de origem externa inseridos na
  página são bloqueados em 100% das tentativas no teste.
- **SC-005**: Toda a suíte existente (lint, testes unitários, build, ponta a ponta) passa sem
  mudança de comportamento visível para quem usa.
- **SC-006**: As páginas que deixaram de ser pré-geradas estão listadas e o tempo de resposta
  delas não piora mais que 20% no p75 em relação à linha de base da spec 018; se piorar, a decisão
  (aceitar ou mitigar) fica registrada antes de ativar o bloqueio.
- **SC-007**: A política passou por pelo menos um deploy de preview em modo "só relatar" antes do
  modo de bloqueio chegar a produção.

## Assumptions

- O modo "só relatar" é observado pelo console do navegador e pelos testes de ponta a ponta; não
  haverá endpoint para coletar relatórios de violação nesta entrega (fica para outra issue se
  houver necessidade de monitorar produção).
- Os envios de analytics e Speed Insights da Vercel vão para o próprio domínio do app (caminhos
  servidos pela Vercel); se o inventário mostrar outra origem, ela entra na política e no plano.
- A fonte é auto-hospedada pelo framework, então não há origem externa de fonte.
- Os navegadores-alvo são os mesmos já suportados pelo app (versões atuais de Chrome, Safari,
  Firefox e Edge, inclusive mobile), que entendem valor por resposta e carregamento encadeado.
- A geração do valor por requisição e a montagem da política acontecem na mesma camada que já
  intercepta as requisições de página (a do controle de sessão); não é preciso camada nova.
- Os cabeçalhos da API repassada em `/api/v1` continuam responsabilidade da API.
- Não há `VERSION` no repositório hoje; a regra da constituição sobre ele não se aplica (pendência
  já registrada na constituição).
- A spec não cria branch: não há hook de branch configurado em `.specify/extensions.yml`.
