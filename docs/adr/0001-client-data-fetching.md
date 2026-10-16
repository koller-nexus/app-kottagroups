# ADR 0001 — Busca de dados no cliente (TanStack Query e afins)

- **Status**: Aceito
- **Data**: 2026-10-16
- **Contexto**: issue #14, spec `specs/018-front-performance/`, baseline em
  `specs/018-front-performance/baseline.md`

## Problema

O app busca tudo no servidor (Server Components + Server Actions) e não tem cache entre
requisições. O baseline mostra que o custo vem de **quantas** chamadas cada tela faz, não de
como elas são feitas no cliente. Com 20 grupos:

| Rota | Chamadas à API por visita |
|---|---|
| Painel `/` | 44 (6 com 1 grupo) |
| `/grupos` | 43 |
| `/despesas/nova`, `/notificacoes`, `/grupos/[id]/membros` | 23–24 |

Outros pontos: polling de notas com `router.refresh()` a cada 3 s (recarrega o shell),
toggle de item da lista sem resposta otimista, paginação de notificações por navegação
completa, e 25 de 29 `revalidatePath` invalidando o app inteiro.

## Opções

### A. TanStack Query + BFF

`useQuery`/`useMutation` no cliente, com Route Handlers (`app/api/kotta/*`) lendo o cookie
`HttpOnly` e chamando a API. Prefetch no servidor + `HydrationBoundary` para manter o SSR.

- Bundle: ≈ 13 kB gz a mais em cada rota que usa.
- Complexidade: uma segunda camada de dados (Route Handlers) espelhando `lib/api/kotta.ts`,
  chaves de query e invalidação para manter em sincronia com as Server Actions.
- Segurança: toda rota BFF que muta precisa de proteção CSRF (o cookie vai junto em qualquer
  POST do mesmo site) e precisa reproduzir o tratamento de sessão expirada e e-mail não
  confirmado (spec 016) fora do `apiRequest`.
- Não resolve o N+1: ele está nas chamadas servidor→API, não no cliente.

### B. Cache e streaming do Next 16 (`cacheComponents`, `"use cache"`, `updateTag`)

- `cacheComponents` é uma chave global: muda a renderização de todas as rotas (dados
  dinâmicos passam a exigir `<Suspense>`).
- Os dados são por usuário. Como `cookies()` não pode ser lido dentro de `"use cache"`, o token
  teria de virar argumento (chave de cache). Um erro nessa chave vaza dados entre usuários.
- `updateTag` só funciona com dados tagueados, então depende dessa adoção.

### C. Primitivas que já estão no app (React 19 + App Router) e endpoints agregados

| Caso | Solução |
|---|---|
| N+1 / waterfall | `GET /me/dashboard`, `GET /groups?include=members,balances` (API PR #209) |
| Polling de notas | `GET /api/notas/status` (somente leitura) + timer com backoff, pausa em background e `router.refresh()` só quando o status muda |
| Toggle da lista | `useOptimistic` + `startTransition` |
| Notificações | Nada: a paginação por link é navegação suave e o layout com o shell não re-renderiza |
| Invalidação | `revalidatePath` por rota onde o shell não muda (listas e itens); o resto continua no app inteiro (ver Consequências) |
| Espera pela chamada mais lenta | `<Suspense>` por seção |

- Bundle: nenhuma dependência de dados nova.
- Segurança: a única rota nova é um `GET` somente leitura; as mutations continuam em Server
  Actions, com a proteção de origem do Next.

## Decisão

**Opção C.**

| Biblioteca | Decisão | Motivo |
|---|---|---|
| TanStack Query | **Não adotar** | O problema medido é N+1 no servidor; os 4 casos de estado no cliente cabem nas primitivas acima sem BFF, CSRF extra nem 13 kB por rota. |
| TanStack Virtual | **Não adotar** | Nenhuma lista renderiza mais de ~100 itens visíveis (páginas de 20–100). |
| TanStack Table | **Não adotar** | Não há grade de dados ordenável/filtrável. |
| TanStack Form | **Não adotar** | Os formulários usam `useActionState` com validação no servidor, que já cobre o fluxo, inclusive sem JS. |

`cacheComponents` / `"use cache"` ficam para depois: reavaliar se, com as chamadas já
constantes, os CWV de produção (Speed Insights) ainda mostrarem TTFB alto nas rotas principais.

## Consequências

- Resultado: o Painel foi de 44 para 5 chamadas por visita com 20 grupos. Nova despesa,
  Notificações e Membros foram de 23–24 para 5 (`baseline.md`). JS por rota: no máximo +1,6%.
- Invalidação: no Next 16, o cache de rotas dinâmicas no cliente é 0 s (`staleTimes.dynamic`).
  Cada navegação já busca a página de novo, então restringir `revalidatePath` rende pouco. Além
  disso, o sino do shell conta quitações calculadas a partir dos saldos. Por isso despesas,
  quitações, membros, grupos e perfil continuam invalidando `("/", "layout")`, com o motivo
  comentado no código. Só as actions de listas e itens, que não mexem no shell, ganharam escopo.

- O Painel passa a fazer um nº fixo de chamadas; as demais telas com detalhes de grupos também.
  Números "depois" em `baseline.md`.
- A rota `GET /api/notas/status` é a única leitura feita pelo cliente; ela trata 401 devolvendo
  status (o cliente leva para "sessão expirada") em vez de redirecionar.
- Se os volumes crescerem, o limite de 50 grupos por página com `include` faz `listGroupDetails()`
  paginar (até 10 páginas).

## Quando reabrir

- Surgir estado de servidor compartilhado por muitas telas no cliente (ex.: chat, edição
  colaborativa, atualizações em tempo real além do status de notas).
- Uma lista passar de ~100 itens visíveis e o INP de produção piorar nela (Virtual).
- Os CWV de produção continuarem fora da meta (LCP > 2,5 s, INP > 200 ms) com as chamadas já
  constantes (Opção B).
