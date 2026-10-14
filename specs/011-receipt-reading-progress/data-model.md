# Data Model

Sem dados novos, sem mudança de API. Esta feature só lê o status que já existe (`ApiInvoiceStatus`: `queued`, `processing`, `done`, `needs_review`, `failed`) e estado local do componente.

## Etapa de envio (estado local, só no aparelho)

| Etapa | Quando | Mensagem |
|-------|--------|----------|
| `preparing` | foto escolhida, comprimindo/enviando pelo formulário (`pending`) | "Preparando a foto…" |
| `searching` | busca de QR no aparelho (`search === "searching"`) | "Procurando QR code…" (já existe) |
| `sending` | QR achado ou envio por chave/QR escaneado (`pending` ou `search === "qr"`) | "Enviando a nota…" |
| ocioso | nenhuma | nada |

## Aviso de leitura (derivado do status)

| Status | Selo/aviso | Texto | Indicador |
|--------|-----------|-------|-----------|
| `queued` | sim | "Na fila para ser lida" + "Pode sair da tela; seguimos lendo." | girando |
| `processing` | sim | "Lendo sua nota…" + "Pode sair da tela; seguimos lendo." | girando |
| tempo esgotado (2 min) | sim | "Está demorando mais que o normal." + "Verificar de novo" | parado |
| `done` visto após pendente | transitório | "Nota lida" | nenhum |
| `done` aberto já pronto | não | — | — |
| `needs_review` | já existe | "Confira alguns itens" | nenhum |
| `failed` | tela da feature 010 | — | nenhum |

## Transição

`pendente → done | needs_review | failed`: o indicador some; só `done` dispara "Nota lida" transitória, e só se o componente estava montado vendo `pendente`.
