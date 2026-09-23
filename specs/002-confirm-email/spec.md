# Feature Specification: Confirm Email

**Feature Branch**: `002-confirm-email`

**Created**: 2026-09-23

**Status**: Ready for implementation

**Input**: User description: "Criar a tela de confirmação de e-mail usada pelo link enviado após o cadastro no backend, em `/confirm-email?token=<token>`, chamando `POST /api/v1/auth/confirm-email` e tratando sucesso, token ausente/inválido/expirado/já utilizado e erros inesperados."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Confirmar a conta pelo link recebido (Priority: P1)

Como uma pessoa que acabou de se cadastrar, quero abrir o link recebido por e-mail e confirmar minha conta automaticamente, para começar a usar o Kotta Groups sem repetir dados.

**Why this priority**: A confirmação é o passo necessário para concluir o cadastro.

**Independent Test**: Abrir uma URL com um token válido e verificar que a tela chama o endpoint e mostra a confirmação de conta.

**Acceptance Scenarios**:

1. **Given** uma URL com `token` e um token válido, **When** a tela é aberta, **Then** o token é enviado no corpo da requisição de confirmação sem aparecer na interface ou em logs.
2. **Given** uma resposta de sucesso do serviço, **When** a confirmação termina, **Then** a tela informa que a conta foi confirmada e oferece voltar ao início, sem apontar para login.

### User Story 2 - Recuperar falhas de confirmação (Priority: P1)

Como uma pessoa com um link inválido, expirado ou já utilizado, quero entender o que aconteceu e saber o próximo passo, para conseguir entrar ou solicitar um novo link.

**Why this priority**: Falhas esperadas precisam ser recuperáveis e não podem deixar o usuário sem orientação.

**Independent Test**: Abrir sem token e simular respostas de erro do serviço, verificando mensagens amigáveis e ações de recuperação.

**Acceptance Scenarios**:

1. **Given** uma URL sem token, **When** a tela é aberta, **Then** nenhuma requisição é feita e a tela informa que o link não é válido, oferecendo uma ação de recuperação.
2. **Given** uma resposta que indica token inválido, expirado ou já utilizado, **When** a confirmação termina, **Then** a tela apresenta o texto de erro fornecido pelo serviço quando disponível, sem expor o token, e oferece uma ação de recuperação.
3. **Given** uma falha inesperada de rede ou serviço, **When** a confirmação termina, **Then** a tela mostra uma mensagem genérica útil e permite tentar novamente.

### User Story 3 - Acompanhar o processamento (Priority: P2)

Como uma pessoa que abriu o link, quero saber que a confirmação está sendo processada, para não repetir a ação ou interpretar a espera como erro.

**Why this priority**: Feedback imediato reduz incerteza durante a chamada ao serviço.

**Independent Test**: Manter a resposta pendente e verificar que a tela mostra carregamento sem ações conflitantes.

**Acceptance Scenarios**:

1. **Given** uma confirmação em andamento, **When** a tela aguarda o serviço, **Then** a tela mostra um estado de carregamento claro e não inicia chamadas duplicadas.

### Edge Cases

- O parâmetro `token` existe, mas está vazio ou contém apenas espaços; tratar como ausente.
- O usuário atualiza a página ou abre novamente o mesmo link; o token deve ser lido da URL novamente e enviado sem ser armazenado ou removido pela interface.
- O serviço devolve uma resposta sem JSON ou sem uma mensagem legível; usar a mensagem genérica de erro.
- O usuário seleciona uma ação de recuperação após uma falha; o destino deve ser claro e não incluir o token.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST disponibilizar a rota pública `/confirm-email` e aceitar links com o parâmetro de consulta `token`.
- **FR-002**: O sistema MUST ler o token atual da URL quando a tela carregar ou for atualizada.
- **FR-003**: Quando houver um token não vazio, o sistema MUST enviar uma requisição `POST /api/v1/auth/confirm-email` com `{ "token": "<token>" }` no corpo.
- **FR-004**: O sistema MUST exibir estados distintos de carregamento, sucesso, token ausente, token inválido/expirado/já utilizado e erro inesperado.
- **FR-005**: A mensagem para falhas esperadas MUST respeitar o envelope e o texto retornados pelo serviço quando esses dados estiverem disponíveis.
- **FR-006**: Após uma confirmação bem-sucedida, o sistema MUST orientar o uso do app e oferecer uma ação para voltar ao início. O sistema MUST NOT apontar para `/login`.
- **FR-007**: Após uma falha inesperada, o sistema MUST oferecer tentar novamente. Falhas de token ausente, inválido, expirado ou já utilizado MUST explicar o ocorrido sem CTA de login.
- **FR-008**: O sistema MUST NOT registrar, renderizar ou incluir o token em mensagens, analytics ou logs do cliente.
- **FR-009**: A tela MUST permanecer utilizável por teclado, leitores de tela e telas estreitas, com estados comunicados semanticamente.

### Key Entities

- **Confirmation token**: Valor temporário presente na URL e enviado apenas ao serviço de confirmação.
- **Confirmation result**: Resultado público do serviço, representando sucesso ou uma falha esperada/inesperada e sua mensagem segura para o usuário.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos links válidos testados confirmam a conta sem exigir uma segunda ação além de abrir o link.
- **SC-002**: 100% dos casos de token ausente, inválido, expirado ou já utilizado exibem uma orientação de recuperação compreensível.
- **SC-003**: A tela apresenta feedback de carregamento imediatamente após a abertura do link, sem iniciar chamadas duplicadas durante uma mesma tentativa.
- **SC-004**: Em testes de teclado e leitor de tela, as ações existentes (início, tentar novamente) são identificáveis e acionáveis.
- **SC-005**: O token nunca aparece no texto visível da tela, nos destinos de navegação ou nos registros produzidos pelo fluxo.

## Assumptions

- O browser chama o caminho relativo `/api/v1/auth/confirm-email`. Em produção esse caminho é reescrito para `https://api.kottagroups.com.br/api/v1/...` (origem configurável via `API_ORIGIN`), porque a API não está no mesmo host da landing e não libera CORS para o domínio público.
- O serviço pode devolver mensagens em envelopes de erro; a interface usará a mensagem segura retornada quando ela estiver disponível.
- Não existe tela de login neste site; o acesso autenticado acontece no app.
- A confirmação é uma ação pública e não exige sessão previamente autenticada.
- O fluxo não cria um novo formulário de cadastro ou reenvio de e-mail nesta entrega.
