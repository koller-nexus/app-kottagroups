# Research: tela de nota com falha

## 1. A tela da captura é a nota do grupo, não o recibo da lista
- **Decision**: tratar `/grupos/[id]/notas/[notaId]` (`ApiInvoice`, `POST /groups/{id}/invoices`).
- **Rationale**: a captura mostra "IMG_0660.jpeg, enviada por você" e a seção "Despesa", que só existem nessa página. A feature 009 (QR, chave, retry) vive em `ReceiptCapture`/`ReceiptRetry`, ligados à lista de compras e a `/shopping-lists/{id}/receipt`.
- **Alternatives**: portar `ReceiptCapture` inteiro para a nota do grupo. Rejeitado: exige `listId` e endpoints de lista.

## 2. Escanear QR direto e "Tentar de novo" não têm suporte na API de notas do grupo
- **Decision**: fora desta entrega; registrar como dependência de backend.
- **Rationale**: o contrato de 008 só tem `POST /groups/{id}/invoices` com `file` multipart. `ApiInvoice` não traz `retry` nem `resolutionPath`; não há rota de retry nem de `qrUrl`/`accessKey`. Construir a UI sem endpoint seria código morto (constituição, princípio I).
- **Alternatives**: (a) ler o QR no aparelho e enviar só a imagem: o QR não chega à API, sem ganho. (b) proxy para o endpoint da lista: a nota não pertence a lista. Ambas rejeitadas.
- **Proposta de contrato** (para o backend, fora do escopo): `POST /groups/{id}/invoices` aceitar JSON `{ qrUrl }` ou `{ accessKey }` e `POST /invoices/{id}/retry` devolver `{ allowed, remaining }` no `DataInvoice`. Quando existir, reaproveitar `QrScanner` e `accessKeyFromQrUrl`.

## 3. Foto com e sem QR code
- **Decision**: um único envio de foto (`InvoiceUploadForm`); a API lê a imagem.
- **Rationale**: o upload do grupo já aceita qualquer foto. A detecção de QR no aparelho (`decodeQrFromFile`) só tem valor se houver endpoint de QR (item 2).

## 4. Quando mostrar "Despesa"
- **Decision**: mostrar se `isInvoiceRead(status)` ou se já há `expenseId`; esconder em `queued`, `processing` e `failed` sem vínculo.
- **Rationale**: vincular exige total e itens lidos; com vínculo existente o usuário precisa poder desfazê-lo (edge case da spec).

## 5. Mensagem sem despesas livres
- **Decision**: em nota lida e sem vínculo, sem despesas livres: uma frase só, "Registre uma despesa neste grupo para vincular esta nota." e omitir "ainda não comprova nenhuma despesa" nesse caso.
- **Rationale**: elimina a contradição observada na captura.
