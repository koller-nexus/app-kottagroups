# Feature Specification: Mostrar o andamento da leitura da nota fiscal

**Feature Branch**: `feature/011-receipt-reading-progress`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "ao ler a nota fiscal, vamos colocar um loading ou alguma interação para usuario saber que estamos processando"

## Contexto

Ler uma nota fiscal leva de alguns segundos a mais de um minuto, em etapas: preparar a foto, procurar o QR code, enviar, e depois a nota entra na fila e é lida no servidor. Hoje o usuário só recebe sinais pequenos e inconsistentes:

- Ao enviar uma foto, o botão muda de texto e mais nada indica que o app está trabalhando (compressão da foto e busca do QR code não mostram nada).
- Depois do envio, a nota aparece com um ponto verde pulsando e "Lendo sua nota…", fácil de não notar.
- Em listas e telas de nota, o status "Na fila" / "Processando" é só um selo de texto.
- Se a leitura demora, o usuário não sabe se deve esperar, sair ou tentar de novo.

O resultado é a dúvida "travou?", que leva a toques repetidos, envios duplicados e abandono da tela.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver que o envio da nota está em andamento (Priority: P1)

Desde o momento em que o usuário escolhe uma foto, escaneia o QR code ou digita a chave, a tela mostra um indicador de progresso visível, com texto que diz o que está acontecendo ("Preparando a foto…", "Procurando o QR code…", "Enviando a nota…"). Os botões de envio ficam desativados enquanto isso, para evitar envio duplicado.

**Why this priority**: É o primeiro momento de silêncio; sem isso o usuário toca de novo e duplica a nota.

**Independent Test**: Escolher uma foto grande e observar que o indicador aparece de imediato e muda de mensagem até a nota ser enviada; repetir com QR code escaneado e com chave digitada.

**Acceptance Scenarios**:

1. **Given** o usuário escolheu uma foto, **When** a foto está sendo preparada, **Then** um indicador visível e a mensagem "Preparando a foto…" aparecem em até 200 ms.
2. **Given** a busca de QR code na foto, **When** ela está em andamento, **Then** a mensagem passa a "Procurando o QR code…".
3. **Given** o envio em andamento (foto, QR code ou chave), **When** o usuário olha a tela, **Then** vê "Enviando a nota…" com o indicador, e todos os botões de envio estão desativados.
4. **Given** o envio terminou com sucesso, **When** a nota é criada, **Then** o indicador de envio some e a tela passa ao acompanhamento da leitura (história 2) sem tela em branco no meio.
5. **Given** o envio falhou, **When** o erro chega, **Then** o indicador some, o erro aparece e os botões voltam a ficar ativos.

---

### User Story 2 - Acompanhar a leitura enquanto a nota é processada (Priority: P1)

Com a nota na fila ou sendo lida, a tela de nota e a lista mostram um aviso de progresso bem visível: indicador animado, texto claro ("Na fila" / "Lendo sua nota…") e uma frase tranquilizando que o usuário pode sair da tela, porque a nota continua sendo lida e o resultado aparece quando ele voltar. Quando a leitura termina, o resultado aparece sozinho, com uma confirmação curta ("Nota lida").

**Why this priority**: É o trecho mais longo da espera, onde a dúvida "travou?" é maior.

**Independent Test**: Enviar uma nota e acompanhar a tela até terminar: indicador visível durante toda a espera, mensagem de que pode sair, e confirmação ao concluir sem recarregar a página.

**Acceptance Scenarios**:

1. **Given** uma nota na fila, **When** a tela é exibida, **Then** aparecem o indicador animado e "Na fila para ser lida".
2. **Given** uma nota em processamento, **When** a tela é exibida, **Then** aparecem o indicador animado, "Lendo sua nota…" e a informação de que pode sair da tela.
3. **Given** a nota está sendo lida, **When** a leitura termina com sucesso, **Then** a tela troca o aviso por "Nota lida" e mostra os itens, sem o usuário recarregar.
4. **Given** a nota está sendo lida, **When** a leitura termina com falha, **Then** o aviso de progresso some e a tela de falha (feature 010) aparece.
5. **Given** a leitura passa de 2 minutos, **When** o tempo acaba, **Then** o indicador para, o texto explica que está demorando mais que o normal e oferece "Verificar de novo" (comportamento atual, mantido).
6. **Given** uma nota lida há pouco que o usuário reabre depois, **When** a tela abre, **Then** nenhum aviso de progresso nem de "Nota lida" aparece.

---

### User Story 3 - Perceber o andamento também nas listas (Priority: P2)

Nas listas de notas (do grupo e da lista de compras), notas na fila ou em leitura mostram um indicador de progresso no próprio item, no lugar de só um selo de texto. Quando a nota termina, o indicador dá lugar ao status final.

**Why this priority**: Ajuda quem sai da tela da nota e volta à lista, mas a espera principal já é coberta pelas histórias 1 e 2.

