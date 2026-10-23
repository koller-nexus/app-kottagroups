# Feature Specification: Repassar o IP do navegador à API nas chamadas do servidor

**Feature Branch**: `feature/026-forward-client-ip`

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/81"

## Contexto

Parte do front de koller-nexus/api-kottagroups#250. Origem: re-auditoria run-2 (#63), item "limite
por IP compartilhado", fora do escopo da spec 023.

**Hoje:** o app chama a API a partir do próprio servidor (Vercel): a camada central de chamadas à
API, as ações de entrar e se cadastrar e a rota de saída por sessão inválida. Dessas chamadas, só o
navegador da pessoa (`User-Agent`) vai junto, e só em entrar e cadastrar. Para a API, o cliente é o
IP de saída da Vercel, então todos os usuários web dividem o mesmo limite de requisições: um usuário
(ou um terceiro com conta) pode deixar o app em "muitas tentativas" para os outros, e entrar e
cadastrar também ficam com o limite dividido. O acompanhamento das notas em leitura amplifica isso
com até 20 consultas à API por requisição.

**Do lado da API (api#250):** a API passa a aceitar o IP do navegador num cabeçalho próprio, e só
quando a requisição traz um segredo compartilhado com o front. Sem o segredo, o cabeçalho é
ignorado. Esta spec é a metade do front: enviar esse IP, com o segredo, em toda chamada do
servidor à API.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O limite de uma pessoa não derruba as outras (Priority: P1)

Uma pessoa usa o app normalmente enquanto outra, em outro lugar, dispara muitas requisições. Toda
chamada que o servidor do app faz à API leva o IP do navegador de quem a originou, junto com o
segredo do front. A API conta o limite de cada pessoa pelo IP dela, e só quem passou do limite vê o
aviso de "muitas tentativas".

**Why this priority**: é o objetivo da issue. Sem isso, a correção da API (api#250) não tem efeito
para o app web.

**Independent Test**: com a API simulada dos testes ponta a ponta, abrir uma página logada e
entrar no app; conferir que cada chamada recebida pela API traz o cabeçalho de IP com o IP do
navegador e o cabeçalho do segredo com o valor configurado.

**Acceptance Scenarios**:

1. **Given** o app configurado com o segredo, **When** uma pessoa abre uma página logada, **Then**
   cada chamada que o servidor faz à API para montar a página leva o IP do navegador dela e o
   segredo.
2. **Given** o app configurado com o segredo, **When** uma pessoa entra, se cadastra, confirma o
   e-mail ou pede o reenvio do link, **Then** a chamada à API leva o IP dela e o segredo, além do
   navegador (`User-Agent`) como hoje.
3. **Given** o app configurado com o segredo, **When** o acompanhamento das notas em leitura
   consulta várias notas de uma vez, **Then** todas as consultas à API levam o IP do mesmo
   navegador.
4. **Given** o app configurado com o segredo, **When** a rota de saída confere se o token ainda
   vale, **Then** essa chamada também leva o IP e o segredo.

---

### User Story 2 - Ninguém escolhe o próprio IP nem vê o segredo (Priority: P1)

Uma pessoa mal-intencionada tenta se passar por outro IP mandando cabeçalhos de IP inventados, ou
tenta descobrir o segredo do front. O IP enviado à API é sempre o que a borda da Vercel registrou
para a conexão, nunca um valor escolhido pelo navegador, e o segredo nunca sai do servidor.

**Why this priority**: se o navegador pudesse escolher o IP, a mudança trocaria um limite
compartilhado por um limite que qualquer um contorna (ou usa para esgotar o limite de outra
pessoa). Se o segredo vazasse, qualquer um falaria direto com a API se passando pelo front.
Precisa sair junto com a US1.

**Independent Test**: mandar uma requisição ao app com cabeçalhos de IP e de segredo inventados e
conferir que a API recebe o IP da conexão e o segredo do servidor, não os valores inventados; e
conferir que o valor do segredo não aparece em nenhuma página, resposta, script ou cabeçalho de
resposta que chega ao navegador.

**Acceptance Scenarios**:

1. **Given** um navegador que envia ao app o cabeçalho de IP da API (o mesmo nome que o front usa
   para falar com a API) com um IP inventado, **When** o servidor chama a API, **Then** a API
   recebe o IP registrado pela borda, nunca o inventado.
2. **Given** um navegador que envia ao app um cabeçalho de segredo inventado, **When** o servidor
   chama a API, **Then** a API recebe só o segredo configurado no servidor.
3. **Given** qualquer página, resposta de rota ou ação do app, **When** se procura o valor do
   segredo no que chega ao navegador (HTML, scripts, dados e cabeçalhos de resposta), **Then** ele
   não aparece.
4. **Given** um IP de origem que não é um endereço IPv4 ou IPv6 válido, **When** o servidor chama a
   API, **Then** o cabeçalho de IP não é enviado (a chamada segue sem ele).

---

### User Story 3 - Sem segredo configurado, nada muda (Priority: P2)

Em desenvolvimento local, ou se o segredo ainda não foi configurado num ambiente, o app funciona
como hoje: não envia nem o IP nem o segredo, e a API conta o limite pelo IP de saída.

**Why this priority**: a mudança não pode quebrar o desenvolvimento local nem um ambiente que ainda
não recebeu o segredo; e o front pode ir para produção antes ou depois da API sem ordem fixa.

**Independent Test**: subir o app sem o segredo, abrir páginas e entrar; conferir que a API não
recebe o cabeçalho de IP nem o de segredo e que tudo funciona como hoje.

**Acceptance Scenarios**:

1. **Given** o app sem o segredo configurado, **When** o servidor chama a API, **Then** nenhum dos
   dois cabeçalhos é enviado e o comportamento é o de hoje.
2. **Given** o app com o segredo e a API ainda sem a mudança de api#250, **When** o servidor chama a
   API, **Then** a API ignora os cabeçalhos e o comportamento é o de hoje.
3. **Given** o app em produção sem o segredo configurado, **When** o servidor faz a primeira chamada
   à API, **Then** os logs do servidor registram um aviso de que o IP não está sendo repassado (sem
   expor nenhum valor), para que a falta de configuração não passe despercebida.

---

### Edge Cases

- A borda registra vários IPs encadeados no cabeçalho de origem: vale o IP do navegador que a borda
  da Vercel define, nunca um valor anterior da cadeia vindo do próprio navegador.
- Requisição sem nenhum IP de origem (por exemplo, renderização fora de uma requisição): a chamada
  segue sem nenhum dos dois cabeçalhos, já que o segredo sozinho não serve para nada.
- Endereço IPv6: enviado como veio. Valor com porta ou fora do formato de endereço não é enviado
  (a borda da Vercel não manda porta).
- Chamadas que o navegador faz direto para `/api/v1/*` (repassadas pela Vercel à API sem passar pelo
  código do servidor, como a troca de senha por e-mail): ficam fora desta spec. Elas não levam o
  segredo, então a API as trata como hoje.
- Desenvolvimento local fora da Vercel: não existe borda que reescreva o IP, então o cabeçalho de
  origem é controlado pelo navegador. Por isso o segredo só é configurado nos ambientes da Vercel e
  na suíte ponta a ponta, onde o IP vem do próprio teste.
- Segredo trocado na API e no front em momentos diferentes: durante a janela, a API ignora o
  cabeçalho e volta ao limite por IP de saída; nada quebra.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toda chamada que o servidor do app faz à API MUST enviar o IP do navegador que
  originou a requisição no cabeçalho de IP do contrato de api#250, junto com o segredo
  compartilhado no cabeçalho de segredo do mesmo contrato. Isso cobre a camada central de chamadas
  à API (páginas, ações, rotas internas como o status das notas) e a rota de saída.
- **FR-002**: O IP enviado MUST ser o que a borda da Vercel define para a conexão. O app MUST NOT
  repassar um cabeçalho de IP ou de segredo recebido do navegador; qualquer valor que o navegador
  mande com esses nomes MUST ser descartado antes da chamada à API.
- **FR-003**: O IP MUST ser validado como endereço IPv4 ou IPv6 antes do envio; valor inválido ou
  ausente MUST fazer a chamada seguir sem os dois cabeçalhos.
- **FR-004**: O segredo MUST vir de uma variável de ambiente disponível só no servidor, MUST ser
  lido só por código que roda no servidor e MUST NOT aparecer em nenhuma resposta, página, script
  ou log.
- **FR-005**: Sem o segredo configurado, o app MUST NOT enviar nenhum dos dois cabeçalhos e MUST
  funcionar como hoje.
- **FR-006**: Sem o segredo configurado em produção, o servidor MUST registrar um aviso nos logs,
  no máximo uma vez por instância, sem expor valores.
- **FR-007**: O envio do navegador (`User-Agent`) em entrar e cadastrar MUST continuar como hoje.
- **FR-008**: O comportamento visível de hoje MUST se manter: mesmas rotas, mesmas mensagens de
  "muitas tentativas" e de erro, mesmo tratamento de sessão vencida.
- **FR-009**: A montagem dos cabeçalhos (IP válido, IP inválido, IP ausente, segredo ausente,
  valores inventados pelo navegador descartados) MUST ter teste unitário.
- **FR-010**: Os testes ponta a ponta MUST conferir, pela API simulada, que as chamadas do servidor
  chegam com o cabeçalho de IP e o segredo, que valores inventados pelo navegador não chegam, e
  que o valor do segredo não aparece no que o navegador recebe.
- **FR-011**: README MUST documentar a variável de ambiente do segredo: para que serve, em quais
  ambientes configurar e que ela é só do servidor.

### Key Entities

- **IP do navegador**: endereço IPv4 ou IPv6 da conexão, definido pela borda da Vercel; vai à API
  em toda chamada do servidor.
- **Segredo do front**: valor compartilhado com a API, guardado em variável de ambiente só do
  servidor, por ambiente (produção e Preview); prova para a API que o cabeçalho de IP veio do front.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Com o segredo configurado, 100% das chamadas do servidor à API levam o IP do
  navegador e o segredo (verificado pela API simulada nos testes ponta a ponta).
- **SC-002**: Com a API de api#250 em produção, duas pessoas em IPs diferentes deixam de dividir o
  limite: uma pessoa que passa do limite não faz outra pessoa receber "muitas tentativas".
- **SC-003**: 0 ocorrências do valor do segredo no que chega ao navegador, em todas as páginas e
  rotas cobertas pela suíte ponta a ponta.
- **SC-004**: 0 chamadas à API levam um IP ou segredo escolhido pelo navegador.
- **SC-005**: Sem o segredo, a suíte ponta a ponta passa inteira como hoje.

## Assumptions

- O contrato de api#250 ainda não fechou os nomes. Esta spec segue a sugestão da issue: cabeçalho
  de IP `X-Kotta-Client-IP` e um cabeçalho de segredo compartilhado. Se o contrato fechar com outros
  nomes ou com assinatura HMAC em vez de segredo fixo, muda só a montagem dos cabeçalhos; o
  comportamento descrito aqui se mantém.
- Na Vercel, a borda sobrescreve os cabeçalhos de IP de origem (`x-forwarded-for`, `x-real-ip`) com
  o IP da conexão, então o navegador não consegue escolher esse valor.
- O segredo é configurado por ambiente na Vercel (produção e Preview), com valores diferentes, e
  combinado com a API fora do código. Nenhum valor real entra no repositório.
- A troca das até 20 consultas do status das notas por um endpoint em lote fica fora desta spec:
  depende de a API oferecer o endpoint, e o limite por pessoa (US1) já tira o efeito sobre os
  outros usuários. Vira issue própria se a API publicar o endpoint.
- As chamadas do navegador que a Vercel repassa direto à API (`/api/v1/*`) ficam como estão.
- A spec do lado da API (chavear requisições autenticadas por usuário, aceitar o cabeçalho só com o
  segredo) é feita em api#250 e não faz parte desta entrega.
