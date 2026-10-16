# Data Model: Performance do front (018)

Sem persistência nova no front. Tipos novos ficam em `lib/api/types.ts`; estados de UI ficam
nos componentes que os usam.

## ApiDashboard (resposta de `GET /me/dashboard`)

| Campo | Tipo | Regra |
|---|---|---|
| `totals.receivesCents` | integer ≥ 0 | a receber do usuário em todos os grupos ativos |
| `totals.owesCents` | integer ≥ 0 | a pagar |
| `monthSpend.currentCents` | integer ≥ 0 | soma das despesas do mês local corrente |
| `monthSpend.previousCents` | integer ≥ 0 | mês anterior |
| `monthSpend.month` | string `YYYY-MM` | mês corrente em `America/Sao_Paulo` |
| `groups[]` | `{ id, name, emoji, netCents, membersCount ≥ 1 }` | só grupos ativos do usuário |
| `recent[]` | `ApiNotification` (máx. 3) | mesma forma e ordem de `GET /notifications?status=all&limit=3` |
| `unpaidCount` | integer ≥ 0 | contagem de não pagas |

Mapeamento para `DashboardView` (função pura em `lib/kotta-view.ts`, testável):
`receivesCents/owesCents ← totals`, `monthSpend ← { currentMonthCents: currentCents, previousMonthCents: previousCents }`,
`groups ← groups[] (membersCount → memberCount, href)`, `recent ← recent[] + mapa de nomes`
(`peopleById(listGroupDetails())`; nome ausente → "Ex-membro").

## ApiGroupDetail em lote

Mesmo tipo existente (`ApiGroupDetail`), agora vindo de `GET /groups?include=members,balances`.
Página de até 50; `listGroupDetails()` segue `nextCursor` até `MAX_PAGES` (10 → até 500 grupos).

## InvoiceStatus (Route Handler `GET /api/notas/status`)

| Campo | Tipo | Regra |
|---|---|---|
| `id` | string | id da nota pedida |
| `status` | status existente da nota | `isInvoicePending(status)` decide se continua consultando |

Transições observadas pelo watcher: `pendente → (lida | falhou)` ⇒ um `router.refresh()` e para.

## Estado do watcher (client, `InvoiceStatusWatcher`)

| Estado | Entrada | Saída |
|---|---|---|
| `polling` | montou com ids pendentes | timeout dispara consulta; intervalo `[3000, 5000, 10000]` ms, fica em 10 s |
| `paused` | `document.hidden === true` | volta a `polling` no `visibilitychange` visível (consulta imediata) |
| `done` | nenhum id pendente | `router.refresh()` uma vez; para |
| `expired` | 10 min desde o início | para; mostra botão "Atualizar" (`router.refresh()` manual) |
| `session-expired` | resposta 401 | navega para `expiredSessionUrl` |

Erros de rede/5xx: mantém o intervalo atual e tenta de novo; não mostra erro a cada falha.

## Item otimista (lista de compras)

`{ id, checked }` sobreposto por `useOptimistic(items, (state, { id, checked }) => …)`.
Confirmado: a renderização seguinte traz o valor do servidor. Erro: a action devolve
`{ ok: false, error }`, o otimista é descartado ao fim da transição e a mensagem aparece junto da lista.

## Constantes nomeadas (Constituição II)

| Nome | Valor | Onde |
|---|---|---|
| `POLL_INTERVALS_MS` | `[3000, 5000, 10000]` | watcher |
| `POLL_MAX_DURATION_MS` | `600000` | watcher |
| `MAX_STATUS_IDS` | `20` | route handler |
| `GROUP_DETAILS_PAGE_LIMIT` | `50` | `lib/api/kotta.ts` (limite da API com `include`) |
