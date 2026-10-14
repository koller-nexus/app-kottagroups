# Feature Specification: Corrigir a tela de nota fiscal com leitura falhada

**Feature Branch**: `feature/010-failed-receipt-screen`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "corrija isso" (captura de tela da página "Nota fiscal" de uma foto cuja leitura falhou)

## Contexto

Na captura, a nota "IMG_0660.jpeg" aparece como "Falhou" com a mensagem "Não conseguimos ler esta
nota. Tente uma foto mais nítida e bem iluminada." Logo abaixo, a seção "Despesa" mostra duas frases
que se contradizem na prática: "Esta nota ainda não comprova nenhuma despesa." e "Não há despesas
sem nota neste grupo." A tela não oferece nenhum caminho para resolver a falha, apesar de a mensagem
pedir uma nova foto. O usuário só enxerga "Excluir".

Problemas observados:

1. Não há ação para enviar outra foto (com ou sem QR code) ou escanear o QR code (previsto na feature
   009, história 4).
2. A seção "Despesa" aparece numa nota que não foi lida, onde vincular a uma despesa não faz sentido,
   e as duas mensagens em sequência confundem.
3. Não está claro por que "Tentar de novo" não aparece (nota sem nova tentativa permitida).

## Clarifications

### Session 2026-10-14

- Q: Quais opções de reenvio a tela de falha deve oferecer? → A: Todas as formas de envio já existentes na lista: enviar foto com QR code, enviar foto sem QR code e escanear o QR code direto pela câmera.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saber o que fazer depois de uma falha (Priority: P1)

Quando a leitura falha, a tela mostra, junto da mensagem de erro, as ações para resolver: "Tentar de
novo" quando permitido; quando não for permitido, uma explicação curta e as mesmas opções de envio da lista: "Escanear o QR
code" (câmera, direto), enviar uma foto que tem o QR code e enviar uma foto sem QR code (lida pelo
texto da imagem). O usuário não precisa saber qual das duas fotos é: ao enviar a imagem, a leitura
usa o QR quando ele existe e o texto quando não existe. "Excluir" continua disponível.

**Why this priority**: Hoje a tela é um beco sem saída; a mensagem pede uma nova foto, mas não há
como enviá-la dali.

**Independent Test**: Abrir uma nota com status falhou, sem nova tentativa, e ver as duas ações e a
explicação; abrir uma com nova tentativa e ver "Tentar de novo".

**Acceptance Scenarios**:

1. **Given** uma nota com falha e nova tentativa não permitida, **When** a tela é exibida, **Then**
   aparecem a explicação de que a nota não pode ser lida de novo e as opções "Escanear o QR code" e
   "Enviar foto" (com ou sem QR code).
2. **Given** uma nota com falha e nova tentativa permitida, **When** a tela é exibida, **Then**
   aparece "Tentar de novo" com as tentativas restantes.
3. **Given** a tela de falha, **When** o usuário escaneia o QR code pela câmera, **Then** a nota é
   enviada ao mesmo grupo sem passar por upload de imagem.
4. **Given** a tela de falha, **When** o usuário envia uma foto com QR code, **Then** o QR é lido e a
   nota segue como no escaneamento direto.
5. **Given** a tela de falha, **When** o usuário envia uma foto sem QR code, **Then** a imagem é lida
   pelo texto, como na lista de compras.
6. **Given** a câmera indisponível, **When** o usuário tenta escanear, **Then** a tela orienta a
   enviar uma foto ou digitar a chave de acesso, como na lista.

---

### User Story 2 - Não mostrar "Despesa" numa nota sem leitura (Priority: P1)

A seção "Despesa" (vínculo, troca, mensagens sobre despesas sem nota) só aparece quando a nota foi
lida com sucesso ou precisa de revisão. Em nota na fila, processando ou falhou, a seção não aparece.

**Why this priority**: As mensagens atuais contradizem o estado da nota e induzem a erro.

**Independent Test**: Abrir notas nos estados falhou, na fila e processando e confirmar que não há
seção "Despesa"; abrir uma nota concluída e confirmar que ela continua igual.

