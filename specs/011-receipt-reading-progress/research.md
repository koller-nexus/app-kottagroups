# Research: andamento da leitura da nota

Nenhum item `NEEDS CLARIFICATION` no contexto técnico. Decisões tomadas a partir do código atual:

## 1. Indicador visual

- **Decision**: um `Spinner` próprio: anel de borda (`border-kotta-border` + um lado `border-t-kotta-primary`) com `motion-safe:animate-spin`. Sem movimento, vira um anel estático com o texto ao lado.
- **Rationale**: não existe spinner no projeto; é CSS de uma linha, sem dependência (Princípio I). O texto continua sendo o portador da informação (FR-011).
- **Alternatives**: barra de progresso (rejeitada: o servidor não informa percentual); biblioteca de animação/Lottie (rejeitada: dependência para algo de ~5 linhas); manter o ponto pulsando (rejeitado: é o sinal que o usuário já não percebe).

## 2. Etapas do envio de foto

- **Decision**: estender o que já existe em `ReceiptUploadForm`: `QR_SEARCH_STATUS` já cobre "Procurando QR code…" e "QR code encontrado, enviando…". Falta a etapa "Preparando a foto…" (compressão dentro da action) e o "Enviando a nota…" no caminho OCR. A compressão acontece dentro de `useActionState`, então `pending` já é verdadeiro nela; basta mostrar a mensagem de `pending` com Spinner.
- **Rationale**: nenhum estado novo; `pending` + `search` já cobrem as etapas. O que falta é torná-las visíveis e consistentes.
- **Alternatives**: máquina de estados de envio dedicada (rejeitada: over-engineering para 3 mensagens).

## 3. Atualização automática

- **Decision**: manter `ReceiptStatus` (polling com intervalo crescente e timeout de 2 min) na lista de compras e `AutoRefresh` (3 s) na tela da nota; só mudar o que é exibido. Resultado em ≤ 5 s após terminar, dentro de SC-005.
- **Rationale**: o mecanismo funciona; trocar a fonte (SSE, websocket) exigiria mudar a API.
- **Alternatives**: SSE/websocket (rejeitado: fora do escopo, exige backend).

## 4. "Nota lida" só quando o usuário viu a transição

- **Decision**: em `ReceiptStatus`, guardar se o componente já viu o status pendente (`useState`); ao passar para `done`, mostrar "Nota lida" por alguns segundos e depois esconder. Quem abre a tela já com a nota lida nunca viu pendente, então nada aparece (FR-007).
- **Rationale**: sem persistência, sem dado novo; a regra é uma função pura testável (`readingJustFinished(seenPending, status)`).
- **Alternatives**: guardar em `sessionStorage` (rejeitado: estado fora do componente sem necessidade).

## 5. Itens nas listas de notas

- **Decision**: `InvoiceStatus` mostra o `Spinner` pequeno dentro do selo quando `isInvoicePending(status)`. As listas já são atualizadas pelas telas que as hospedam; nada novo a fazer na lista além disso.
- **Open check (resolvido na implementação)**: confirmar se a página da lista do grupo recarrega sozinha enquanto há nota pendente (FR-010: "atualizar o item sem recarregar"). Se não, incluir `AutoRefresh` condicionado a `isInvoicePending` de qualquer item.

## 6. Anúncio para leitor de tela

- **Decision**: uma região `role="status"` por bloco; texto só muda quando a etapa muda (FR-012). O Spinner em si é `aria-hidden`.
- **Rationale**: evita repetição que um `aria-live` com conteúdo renovado a cada polling causaria.
