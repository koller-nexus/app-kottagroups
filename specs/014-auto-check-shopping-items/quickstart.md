# Quickstart: validar os checks automáticos

## Pré-requisitos

- API `../api-kottagroups` rodando com o worker de cruzamento e o modelo de linguagem configurados.
- `pnpm dev` neste repositório e um usuário membro de um grupo.

## Automático

```bash
pnpm test   # lib/receipt.test.mjs cobre awaitingMatches e as mensagens
pnpm lint
pnpm build
```

## Manual (US1)

1. Crie uma lista com 5 itens, 3 deles presentes na nota que você vai enviar.
2. Envie a nota pela lista (foto ou QR code) e **não recarregue a página**.
3. Esperado: "Lendo sua nota…" → "Marcando os itens da lista…" → os 3 itens aparecem com check e
   riscados, o progresso mostra "3 de 5 itens" e então "Nota lida".
4. Toque em **Não** num item encontrado: o check some.
5. Desmarque à mão outro item encontrado e edite o nome de um terceiro item: o desmarcado continua
   desmarcado.
6. Envie uma nota sem nenhum item da lista: o andamento some sozinho após o limite, sem erro.

## US2

Bloqueada pelo backend (research.md R3). Nada a validar nesta entrega.
