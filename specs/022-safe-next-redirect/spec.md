# Feature Specification: Destino de retorno ("next") nunca leva para outro site

**Feature Branch**: `feature/022-safe-next-redirect`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "https://github.com/koller-nexus/app-kottagroups/issues/46"

## Contexto

Várias telas e ações guardam "para onde a pessoa ia" num parâmetro `next` (ou `returnTo`) e, no
fim do fluxo, mandam a pessoa para lá: sair (`/sair`), entrar, cadastrar, confirmar e-mail, sessão
expirada e os formulários de nota fiscal. Antes de usar esse destino, o app confere que ele é um
caminho interno.

A auditoria de segurança (#10, run-1, confirmada de novo na run-2) mostrou que essa conferência
olha só o começo do texto. Um destino como `/<TAB>/evil.example` passa, mas o navegador e o
servidor descartam TAB, quebra de linha e retorno de carro ao interpretar o endereço, e ele vira
`//evil.example`, isto é, outro site. Um link `https://<app>/sair?next=/%09/evil.example` aberto
por quem está logado responde com um redirecionamento para `https://evil.example/`. O mesmo vale
para `/.//x`, `/..//x` e `/%2e//x`, que se normalizam para `//x`.

Impacto: o domínio confiável do app serve de trampolim para uma página do atacante (phishing).
Nenhum token ou cookie chega ao atacante. Severidade baixa (probabilidade média, impacto baixo).

A mesma conferência é usada depois do login (`loginAction`, `checkConfirmationAction`, página
"confirme seu e-mail"); essa variante está como "precisa de validação" na auditoria e é fechada
pela mesma correção.

Issue de origem: koller-nexus/app-kottagroups#46 (fingerprints
`006/safe-next-ascii-whitespace-open-redirect` e `006/safe-next-login-action-redirect-variant`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Link malicioso para /sair não leva a outro site (Priority: P1)

Uma pessoa logada recebe um link do app que parece legítimo, mas carrega um destino disfarçado
(`/sair?next=/%09/evil.example`). Ao abrir, ela continua no Kotta Groups (página inicial), nunca é
levada para o site do atacante.

**Why this priority**: é o caminho confirmado pela auditoria, explorável hoje só com um link.

**Independent Test**: logado, abrir `/sair?next=/%09/evil.example` (e as variantes com `%0A`,
`%0D`, `/%09%5Cevil.example`, `/.//evil.example`) e verificar que o redirecionamento aponta para
uma página do próprio app.

**Acceptance Scenarios**:

1. **Given** a pessoa está logada, **When** abre `/sair?next=/%09/evil.example`, **Then** é
   redirecionada para uma página do próprio app (a inicial), nunca para `evil.example`.
2. **Given** a pessoa está logada, **When** abre `/sair` com um destino que se normaliza para
   outro site (`/.//x`, `/..//x`, `/%2e//x`), **Then** é redirecionada para a página inicial do app.
3. **Given** a pessoa não está logada, **When** abre o mesmo link, **Then** vai para a tela de
   entrar sem carregar o destino disfarçado, e depois de entrar fica no app.

---

### User Story 2 - Depois de entrar, a pessoa nunca é mandada para outro site (Priority: P1)

Alguém manda um link `/entrar?next=/%09/evil.example`. A pessoa entra com e-mail e senha (ou
confirma o e-mail) e cai numa página do próprio app.

**Why this priority**: é a variante pós-login da mesma falha; a correção é a mesma e precisa
valer para todos os pontos que usam o destino.

**Independent Test**: abrir `/entrar?next=/%09/evil.example`, entrar com uma conta de teste e
verificar que o destino final é a página inicial do app. Repetir em `/cadastrar`,
`/confirme-seu-email` e `/sessao-expirada`.

**Acceptance Scenarios**:

1. **Given** a tela de entrar foi aberta com um destino disfarçado, **When** a pessoa entra,
   **Then** vai para a página inicial do app.
2. **Given** a página "confirme seu e-mail" foi aberta com um destino disfarçado, **When** o
   e-mail já está confirmado, **Then** a pessoa vai para a página inicial do app.
3. **Given** um formulário de nota fiscal recebe um `returnTo` disfarçado, **When** a ação
   termina, **Then** a pessoa volta para a página da nota (o destino padrão daquela ação).

---

### User Story 3 - Destinos internos legítimos continuam funcionando (Priority: P1)

Quem chegou ao login a partir de um convite, de um grupo ou de um formulário perdido por sessão
expirada volta exatamente para onde estava, com os parâmetros e a âncora da página.

**Why this priority**: a correção não pode quebrar o retorno a convites e formulários, que é o
motivo de o destino existir.

**Independent Test**: abrir `/entrar?next=/grupos/abc?aba=membros%23topo`, entrar e verificar que
o destino final é `/grupos/abc?aba=membros#topo`.

**Acceptance Scenarios**:

1. **Given** o destino é `/grupos/abc`, **When** a pessoa termina o fluxo, **Then** vai para
   `/grupos/abc`.
2. **Given** o destino tem parâmetros e âncora (`/convites/x?origem=link#aceitar`), **When** a
   pessoa termina o fluxo, **Then** os parâmetros e a âncora são mantidos.
3. **Given** a sessão expirou durante um envio, **When** a pessoa entra de novo, **Then** volta
   para a página do formulário com o aviso de envio perdido, como hoje.

---

### Edge Cases

- Destino com caracteres de controle em qualquer posição (TAB, LF, CR, outros de 0x00 a 0x1F) ou
  DEL (0x7F): rejeitado, vai para o destino padrão.
- Destino com barra invertida (`\`) em qualquer posição: rejeitado (navegadores tratam `\` como
  `/`).
- Destino que, depois de resolvido, começa com `//`: rejeitado, mesmo que tenha começado com uma
  única barra.
- Destino com endereço completo (`https://...`), começando com `//` ou sem barra inicial:
  rejeitado, como hoje.
- Destino vazio, ausente, repetido (lista) ou que não é texto: destino padrão, como hoje.
- Destino com `..` que fica dentro do app (`/grupos/../perfil`): aceito, normalizado para
  `/perfil`.
- Cada ponto de uso tem seu destino padrão (página inicial; página da nota nos formulários de
  nota); a rejeição sempre cai nele, sem mensagem de erro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O app MUST aceitar como destino de retorno apenas caminhos que, interpretados como
  endereço, permanecem no próprio app.
- **FR-002**: O app MUST rejeitar destinos que contenham caracteres de controle (0x00–0x1F), DEL
  (0x7F) ou barra invertida em qualquer posição.
- **FR-003**: O app MUST rejeitar destinos cujo caminho normalizado comece com `//`.
- **FR-004**: Quando aceito, o destino MUST ser devolvido na forma normalizada, preservando
  caminho, parâmetros e âncora.
- **FR-005**: Quando rejeitado, o destino MUST ser substituído pelo destino padrão do ponto de uso,
  sem erro visível para a pessoa.
- **FR-006**: A regra MUST valer igual para todos os pontos que usam o destino de retorno: sair,
  entrar, cadastrar, confirmar e-mail, sessão expirada, ações de autenticação, redirecionamentos de
  sessão no servidor e formulários de nota fiscal. A conferência fica num único lugar.
- **FR-007**: Os casos de regressão da auditoria MUST ser cobertos por testes automatizados:
  `/\t/x`, `/\n/x`, `/\r/x`, `/\t\x`, `/.//x`, `/..//x`, `/%2e//x`, além dos casos já testados
  (endereço completo, `//x`, `/\x`, valor ausente) e de um destino interno com parâmetros e âncora.

### Key Entities

- **Destino de retorno**: texto vindo da URL ou de um formulário que diz para onde a pessoa vai no
  fim de um fluxo. Ou é um caminho interno do app (com parâmetros e âncora opcionais), ou é
  descartado em favor do destino padrão do ponto de uso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 dos destinos de ataque listados na auditoria (FR-007) resulta em redirecionamento
  para fora do app, em qualquer ponto de uso.
- **SC-002**: 100% dos destinos internos legítimos testados (caminho simples, com parâmetros, com
  âncora, com aviso de envio perdido) levam exatamente à mesma página que levam hoje.
- **SC-003**: A suíte de testes do projeto passa, incluindo os novos casos de regressão.
- **SC-004**: A reauditoria do item `006/safe-next-ascii-whitespace-open-redirect` e da variante
  pós-login retorna "corrigido".

## Assumptions

- A correção é só no front: a API não decide esses redirecionamentos (a run-9 da API não tem
  lógica equivalente).
- Nenhum destino legítimo do app contém caracteres de controle, barra invertida ou começa com
  `//`; rejeitá-los não afeta fluxos reais.
- O comportamento de `/sair` (só limpar a sessão quando a API confirma que o token não vale) não
  muda; muda apenas qual destino é aceito.
- Não há mensagem nem registro para destinos rejeitados; cair no destino padrão em silêncio é o
  comportamento atual e continua.
