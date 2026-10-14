# Feature Specification: Notas dentro do grupo

**Feature Branch**: `008-group-invoices`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "parte de notas é dentro de um grupo para vincular ao grupo ou dispesa, veja no backend, ../api-kottagroups, no swagger"

## Context

Hoje "Notas" é uma área pessoal no menu principal: cada pessoa envia fotos de notas fiscais e vê só as próprias. A nota não pertence a nenhum grupo nem a nenhuma despesa. A única exceção é o comprovante de uma lista de compras, que já nasce ligado à lista (e, portanto, ao grupo dela).

Esta feature move as notas para dentro do grupo: a nota passa a ser um registro do grupo, visível aos membros, e pode ser vinculada a uma despesa específica desse grupo como comprovante.

**Estado do backend (swagger `api-kottagroups/api/openapi.yaml`, verificado em 2026-10-13)**: o envio e a consulta de notas (`/invoices`) são apenas do usuário; a nota não tem campo de grupo nem de despesa, e a despesa não tem campo de nota. Não existe hoje como enviar uma nota para um grupo, listar as notas de um grupo, nem vincular/desvincular nota e despesa. Esta feature depende dessas capacidades no backend (ver Dependencies).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enviar nota dentro do grupo (Priority: P1)

Um membro abre o grupo, vai para a seção de notas e envia a foto de uma nota fiscal. A nota fica registrada no grupo, passa pela leitura automática (estabelecimento, data, itens, total) e aparece na lista de notas do grupo para todos os membros.

**Why this priority**: É a mudança central: sem a nota pertencer ao grupo, nenhum vínculo com despesa faz sentido.

**Independent Test**: Enviar uma foto pela seção de notas de um grupo e confirmar que ela aparece, com status de leitura, na lista de notas desse grupo para outro membro.

**Acceptance Scenarios**:

1. **Given** um membro dentro do grupo "Casa", **When** envia uma foto válida de nota fiscal na seção de notas, **Then** a nota aparece no topo da lista de notas do grupo com status "na fila" ou "lendo".
2. **Given** uma nota do grupo em leitura, **When** a leitura termina, **Then** a lista mostra estabelecimento, data de emissão e total sem a pessoa precisar recarregar manualmente.
3. **Given** outro membro do mesmo grupo, **When** abre a seção de notas, **Then** vê a nota enviada e quem a enviou.
4. **Given** uma pessoa que não é membro do grupo, **When** tenta abrir as notas desse grupo, **Then** não vê nenhuma nota (página não encontrada).

---

### User Story 2 - Vincular nota a uma despesa (Priority: P2)

Ao ver uma nota do grupo, o membro escolhe uma despesa desse grupo para vinculá-la como comprovante. A despesa passa a mostrar a nota, e a nota passa a mostrar a despesa.

**Why this priority**: É o motivo de levar notas para o grupo: provar o que foi gasto em cada despesa.

**Independent Test**: Abrir uma nota do grupo, escolher uma despesa, salvar, e confirmar que a despesa exibe o link para a nota e vice-versa.

**Acceptance Scenarios**:

1. **Given** uma nota do grupo sem despesa, **When** o membro escolhe a despesa "Mercado sábado" e confirma, **Then** a nota mostra "Vinculada a Mercado sábado" e a despesa mostra o link para a nota.
2. **Given** uma nota vinculada, **When** o membro desvincula, **Then** a nota volta a ser apenas do grupo e a despesa deixa de exibir o link.
3. **Given** uma nota vinculada à despesa A, **When** o membro a vincula à despesa B, **Then** ela fica vinculada só a B.
4. **Given** o seletor de despesas, **When** o membro o abre, **Then** só aparecem despesas do mesmo grupo da nota.
5. **Given** total da nota diferente do valor da despesa, **When** o membro vincula, **Then** o vínculo é aceito e a diferença é mostrada como aviso, sem bloquear.

---

### User Story 3 - Anexar nota a partir da despesa (Priority: P3)

Na tela de uma despesa (ou ao criá-la), o membro anexa uma nota: envia uma foto nova ou escolhe uma nota do grupo que ainda não está vinculada.

**Why this priority**: Atalho do fluxo inverso; útil, mas o vínculo já é possível pela nota (US2).

**Independent Test**: Na tela de uma despesa sem nota, enviar uma foto e confirmar que a nota resultante aparece no grupo já vinculada à despesa.

**Acceptance Scenarios**:

1. **Given** uma despesa sem nota, **When** o membro envia uma foto a partir dela, **Then** a nota é criada no grupo já vinculada a essa despesa.
2. **Given** uma despesa sem nota e notas soltas no grupo, **When** o membro escolhe uma delas, **Then** a nota fica vinculada à despesa.

---

### Edge Cases

