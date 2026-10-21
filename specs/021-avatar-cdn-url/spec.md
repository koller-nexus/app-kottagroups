# Feature Specification: Foto de perfil com endereço fixo, guardada em cache pelo navegador

**Feature Branch**: `feature/021-avatar-cdn-url`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/70"

## Contexto

Hoje o endereço da foto de perfil que a API devolve é um link assinado e temporário. Ele vence
depois de um tempo, então o navegador não pode reaproveitá-lo: a cada visita a foto é baixada de
novo, e o front trata o link como algo que expira (comentários, escolhas e o fallback partem dessa
premissa).

Com koller-nexus/api-kottagroups#243, a API passa a devolver um endereço **fixo e imutável** para
cada foto, servido pela própria API atrás de uma CDN. Trocar a foto gera um endereço novo; o
antigo nunca passa a mostrar outra imagem. Isso permite que o navegador guarde a foto em cache sem
risco de mostrar a foto anterior.

Hoje o front usa o endereço da foto como veio da API (no Perfil, no cabeçalho e nas listas de
membros) e mostra as iniciais quando a imagem não carrega. Não há política de segurança de conteúdo
(CSP) configurada no front.

Issue de origem: koller-nexus/app-kottagroups#70.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A foto aparece rápido nas visitas seguintes (Priority: P1)

A pessoa abre o Perfil, o painel ou a lista de membros de um grupo. Na primeira visita a foto é
baixada; nas próximas, ela aparece na hora, vinda do cache do navegador, sem novo download.

**Why this priority**: é o ganho que motiva a mudança na API. Sem ele, a troca não entrega nada
para quem usa o app.

**Independent Test**: abrir `/perfil` com uma conta que tem foto, recarregar a página e verificar
nas ferramentas do navegador que a foto veio do cache (memória ou disco), sem nova transferência.

**Acceptance Scenarios**:

1. **Given** a conta tem foto, **When** a pessoa abre o Perfil, **Then** a foto aparece no topo do
   Perfil e no cabeçalho.
2. **Given** a pessoa abre a lista de membros ou o detalhe de um grupo, **When** a tela carrega,
   **Then** os membros aparecem com as iniciais, como hoje (a API ainda não manda a foto dos
   membros; ver Assumptions).
3. **Given** a foto já foi vista uma vez, **When** a pessoa recarrega a página ou volta a ela,
   **Then** a foto é exibida a partir do cache do navegador, sem ser baixada de novo.

---

### User Story 2 - Trocar a foto mostra a nova na hora (Priority: P1)

A pessoa escolhe uma foto nova no Perfil. Assim que o envio termina, a foto nova aparece no Perfil
e no cabeçalho, sem recarregar a página e sem que a antiga volte a aparecer por causa do cache.

**Why this priority**: com cache ligado, o risco é a foto antiga "grudar". Este fluxo garante que
o cache não piora a troca de foto.

**Independent Test**: com uma foto já em cache, trocar a foto no Perfil e verificar que a nova
aparece imediatamente no Perfil e no cabeçalho, sem recarregar.

**Acceptance Scenarios**:

1. **Given** a pessoa está no Perfil com uma foto em cache, **When** envia uma foto nova e o envio
   termina, **Then** a foto nova aparece no Perfil e no cabeçalho sem recarregar a página.
2. **Given** a foto foi trocada, **When** a pessoa navega para outra tela e volta, **Then** continua
   vendo a foto nova, nunca a anterior.
3. **Given** a foto foi trocada, **When** a pessoa recarrega a página, **Then** a foto nova vem do
   cache a partir da segunda carga, como em qualquer foto.

---

### User Story 3 - Sem foto ou foto indisponível, as iniciais aparecem (Priority: P2)

Se a foto foi removida, não existe ou não carrega (erro de rede), a pessoa vê as iniciais no lugar,
sem imagem quebrada.

**Why this priority**: já funciona hoje e precisa continuar funcionando com o endereço novo.

**Independent Test**: bloquear o endereço da foto nas ferramentas do navegador e abrir o Perfil e a
lista de membros: as iniciais aparecem no lugar de cada foto.

**Acceptance Scenarios**:

1. **Given** a conta não tem foto, **When** a pessoa abre o Perfil, **Then** vê as iniciais.
2. **Given** o endereço da foto não responde ou devolve erro, **When** a tela carrega, **Then**
   aparecem as iniciais no lugar, sem ícone de imagem quebrada.

