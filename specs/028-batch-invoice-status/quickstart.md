# Quickstart: validar o status das notas em lote

## Pré-requisitos

- A API com a spec 095 (PR api#256, `VERSION` 0.19.0 ou maior) rodando localmente ou no ambiente
  de teste.
- Usuário de e2e configurado (`E2E_EMAIL` / `E2E_PASSWORD`).
- `pnpm install` feito.

## Testes automáticos

```bash
pnpm test     # lib/poll-schedule.test.mjs com a tabela do data-model.md
pnpm lint
API_ORIGIN=http://localhost:8085 pnpm test:e2e e2e/notes-notifications.spec.ts
pnpm build
```

Esperado: tudo passa. O teste novo (research R5) confere que um ciclo com duas notas em leitura gera
uma única chamada `/api/v1/invoices/status` e nenhuma `/api/v1/invoices/<id>`.

## Roteiro manual (`pnpm dev`, logado)

1. Envie duas notas num grupo e abra a lista de notas do grupo enquanto as duas estão em leitura.
   - Na aba Network, cada ciclo faz um único `GET /api/notas/status?ids=<id1>,<id2>`, e a resposta é
     `{ "items": [...] }` com as duas notas.
   - No log da API, cada ciclo aparece como um único `GET /api/v1/invoices/status`.
2. Quando as duas terminam de ser lidas, a tela recarrega sozinha e mostra as notas lidas.
3. `curl -i "http://localhost:3000/api/notas/status?ids=abc"` com o cookie da sessão responde 400,
   sem chamada à API.
4. Exclua uma das notas durante a leitura da outra: o acompanhamento continua com a que sobrou.
