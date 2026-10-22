# Feature Specification: Endurecimento da re-auditoria de segurança (run-2)

**Feature Branch**: `feature/023-reaudit-run2-hardening`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/63"

## Contexto

A segunda rodada da auditoria de segurança do front (#63, spec `020-security-reaudit`) não trouxe
achado confirmado novo. O open redirect de `/sair` (#46) já foi corrigido pela spec
`022-safe-next-redirect`, que também fecha a variante pós-login. Ficaram cinco decisões de
endurecimento marcadas como "adotar", cada uma com sua issue:

| Issue | O que falta | Risco hoje |
|-------|-------------|------------|
| #67 | Framework com 1 vulnerabilidade crítica e 3 altas em produção (`pnpm audit --prod`) | SSRF no otimizador de imagens alcançável; RCE sem caminho hoje |
| #66 | Sair da conta só apaga o cookie; a sessão continua válida na API | Token copiado antes de sair vale até expirar |
| #65 | Tokens de convite, redefinição de senha e confirmação de e-mail aparecem em URLs que vão para o analytics, o histórico e o Referer | Quem lê o painel de analytics pode obter convites e redefinições válidos |
| #64 | Nenhum cabeçalho de segurança é enviado | Framing e vazamento por Referer barrados só por acaso (cookie `SameSite=Lax`, ausência de recursos de terceiros) |
| #68 | Texto livre de `?erro=` aparece em páginas autenticadas; URLs de imagens vindas da API não têm o esquema conferido | Texto de engenharia social em link forjado; defesa em profundidade para imagens |

Esta spec agrupa os cinco para fechar #63. Cada história é independente e pode ir em um PR
próprio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - App sem vulnerabilidades críticas ou altas conhecidas em produção (Priority: P1)

Quem mantém o app roda a auditoria de dependências de produção e não encontra nenhuma
vulnerabilidade crítica ou alta. O app continua funcionando igual para quem usa.

**Why this priority**: é a única pendência com vulnerabilidade publicada e alcançável (SSRF no
otimizador de imagens, que o app usa). As outras são defesa em profundidade.

**Independent Test**: rodar a auditoria de dependências de produção e a suíte de lint, testes,
build e e2e; nenhuma crítica/alta e nenhuma regressão.

**Acceptance Scenarios**:

1. **Given** o app atualizado, **When** a auditoria de dependências de produção roda, **Then** ela
   reporta 0 críticas e 0 altas.
2. **Given** o app atualizado, **When** lint, testes unitários, build e testes e2e rodam, **Then**
   todos passam sem mudança de comportamento visível.
3. **Given** uma página com imagem otimizada (foto de nota, avatar), **When** ela abre, **Then** a
   imagem aparece como antes.

---

### User Story 2 - Sair da conta encerra a sessão de verdade (Priority: P1)

Uma pessoa clica em "Sair". Além de sair neste navegador, a sessão é encerrada no servidor: um
token copiado antes (por exemplo, num computador compartilhado ou por extensão maliciosa) deixa
de funcionar na hora.

**Why this priority**: hoje o "Sair" dá uma falsa sensação de segurança; a sessão continua válida
na API até expirar. A API já oferece o encerramento; falta o app pedir.

**Independent Test**: em ambiente local com a API de teste, entrar, guardar o token, sair e usar o
token guardado para pedir os dados da conta; a API deve recusar.

**Acceptance Scenarios**:

1. **Given** uma pessoa logada, **When** ela sai da conta, **Then** a sessão é encerrada na API e
   qualquer requisição com aquele token é recusada como não autenticada.
2. **Given** uma pessoa logada e a API fora do ar ou respondendo erro, **When** ela sai da conta,
   **Then** ela sai deste navegador do mesmo jeito e vai para a mesma tela de sempre, sem mensagem
   de erro.
3. **Given** uma pessoa logada que escolheu "criar outra conta" ao sair, **When** ela sai, **Then**
   a sessão é encerrada na API e ela vai para o cadastro, como hoje.

---

### User Story 3 - Tokens de convite e de conta não vazam por URL (Priority: P2)

Uma pessoa abre um link de convite, de redefinição de senha ou de confirmação de e-mail. O token
desse link não chega ao painel de analytics, não fica no histórico do navegador depois de lido e
não é enviado a outros sites pelo Referer.

**Why this priority**: o token desses links dá acesso (entrar num grupo, trocar a senha). Hoje só
o caminho literal do convite é mascarado no analytics; o mesmo token aparece codificado no
parâmetro de retorno das telas de entrar e cadastrar, e os tokens de redefinição e confirmação vão
na query.

**Independent Test**: abrir localmente cada tipo de link com o envio de analytics interceptado e
conferir o que é enviado, o que fica na barra de endereço e a política de Referer da página.

**Acceptance Scenarios**:

1. **Given** um evento de analytics ou de desempenho de qualquer página, **When** ele é enviado,
   **Then** a URL e o caminho registrados não têm query string nem token de convite no caminho.
2. **Given** a tela de entrar ou cadastrar aberta a partir de um convite (retorno apontando para o
   convite), **When** o evento é enviado, **Then** o token do convite não aparece em nenhum campo.
3. **Given** a tela de redefinir senha ou de confirmar e-mail aberta com token, **When** a tela lê
   o token, **Then** a barra de endereço e o histórico passam a mostrar a URL sem o token, e o
   fluxo continua funcionando.
4. **Given** as telas de redefinir senha e confirmar e-mail, **When** elas carregam qualquer
   recurso ou a pessoa segue um link, **Then** nenhum Referer é enviado (como já ocorre no
   convite).

---

### User Story 4 - O app não pode ser embutido em outro site e só fala por HTTPS (Priority: P2)

Um site malicioso tenta abrir o Kotta Groups dentro de um frame para enganar a pessoa (clickjacking)
ou rebaixar a conexão. O navegador recusa o frame, força HTTPS e não adivinha tipos de conteúdo.

**Why this priority**: hoje nada disso é declarado; a proteção depende de detalhes que podem
mudar. Custa pouco e vale para todas as páginas.

**Independent Test**: pedir qualquer página, a API intermediada e um arquivo estático, e conferir
os cabeçalhos da resposta; tentar abrir uma página dentro de um frame num HTML local.

**Acceptance Scenarios**:

1. **Given** qualquer resposta do app (páginas, rotas intermediadas da API, arquivos estáticos),
   **When** ela chega ao navegador, **Then** declara que não pode ser embutida em frame, que só deve
   ser acessada por HTTPS (incluindo subdomínios, por 2 anos), que o tipo de conteúdo não deve ser
   adivinhado e uma política de Referer que envia só a origem para outros sites.
2. **Given** uma página do app aberta dentro de um frame em outro site, **When** o navegador tenta
   exibir, **Then** o frame fica bloqueado.
3. **Given** os cabeçalhos ativos, **When** as telas principais são usadas (entrar, grupos, notas
   com foto, convite), **Then** nada quebra.

---

### User Story 5 - Mensagens de erro e imagens não aceitam conteúdo forjado (Priority: P3)

Alguém envia um link do app com `?erro=` contendo um texto inventado ("Sua conta foi bloqueada,
ligue para..."). O app mostra só mensagens que ele mesmo conhece. Imagens vindas da API só são
exibidas se o endereço for HTTPS.

**Why this priority**: não é vulnerabilidade (o texto é escapado e o navegador já bloqueia
esquemas perigosos), mas fecha uma porta de engenharia social com mudança pequena.

**Independent Test**: abrir uma página autenticada com `?erro=` de texto livre e com um código
válido; renderizar foto de nota e avatar com URL `https:`, `http:` e outros esquemas.

**Acceptance Scenarios**:

1. **Given** um link com `?erro=` contendo texto livre (espaços, minúsculas, pontuação ou mais de
   64 caracteres), **When** a página abre, **Then** só a mensagem genérica de erro aparece, sem o
   texto do link.
2. **Given** um link com `?erro=` contendo um código conhecido, **When** a página abre, **Then** a
   mensagem amigável daquele código aparece, como hoje.
3. **Given** um código desconhecido em formato de código (só maiúsculas, dígitos e `_`, até 64
   caracteres), **When** a página abre, **Then** a mensagem genérica aparece junto com o código,
   como hoje.
4. **Given** uma foto de nota ou avatar cuja URL não é `https:` (nem `http:` no próprio computador,
   usado no desenvolvimento), **When** a tela renderiza,
   **Then** a imagem não é carregada e aparece o mesmo substituto de quando não há foto.

---

### Edge Cases

- Sair da conta com a API lenta: a saída local não pode ficar presa esperando indefinidamente; vale
  o mesmo tempo limite das outras chamadas à API.
- Sair da conta com sessão já expirada: a API recusa o encerramento; a pessoa sai normalmente.
- Link de convite aberto sem sessão (vai para entrar com retorno ao convite) e depois login: o
  convite continua sendo aceito após a mascaração do analytics e da URL.
- Recarregar a tela de redefinir senha depois que o token sumiu da barra: a tela não pode perder o
  token já lido enquanto a pessoa preenche o formulário; se ela recarregar, vale o comportamento de
  link sem token já existente.
- URL de imagem malformada (não é endereço válido): tratada como não `https:`.
- API local de desenvolvimento e e2e serve arquivos por `http://localhost`: essas imagens
  continuam aparecendo (só host de loopback; qualquer outro `http:` é recusado).
- A atualização do framework pode mudar comportamento documentado; as notas de versão entre a
  versão atual e a nova devem ser conferidas.

## Requirements *(mandatory)*

### Functional Requirements

**Dependências (#67)**

- **FR-001**: A auditoria de dependências de produção MUST reportar 0 vulnerabilidades críticas e
  0 altas.
- **FR-002**: O framework e sua configuração de lint MUST ficar na mesma versão entre si.
- **FR-003**: Lint, testes unitários, build e testes e2e MUST passar após a atualização.

**Saída da conta (#66)**

- **FR-004**: Ao sair da conta de propósito, o app MUST pedir à API o encerramento da sessão
  antes de apagar a sessão local.
- **FR-005**: Falha, recusa ou tempo esgotado no encerramento remoto MUST NOT impedir a saída local
  nem mudar o destino da pessoa.
- **FR-006**: A rota de saída por link (`/sair`), que só limpa sessões já inválidas, MUST continuar
  sem deslogar por link vindo de outro site.

**Tokens em URL (#65)**

- **FR-007**: Todo evento de analytics e de desempenho MUST ser enviado sem query string e com o
  token de convite do caminho substituído por um marcador fixo, nos campos de URL e de caminho.
- **FR-008**: As telas de redefinir senha e confirmar e-mail MUST remover o token da barra de
  endereço e do histórico logo depois de lê-lo, sem interromper o fluxo.
- **FR-009**: As telas de redefinir senha e confirmar e-mail MUST usar política de Referer que não
  envia nada, igual à tela de convite.

**Cabeçalhos de segurança (#64)**

- **FR-010**: Toda resposta do app MUST proibir ser embutida em frame de qualquer origem, pelos
  dois mecanismos de cabeçalho suportados pelos navegadores (o moderno e o legado).
- **FR-011**: Toda resposta do app MUST exigir HTTPS por 2 anos (63072000 s), incluindo
  subdomínios.
- **FR-012**: Toda resposta do app MUST proibir o navegador de adivinhar o tipo de conteúdo.
- **FR-013**: Toda resposta do app MUST usar a política de Referer "só a origem para outros sites,
  completo no mesmo site", sem afrouxar as páginas que já usam "nenhum Referer".

**Erros e imagens (#68)**

- **FR-014**: Mensagens de erro vindas da URL MUST mostrar o código bruto só se ele tiver de 1 a
  64 caracteres, todos maiúsculas, dígitos ou `_`; caso contrário, só a mensagem genérica.
- **FR-015**: Fotos de nota, avatares e imagens de itens de lista vindas da API MUST ser exibidas
  só se a URL for válida e `https:`, ou `http:` com host de loopback (`localhost`, `127.0.0.1`,
  `[::1]`); caso contrário, aparece o substituto de "sem imagem".
- **FR-016**: Cada regra de FR-007, FR-014 e FR-015 MUST ter teste automatizado que falha se a
  regra quebrar.

### Key Entities

- **Sessão**: identificada pelo token guardado no cookie; existe no navegador e na API. Sair
  encerra as duas.
- **Token de link**: convite (no caminho), redefinição de senha e confirmação de e-mail (na
  query). Dá acesso e não deve aparecer fora do fluxo que o usa.
- **Código de erro**: identificador curto (maiúsculas, dígitos, `_`) que o app traduz em mensagem.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A auditoria de dependências de produção mostra 0 críticas e 0 altas (hoje 1 e 3).
- **SC-002**: Depois de sair da conta, 100% das requisições com o token antigo são recusadas pela
  API em ambiente de teste.
- **SC-003**: Sair da conta continua levando a pessoa à tela de destino em 100% dos casos, inclusive
  com a API fora do ar.
- **SC-004**: Em uma navegação local por convite → entrar → aceitar convite e por redefinir senha
  e confirmar e-mail, 0 eventos de analytics capturados contêm um token.
- **SC-005**: 100% das respostas conferidas (página, rota intermediada da API, arquivo estático)
  trazem os 5 cabeçalhos de segurança.
- **SC-006**: Nenhum texto livre de `?erro=` aparece em página do app; 0 imagens com URL não
  `https:` são carregadas.
- **SC-007**: A suíte e2e existente passa sem alteração de expectativas.
- **SC-008**: As issues #64, #65, #66, #67 e #68 ficam fechadas, e #63 pode ser fechada.

## Assumptions

- Escopo: só os cinco itens com decisão "adotar" na run-2 (#64–#68). O open redirect (#46) e o
  redirect pós-login já foram resolvidos pela spec 022.
- Fora do escopo: o limite de requisições por IP compartilhado entre usuários (continua "precisa
  de validação" e depende da infraestrutura da API); cookie com prefixo `__Host-` (decidido "não
  por enquanto"); confirmação extra para trocar chave Pix (depende da API).
- Política de conteúdo completa (CSP com origens de script/estilo) fica para outra entrega: exige
  inventário de scripts de terceiros e nonces, e o ganho imediato vem do bloqueio de frame.
- A API já oferece o encerramento de sessão e rejeita sessões encerradas (informado em #66).
- O app é servido só por HTTPS em produção e não há subdomínio que precise de HTTP.
- O analytics e o monitoramento de desempenho continuam ativos; só o que é enviado muda.
- A versão nova do framework é da mesma linha principal (16.x), sem mudança que exija migração.
