# Data Model: Marcar como comprado, sozinho, o que veio na nota

Nenhuma entidade nova e nenhum campo novo. Tudo já vem de `GET /shopping-lists/{id}` e
`GET /shopping-lists/{id}/receipt` (tipos em `lib/api/types.ts`).

## Campos usados

| Entidade | Campo | Uso nesta feature |
|----------|-------|-------------------|
| `ApiShoppingItem` | `completed` | Check de comprado. Gravado pelo backend no cruzamento (R1). |
| `ApiShoppingItem` | `match` | Estado da correspondência (`matched`/`confirmed` = encontrado, `needs_review` = "confere?"). |
| `ApiShoppingReceipt` | `status` | `queued`/`processing` = lendo; `done`/`needs_review` = lida. |
| `ApiShoppingReceipt` | `items` | Linhas lidas da nota. |
| `ApiShoppingReceipt` | `matches` | Correspondências; vazio logo após a leitura (R2). |

## Estado derivado (web)

`awaitingMatches` (novo, puro, em `lib/receipt.ts`):

```text
nota lida (done | needs_review)
  AND receipt.items.length > 0
  AND receipt.matches.length === 0
  AND existe item da lista com completed === false
```

## Transições do andamento na lista

```text
queued → processing → [lida, sem correspondências] → [lida, com correspondências]
   └──── polling ────┘          └──── polling ────┘       fim: checks visíveis
```

Se o limite de tempo acabar em "lida, sem correspondências", o polling para sem aviso (R2,
known ceiling).

## Regras do check (backend, só refletidas na web)

| Evento | Check do item |
|--------|---------------|
| Cruzamento `matched` em item pendente | marca (`completedByMatch`) |
| Cruzamento `needs_review` | não muda |
| **Sim** (`confirmed`) | marca |
| **Não** (`rejected`) | desmarca só se foi a nota que marcou |
| Toque manual | vale a escolha; releitura não desfaz |
