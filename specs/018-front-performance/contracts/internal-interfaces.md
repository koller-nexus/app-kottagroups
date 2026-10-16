# Contracts: Performance do front (018)

## 1. API consumida (koller-nexus/api-kottagroups, PR #209)

Fonte da verdade: `api-kottagroups/specs/069-dashboard-aggregates/contracts/openapi-changes.md`.

| Chamada | Uso no front |
|---|---|
| `GET /api/v1/me/dashboard` | `getDashboard()` — Painel |
| `GET /api/v1/groups?include=members,balances&limit=50&cursor=` | `listGroupDetails()` — Painel (nomes), Grupos, Membros, Nova despesa, Notificações |
| `GET /api/v1/groups/:id/expenses?since=&until=` | disponível; nenhum chamador após remover `listExpensesSince` |

Erros seguem o envelope existente, tratado por `apiRequest` (401 → sessão expirada; 403
`EMAIL_NOT_CONFIRMED` → confirmar e-mail).

## 2. Route Handler: `GET /api/notas/status`

Arquivo: `app/api/notas/status/route.ts`. Somente leitura, mesmo domínio, autenticado pelo cookie da sessão.

Request: `?ids=<id>,<id>` — 1 a `MAX_STATUS_IDS` (20) ids, cada um casando o formato de id da API.

| Status | Corpo | Quando |
|---|---|---|
| `200` | `{ "items": [{ "id": "…", "status": "…" }] }` | ids válidos; nota inexistente/sem acesso é omitida |
| `400` | `{ "error": "Invalid ids" }` | vazio, mais de 20 ou formato inválido |
| `401` | `{ "error": "Session expired" }` | sem cookie de sessão |
| `307` | — | token recusado pela API: o `apiRequest` redireciona como no resto do app; o cliente (com `redirect: "manual"`) recarrega a página, que segue o fluxo de sessão expirada |
| `503` | `{ "error": "Service unavailable" }` | rede/5xx da API |

`Cache-Control: no-store`.

## 3. Server Actions alteradas/novas

| Action | Antes | Depois |
|---|---|---|
| `toggleShoppingItemAction(formData)` | `Promise<void>`, `revalidatePath("/", "layout")` | `Promise<{ ok: true } \| { ok: false; error: string }>`, revalida só a rota da lista |
| actions de listas/itens em `app/actions/shopping.ts` | `revalidatePath("/", "layout")` | `/grupos/[id]/listas/[listId]` e `/grupos/[id]` (páginas); notas da lista: `/grupos/[id]` (layout) + `/` |
| demais em `app/actions/*` | `revalidatePath("/", "layout")` | inalterado: afetam o shell (sino, menu, avatar); motivo comentado no arquivo |

Todas continuam autenticando dentro da action (via `apiRequest`) e validando entrada antes da chamada.

## 4. Componentes de UI (contrato de comportamento)

- `InvoiceStatusWatcher({ ids })` substitui `AutoRefresh` nos 3 pontos de uso; renderiza nada
  enquanto consulta e o botão "Atualizar" quando expira.
- Esqueletos de seção usam classes `kotta-*` e `aria-busy="true"` no contêiner da seção.
- Mensagens novas em pt-BR, tom atual: "Não foi possível marcar o item. Tente de novo.",
  "Sem conexão. O item não foi marcado.", "Atualizar".
- O toggle do item agora depende de JS (ação no cliente para o estado otimista); antes funcionava
  como formulário puro.
