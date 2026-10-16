# Quickstart: validar a feature 018

## Pré-requisitos

- `pnpm install`; API apontando para um ambiente com o PR #209 da api-kottagroups (`API_ORIGIN`).
- Conta de teste com e-mail confirmado e, para os cenários de escala, 1 e 20 grupos.

## 1. Contar chamadas à API por visita

```bash
API_TIMING_LOG=1 pnpm dev
```

Abrir `/` e cada rota de grupo. Nos logs, cada visita mostra linhas `[api] #n …`.

| Rota | Esperado |
|---|---|
| `/` (Painel) | maior `#n` = 5, igual com 1 e com 20 grupos |
| `/grupos`, `/grupos/[id]/membros`, `/despesas/nova`, `/notificacoes` | nº de linhas não cresce com o nº de grupos |

## 2. Lista de compras otimista

DevTools → Network → "Slow 4G". Abrir `/grupos/[id]/listas/[listId]` e marcar um item: o
check aparece de imediato. Com a API parada (ou `API_ORIGIN` inválido), marcar: o item volta e a
mensagem aparece. Tocar rápido em 5 itens: estado final = último toque de cada um.

## 3. Notas pendentes

Abrir uma nota em leitura. No Network, só `GET /api/notas/status` aparece, com intervalos de
~3 s, 5 s, depois 10 s; nenhum request de navegação RSC até o status mudar. Trocar de aba: as
consultas param. Ao concluir a leitura, a tela atualiza uma vez.

## 4. Notificações

Em `/notificacoes`, "Carregar mais" anexa itens sem recarregar a página. Sem JS, o link
`?cursor=` continua funcionando.

## 5. Gates

```bash
pnpm lint && pnpm test && pnpm build
pnpm test:e2e
pnpm next experimental-analyze --output   # comparar JS por rota com o baseline (≤ +10%)
```

Lighthouse mobile (4G lento) nas 7 rotas; registrar em `specs/018-front-performance/baseline.md`
e na issue #14. Meta: LCP < 2,5 s e INP < 200 ms, ou melhoria documentada.