**Independent Test**: Com uma nota em leitura, abrir a lista e ver o indicador no item; esperar terminar e ver o status final no lugar.

**Acceptance Scenarios**:

1. **Given** uma lista com notas na fila ou em leitura, **When** a lista é exibida, **Then** esses itens mostram indicador de progresso junto do status.
2. **Given** uma nota em leitura na lista, **When** a leitura termina, **Then** o item passa a mostrar o status final sem recarregar a página.

---

### Edge Cases

- Usuário com preferência de movimento reduzido: o indicador não anima, mas continua visível e com texto.
- Leitor de tela: cada mudança de mensagem de progresso é anunciada como status, sem repetir a mesma frase a cada atualização.
- Usuário toca duas vezes em enviar: o segundo toque não faz nada enquanto o envio está em andamento.
- A busca de QR code passa do tempo limite e a foto segue para a leitura pelo texto: a mensagem avança para o envio, sem erro visível.
- Perda de conexão durante a espera: a tela mantém o aviso de progresso e volta a verificar quando a conexão volta; não mostra falha só porque uma verificação falhou.
- Várias notas em leitura ao mesmo tempo: cada uma mostra seu próprio indicador.
- O usuário sai da tela e volta com a nota ainda em leitura: o aviso reaparece de imediato.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST mostrar um indicador de progresso visível e uma mensagem de texto desde o instante em que o usuário inicia o envio de uma nota (foto, QR code escaneado ou chave digitada).
- **FR-002**: O sistema MUST usar mensagens distintas para as etapas do envio: preparar a foto, procurar o QR code e enviar a nota.
- **FR-003**: O sistema MUST desativar todas as ações de envio enquanto um envio está em andamento.
- **FR-004**: O sistema MUST mostrar, para notas na fila ou em leitura, um aviso de progresso com indicador animado e texto que diferencie "Na fila" de "Lendo sua nota…".
- **FR-005**: O aviso de progresso MUST informar que o usuário pode sair da tela e que a leitura continua.
- **FR-006**: O sistema MUST atualizar a tela sozinho quando a leitura termina, trocando o aviso pelo resultado, sem exigir recarga manual.
- **FR-007**: O sistema MUST confirmar a conclusão com "Nota lida" apenas quando o usuário presenciou a transição de leitura em andamento para concluída; ao reabrir uma nota já lida, não mostra a confirmação.
- **FR-008**: Em falha de envio ou de leitura, o sistema MUST remover o indicador de progresso e mostrar o erro ou a tela de falha, com as ações já definidas.
- **FR-009**: O sistema MUST manter o comportamento atual de tempo limite (2 minutos), mudando o texto para indicar que a leitura está demorando mais que o normal, parando a animação e oferecendo "Verificar de novo".
- **FR-010**: As listas de notas MUST mostrar indicador de progresso nos itens na fila ou em leitura e atualizar o item para o status final quando terminar.
- **FR-011**: Os indicadores MUST respeitar a preferência de movimento reduzido, mantendo texto e forma visíveis sem animação.
- **FR-012**: Mudanças de mensagem de progresso MUST ser anunciadas por leitores de tela como status, sem repetição da mesma mensagem.
- **FR-013**: Todo texto novo MUST estar em português do Brasil e seguir o visual de `DESIGN.md` e `lib/theme.ts`.

### Key Entities

- **Etapa de envio**: momento do envio em andamento no aparelho do usuário (preparar foto, procurar QR code, enviar); existe só enquanto o envio dura.
- **Status da nota**: já existente (na fila, processando, lida, precisa de revisão, falhou); esta feature só muda como ele é comunicado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos envios de nota, um indicador de progresso com texto aparece em até 200 ms após o usuário iniciar a ação.
- **SC-002**: Em 100% do tempo em que uma nota está na fila ou em leitura, há um aviso de progresso visível na tela da nota.
- **SC-003**: Envios duplicados da mesma nota por toque repetido durante o envio caem para zero.
- **SC-004**: Em um teste com pelo menos 5 pessoas, 90% dizem corretamente, sem ajuda, se o app está trabalhando ou parado durante a leitura.
- **SC-005**: Quando a leitura termina com a tela aberta, o resultado aparece em até 6 segundos, sem ação do usuário.
- **SC-006**: Todos os indicadores continuam compreensíveis, só por texto e forma, com movimento reduzido ativado.

## Assumptions

- O tempo de leitura no servidor e a lógica de verificação periódica não mudam; a feature só melhora o que o usuário vê.
- O envio por foto, QR code e chave e a tela de falha (features 004, 009 e 010) permanecem como estão.
- Não haverá barra de porcentagem: o servidor não informa progresso numérico, então o indicador é contínuo, sem prometer duração.
- A confirmação "Nota lida" é transitória (some sozinha ou ao navegar) e não é guardada.
- O escopo cobre a web do Kotta Groups; notificações fora do app (push ou e-mail ao terminar) ficam de fora.
- Os selos de status já existentes continuam, e o indicador de progresso é adicionado a eles.
