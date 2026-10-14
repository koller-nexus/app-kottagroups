# UI Contract: andamento da nota na lista

Componente: `components/receipt/receipt-status.tsx`, usado em
`app/(conta)/grupos/[id]/listas/[listId]/page.tsx` (`ReceiptArea`).

## Entrada

| Prop | Tipo | Origem |
|------|------|--------|
| `status` | `ApiInvoiceStatus` | `receipt.status` (já existe) |
| `awaitingMatches` | `boolean` | `awaitingMatches(receipt, list.items)` de `lib/receipt.ts` (novo) |

## Comportamento

| Situação | Mensagem (`role="status"`) | Recarrega dados |
|----------|---------------------------|-----------------|
| `queued` | "Na fila para ser lida" | sim |
| `processing` | "Lendo sua nota…" | sim |
| lida e `awaitingMatches` | "Marcando os itens da lista…" | sim |
| lida, correspondências chegaram, viu o andamento | "Nota lida" (some em 4 s) | não |
| `needs_review` sem andamento visto | "Confira alguns itens" | não |
| limite de tempo durante a leitura | "Está demorando mais que o normal." + "Verificar de novo" | não |
| limite de tempo em `awaitingMatches` | nada | não |

"Nota lida" só aparece depois que os checks já estão na tela.

## API consumida

Sem mudança: `GET /shopping-lists/{id}` e `GET /shopping-lists/{id}/receipt`, chamados pela página
a cada `router.refresh()`.