**Acceptance Scenarios**:

1. **Given** uma nota com falha, **When** a tela é exibida, **Then** a seção "Despesa" não aparece.
2. **Given** uma nota na fila ou processando, **Then** a seção "Despesa" não aparece.
3. **Given** uma nota concluída ou que precisa de revisão, **Then** a seção "Despesa" aparece como
   hoje.

---

### User Story 3 - Mensagem de despesas sem nota coerente (Priority: P2)

Numa nota lida, quando o grupo não tem despesas sem nota para vincular, a tela diz isso de forma
única e sem repetir a frase de que a nota não comprova despesa: o usuário entende que precisa
registrar uma despesa antes de vincular.

**Why this priority**: Mesmo em nota lida, as duas frases seguidas soam como erro.

**Independent Test**: Abrir uma nota lida e não vinculada, em grupo sem despesas livres, e ler a
mensagem.

**Acceptance Scenarios**:

1. **Given** uma nota lida, sem vínculo, e nenhuma despesa livre no grupo, **When** a tela é
   exibida, **Then** aparece uma única mensagem orientando a registrar uma despesa para vincular.

### Edge Cases

- Grupo arquivado: as ações de enviar foto e escanear QR não aparecem; a explicação e "Excluir"
  continuam.
- Nota que falhou mas já tem despesa vinculada: o vínculo continua visível para quem precisa
  desfazê-lo. [Assumption: considerar mostrar a seção apenas neste caso]
- Mensagem técnica do servidor nunca é exibida; sempre texto próprio em português.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de nota com falha MUST oferecer um caminho de recuperação visível: "Tentar de
  novo" quando permitido; caso contrário, as opções de envio: escanear o QR code pela câmera, enviar
  foto com QR code e enviar foto sem QR code.
- **FR-002**: Quando nova tentativa não é permitida, a tela MUST explicar em uma frase por que a nota
  não pode ser lida de novo.
- **FR-003**: A seção "Despesa" MUST aparecer apenas para notas lidas ou que precisam de revisão, ou
  para nota com falha que já esteja vinculada a uma despesa.
- **FR-004**: Em grupo arquivado, a tela MUST NOT oferecer ações que criam ou enviam notas.
- **FR-007**: As opções de envio na tela de falha MUST se comportar como as da lista de compras
  (mesmas mensagens, mesmo tratamento de câmera indisponível e de QR que não é de nota fiscal).
- **FR-005**: Numa nota lida e não vinculada, a tela MUST mostrar uma única mensagem quando não há
  despesas livres, sem contradizer a mensagem de falta de vínculo.
- **FR-006**: "Excluir" MUST continuar disponível em todos os estados em que está hoje.

### Key Entities

- **Nota fiscal**: status (na fila, processando, concluída, precisa de revisão, falhou), indicação de
  nova tentativa permitida, vínculo opcional com uma despesa.
- **Despesa**: lançamento do grupo que pode ser comprovado por uma nota.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das telas de nota com falha, o usuário vê ao menos uma ação para resolver além
  de "Excluir".
- **SC-002**: Nenhuma tela de nota na fila, processando ou com falha (sem vínculo) mostra a seção
  "Despesa".
- **SC-003**: Um usuário chega ao envio de outra foto ou ao escaneamento do QR code a partir da tela de
  falha em até 2 toques.

## Assumptions

- A feature 009 já define "Tentar de novo" e as mensagens de recusa; esta spec só cobre o que falta
  na tela de falha e a seção "Despesa".
- A captura mostra o caso "nova tentativa não permitida"; a razão exata não aparece na tela.
- O pedido "corrija isso" foi interpretado como os três problemas listados no Contexto; confirmar se
  havia outro ponto específico na captura.
- As opções de envio (escanear QR, foto com QR, foto sem QR) são os fluxos já existentes na lista de
  compras do grupo; a digitação da chave de acesso continua só como alternativa quando a câmera falha.
- O reenvio cria uma nova nota; a nota que falhou continua podendo ser excluída.