- Despesa vinculada é excluída: a nota continua no grupo, sem vínculo.
- Grupo arquivado: as notas continuam visíveis; envio e alteração de vínculo ficam indisponíveis, como as demais ações do grupo arquivado.
- Membro que enviou a nota sai do grupo: a nota continua no grupo; o nome dele aparece como nas despesas de ex-membros.
- Leitura falhou ou ficou "precisa revisar": a nota ainda pode ser vinculada; o status fica visível.
- Comprovante de lista de compras: aparece entre as notas do grupo, identificado como vindo da lista.
- Envio duplicado (mesma foto duas vezes): ambas são aceitas; a pessoa pode excluir a sobra.
- Arquivo inválido ou grande demais, limite de envios atingido: mensagem clara do motivo e de como resolver, como já acontece hoje no envio de notas.
- Lista com muitas notas: paginação ("Carregar mais"), mais recentes primeiro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O grupo MUST ter uma seção "Notas" acessível a partir da página do grupo.
- **FR-002**: Membros do grupo MUST poder enviar uma foto de nota fiscal nessa seção; a nota resultante pertence ao grupo.
- **FR-003**: A seção MUST listar as notas do grupo, mais recentes primeiro, com estabelecimento (ou nome do arquivo), data, total quando lido, status de leitura, quem enviou e a despesa vinculada, se houver.
- **FR-004**: A lista e o detalhe MUST atualizar sozinhos enquanto houver nota em leitura.
- **FR-005**: Só membros do grupo MUST ver as notas do grupo; não membros recebem "não encontrado".
- **FR-006**: Membros MUST poder vincular uma nota a uma despesa do mesmo grupo, trocar o vínculo e desvincular.
- **FR-007**: Uma nota MUST estar vinculada a no máximo uma despesa, e uma despesa a no máximo uma nota.
- **FR-008**: O seletor de despesa MUST oferecer apenas despesas do grupo da nota.
- **FR-009**: Ao vincular, se o total lido da nota diferir do valor da despesa, o sistema MUST mostrar a diferença como aviso, sem impedir o vínculo.
- **FR-010**: O detalhe da despesa MUST mostrar a nota vinculada com link para ela; o detalhe da nota MUST mostrar a despesa vinculada com link para ela.
- **FR-011**: Na despesa, membros MUST poder anexar nota enviando foto nova ou escolhendo uma nota sem vínculo do grupo.
- **FR-012**: Comprovantes de listas de compras do grupo MUST aparecer na seção de notas do grupo, identificados como vindos da lista.
- **FR-013**: Em grupo arquivado, envio e mudança de vínculo MUST ficar indisponíveis; a consulta continua.
- **FR-014**: Erros de envio e de vínculo MUST dizer o que aconteceu e como resolver, no tom da interface.
- **FR-015**: A área pessoal "Notas" MUST sair do menu principal; notas existem apenas dentro dos grupos. Notas antigas sem grupo deixam de aparecer no app (não há migração nesta versão).
- **FR-016**: Endereços antigos da área pessoal de notas MUST levar a pessoa à lista de grupos, sem página de erro.

### Key Entities

- **Nota**: nota fiscal enviada por foto (ou comprovante de lista). Pertence a um grupo; tem quem enviou, status de leitura, estabelecimento, data de emissão, itens e total. Opcionalmente vinculada a uma despesa.
- **Grupo**: dono das notas; define quem pode vê-las e alterá-las.
- **Despesa**: gasto do grupo; opcionalmente tem uma nota como comprovante.
- **Vínculo nota–despesa**: relação 1:1 opcional entre uma nota e uma despesa do mesmo grupo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um membro envia uma nota pelo grupo em até 3 toques a partir da página do grupo.
- **SC-002**: Um membro vincula uma nota a uma despesa em menos de 30 segundos.
- **SC-003**: 100% das notas de um grupo são visíveis a todos os membros e a nenhum não membro.
- **SC-004**: A nota vinculada aparece na despesa (e vice-versa) imediatamente após confirmar, sem recarregar a página.
- **SC-005**: Nenhuma despesa fica com mais de uma nota, e nenhuma nota com mais de uma despesa.

## Assumptions

- Qualquer membro do grupo pode enviar notas e alterar vínculos, como já ocorre com despesas; não há permissão extra de administrador.
- Excluir uma nota fica com quem a enviou ou com administradores do grupo.
- Vínculo é 1:1. Várias notas para uma despesa (ex.: compra dividida em duas notas) fica fora desta versão.
- O valor da despesa não é preenchido nem alterado automaticamente pelo total da nota; o aviso de diferença basta.
- Envio por QR code/chave de acesso no grupo segue o mesmo fluxo de foto se o backend suportar; não é escopo novo aqui.
- Regras de arquivo (tipos aceitos, tamanho máximo, limite de envios) são as já existentes.

## Dependencies

- **Backend (`api-kottagroups`)** precisa expor, antes da implementação no app:
  - envio de nota para um grupo e listagem paginada das notas de um grupo, restrita a membros;
  - nota com grupo, quem enviou e despesa vinculada;
  - vincular, trocar e remover o vínculo nota–despesa, validando mesmo grupo e unicidade 1:1;
  - despesa expondo a nota vinculada;
  - comportamento ao excluir despesa (desfaz vínculo) e em grupo arquivado (bloqueia escrita).
- Nada disso existe no swagger atual; recomenda-se uma spec própria no repositório do backend.
