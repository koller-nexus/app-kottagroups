# UI contract: `/grupos/[id]/notas/[notaId]`

| Estado da nota | Mensagem de status | Recuperação (envio de foto) | Seção "Despesa" | Excluir |
|----------------|--------------------|-----------------------------|-----------------|---------|
| `queued`/`processing` | "Estamos lendo a nota…" | não | não | não (hoje) |
| `failed`, sem vínculo, grupo ativo | erro em português | sim, com explicação | não | sim (hoje) |
| `failed`, com vínculo | erro em português | sim | sim (para desvincular) | sim (hoje) |
| `failed`, grupo arquivado | erro em português | não | só se vinculada, sem ações de edição | conforme hoje |
| `done`/`needs_review` | — | não | sim | sim (hoje) |

Texto da recuperação: "Esta nota não pode ser lida de novo. Envie outra foto." seguido do formulário
"Foto da nota" / "Enviar nota". Nenhuma rota, action ou endpoint novo.