---

### Edge Cases

- Foto trocada em outro dispositivo ou aba: a próxima carga de qualquer tela traz o endereço novo
  vindo da API e mostra a foto nova; o endereço antigo em cache simplesmente deixa de ser usado.
- Endereço antigo ainda em cache depois de uma troca: não é exibido, porque as telas usam sempre o
  endereço mais recente devolvido pela API.
- A API ainda devolve o link assinado antigo (front publicado antes da API): a foto continua
  aparecendo como hoje; só não vem do cache. Nada quebra.
- Política de segurança de conteúdo adicionada no futuro: precisa permitir imagens vindas do
  domínio da API, senão todas as fotos caem nas iniciais.
- Foto enviada com erro (arquivo inválido, falha no envio): a foto anterior continua visível e a
  mensagem de erro de hoje aparece, sem mudança.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O app MUST exibir a foto usando o endereço devolvido pela API para a conta e para os
  membros de grupo, sem montar nem alterar esse endereço no cliente.
- **FR-002**: O app MUST NOT acrescentar ao endereço da foto parâmetros para forçar novo download
  (por exemplo, marca de tempo). O endereço já muda a cada troca de foto.
- **FR-003**: O app MUST NOT tratar o endereço da foto como temporário: nenhuma busca extra dos
  dados da conta só para renovar o endereço, e nenhum comentário ou regra que suponha expiração.
- **FR-004**: Após uma troca de foto bem-sucedida, o Perfil e o cabeçalho MUST exibir a foto nova
  sem recarregar a página, usando o endereço novo devolvido pela API.
- **FR-005**: Quando a foto não carregar (removida, inexistente, erro de rede), o app MUST exibir
  as iniciais da pessoa no lugar, sem imagem quebrada.
- **FR-006**: A foto MUST ser carregada diretamente do endereço da API, de forma que o navegador
  possa reaproveitá-la do cache nas visitas seguintes, sem passar por um serviço intermediário de
  otimização de imagem do front.
- **FR-007**: Se o front tiver uma política de segurança de conteúdo, ela MUST permitir imagens do
  domínio da API. Hoje não há política; nada a configurar além de registrar a exigência.

### Key Entities

- **Foto de perfil**: imagem da conta, identificada por um endereço fixo devolvido pela API. Cada
  troca gera um endereço novo; um endereço nunca passa a apontar para outra imagem. Aparece no
  Perfil, no cabeçalho e onde a pessoa é listada como membro.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Na segunda carga de qualquer tela com foto, 100% das fotos já vistas são exibidas a
  partir do cache do navegador, sem nova transferência.
- **SC-002**: Após trocar a foto, a nova aparece no Perfil e no cabeçalho em até 1 segundo depois
  do fim do envio, sem recarregar a página, e a foto anterior não reaparece em nenhuma tela.
- **SC-003**: Com o endereço da foto bloqueado, 100% dos avatares afetados mostram as iniciais, sem
  ícone de imagem quebrada.
- **SC-004**: Nenhum texto, comentário ou regra do front continua descrevendo o endereço da foto
  como temporário ou assinado.

## Assumptions

- Depende de koller-nexus/api-kottagroups#243: a API devolve o endereço fixo e imutável da foto
  (`/api/v1/avatars/{userID}/{randomID}.webp` no domínio da API), com cabeçalhos que permitem cache
  longo no navegador e na CDN.
- A resposta do envio da foto e a busca dos dados da conta devolvem o endereço novo logo após a
  troca.
- A API não inclui a foto nos dados dos membros de grupo. Fotos nas listas de membros ficam para
  quando a API mandar esse dado (issue a abrir em koller-nexus/api-kottagroups); o front passa a
  usá-lo sem outra mudança de comportamento.
- Fotos de notas fiscais e comprovantes continuam com links assinados e temporários; estão fora do
  escopo.
- A política de segurança de conteúdo (CSP), se adotada, é decidida no trabalho de cabeçalhos de
  segurança (spec 020); esta feature só registra que ela precisa permitir o domínio da API em
  imagens.
- A pessoa usa um navegador com cache habilitado; em modo anônimo ou com cache desligado a foto
  apenas é baixada a cada visita, como hoje.
