# Research: Performance do front (018)

Fontes: código atual (`lib/api/server.ts`, `lib/api/kotta.ts`, `components/app/dashboard.tsx`,
`components/app/app-shell.tsx`, `components/app/auto-refresh.tsx`, `app/actions/*`), docs do
Next 16.3.5 em `node_modules/next/dist/docs/` e o contrato da API em
`api-kottagroups/specs/069-dashboard-aggregates/contracts/openapi-changes.md` (PR #209, já em `main`).

## R1. TanStack Query (decisão central do ADR)

- **Decision**: **Não adotar** agora. Manter Server Components + Server Actions e resolver os
  4 casos citados na issue com primitivas que o app já tem (React 19, Next 16).
- **Rationale**:
  - O token fica em cookie `HttpOnly`; qualquer `queryFn` no cliente exige uma BFF (Route
    Handlers que leem o cookie), com CSRF, sessão expirada (spec 016) e duplicação de
    `lib/api/kotta.ts`. É uma segunda camada de dados para manter.
  - Os casos reais cabem sem ela:
    | Caso da issue | Solução sem TanStack |
    |---|---|
    | Polling de notas | 1 Route Handler de status + `setTimeout` com backoff e `visibilitychange`; `router.refresh()` só quando o status muda (R5) |
    | Marcar item otimista | `useOptimistic` + `useTransition` (R6) |
    | Notificações infinitas | Server Action "carregar mais" que devolve a próxima página; o client component anexa (R7) |
    | Invalidação fina | `revalidatePath` por rota/segmento (R4) |
  - Bundle: Query ≈ 13 kB gz em toda rota que a usa, contra 0 kB das primitivas nativas.
  - Constituição I: dependência nova só se poucas linhas não resolvem; aqui resolvem.
- **Alternatives considered**: (a) TanStack Query + BFF completa — rejeitada pelo custo acima;
  (b) híbrido só para notificações/polling — rejeitado: dois modelos de dados para ganho que a
  Server Action e o handler de status já dão. **Reabrir** se surgir estado de servidor
  compartilhado entre muitas telas no cliente (ex.: chat, edição colaborativa).
- **TanStack Virtual**: não adotar; nenhuma lista renderiza > 100 itens hoje (páginas de 20–100).
  Reavaliar se o baseline mostrar INP ruim em listas longas.
- **TanStack Table / Form**: não se aplicam — não há grade de dados ordenável/filtrável, e os
  formulários usam `useActionState` + validação no servidor, que já cobre o fluxo.

## R2. Cache Components / `"use cache"` / `updateTag`

- **Decision**: **Não ligar** `cacheComponents` nesta feature. Registrar no ADR como próximo
  passo condicionado ao baseline.
- **Rationale**: `cacheComponents` é global e muda a semântica de renderização (dados dinâmicos
  precisam de `<Suspense>`). Dados aqui são por usuário: o token teria de ser argumento da
  função cacheada (cookies não podem ser lidos dentro de `"use cache"`), e chaves por token
  não podem vazar entre usuários. Com os endpoints agregados, o custo principal (N+1 e
  waterfall) some sem cache; o ganho restante é incerto até medir. `updateTag` só funciona com
  dados tagueados, então depende dessa adoção.
- **Alternatives considered**: `"use cache: private"` por usuário — adiado pelo mesmo motivo;
  `unstable_cache` — legado.

## R3. Endpoints agregados da API (PR #209)

- **Decision**:
  - `getDashboard()` → `GET /me/dashboard` (fuso padrão `America/Sao_Paulo`, igual a `APP_TIME_ZONE`).
  - `listGroupDetails()` → `GET /groups?include=members,balances&limit=50`, paginado (até
    `MAX_PAGES`), em vez de `listGroups()` + N × `getGroup()`.
  - `listExpensesSince()` → `GET /groups/:id/expenses?since=` (sem varredura até a data de corte).
    Após R3, o único chamador (Painel) deixa de usá-la; **remover** a função (Constituição I:
    deleção no mesmo change).
- **Rationale**: Nº de chamadas fica constante em relação ao nº de grupos (FR-005, FR-013).
- **Detalhe — nomes em "Atividade recente"**: `recent` traz `from`/`to` como ids; o Painel
  precisa dos nomes (hoje via `peopleById(groups)`). O resumo não traz membros. Para não
  pedir mudança na API, o Painel usa `listGroupDetails()` (já com `include=members`) só para
  o mapa de nomes. Conta da visita: `getMe` + `getNotificationCount` + `listGroups` (shell)
  + `getDashboard` + `listGroupDetails` = **5**, constante. `getMe` é deduplicado por
  `React.cache` entre shell e página.
  - Otimização possível (não obrigatória): pedir à API nomes em `recent`; aí o Painel cai para 4.
- **Paridade**: `monthSpend` no front soma `amountCents` total das despesas por mês local; a
  API (spec 069) declara paridade com esse cálculo. Teste de paridade fica na API; no front, o
  mapeamento `DashboardResponse → DashboardView` ganha um teste em `lib/`.

## R4. Invalidação por escopo

> **Revisto na implementação**: o sino do shell conta quitações calculadas a partir dos saldos
> (`NotificationService.Count` na API), e o cache de rotas dinâmicas no cliente é 0 s
> (`staleTimes.dynamic`). Por isso só listas e itens ganharam escopo; o resto mantém
> `("/", "layout")` com o motivo comentado no código. Ver ADR 0001.

- **Decision**: trocar `revalidatePath("/", "layout")` por caminhos afetados:
  - itens/listas de compras → `/grupos/${groupId}/listas/${listId}` (e a lista de listas do
    grupo quando cria/renomeia/exclui);
  - despesas/settlements/membros → `/grupos/${groupId}` (`"layout"` do segmento do grupo) e `/`
    (Painel);
  - criar/arquivar/renomear grupo, perfil, notificações marcadas → mantêm `("/", "layout")`,
    pois afetam o shell (menu de grupos, avatar, contador). Justificado no código com comentário.
- **Rationale**: `revalidatePath("/", "layout")` limpa o Router Cache do cliente para todas as
  rotas, forçando refetch completo em cada navegação seguinte. Com fetch `no-store` a
  renderização já é dinâmica; o ganho é preservar segmentos e prefetches do cliente.
- **Alternatives considered**: `revalidateTag` — requer dados tagueados (R2).

## R5. Polling de notas sem recarregar o shell

- **Decision**: Route Handler `GET /api/notas/status?ids=…` (lê o cookie no servidor via
  `getInvoice`), e o `AutoRefresh` vira `InvoiceStatusWatcher`: `setTimeout` com intervalos
  3 s → 5 s → 10 s, pausa com `document.hidden`, para após 10 min (mostra "Atualizar") e chama
  `router.refresh()` **uma vez** quando algum status deixa de ser pendente.
- **Rationale**: `router.refresh()` re-renderiza a árvore RSC inteira (layout + shell). Consultar
  só o status e atualizar uma vez no fim corta as recargas do shell para zero durante a espera.
- **Segurança**: handler `GET` somente leitura, mesmo domínio, cookie `SameSite` já em uso; sem
  CSRF (não muta). 401 → responde 401 e o cliente navega para `expiredSessionUrl` (spec 016).
  Limitar `ids` (máx. 20, regex de id) para não virar amplificador de chamadas.
- **Alternatives considered**: SSE — exige conexão longa no serverless; desnecessário para
  poucos minutos de espera.

## R6. Lista de compras otimista

- **Decision**: no client component da lista (`components/forms/shopping-forms.tsx`), envolver os
  itens com `useOptimistic` e disparar `toggleShoppingItemAction` dentro de `startTransition`.
  A action passa a devolver `{ ok, error? }` em vez de `void` para o rollback mostrar a mensagem.
- **Rationale**: React 19 reverte o estado otimista sozinho quando a transição termina; o estado
  final vem do servidor (última ação vence, FR-010). Sem dependência.
- **Erro de sessão**: a action redireciona (comportamento atual de `apiRequest`); o otimista some
  com a navegação.

## R7. Notificações sem recarregar o shell

> **Revisto na implementação**: dispensado. A paginação por `?cursor=` é navegação suave, e o
> layout `(conta)`, onde está o shell, não re-renderiza na navegação (docs do Next). A premissa
> da issue ("recarrega shell a cada página") não se confirmou.

- **Decision**: Server Action `loadMoreNotificationsAction(status, cursor)` devolve itens já
  mapeados para a view; client component pequeno anexa e guarda o próximo cursor. O link
  `?cursor=` continua funcionando sem JS (progressive enhancement).
- **Rationale**: evita navegação completa por página; reaproveita `listNotificationsPage`.

## R8. Streaming / Suspense

> **Revisto na implementação**: feito só no Painel. A página do grupo faz 10 chamadas em
> paralelo, constantes, e depende de "qualquer 404/403 vira a 404 do app" (commit `038f54f`).
> Com seções em streaming, um 404 tardio chegaria depois do shell já enviado. O
> `(conta)/loading.tsx` já dá shell + esqueleto na navegação. Reavaliar com CWV de produção.

- **Decision**: em Painel, Grupo e Lista, a página renderiza o cabeçalho e envolve cada seção
  lenta em `<Suspense fallback={<Skeleton…/>}>` com esqueletos usando classes `kotta-*`. Manter o
  `app/(conta)/loading.tsx` existente; adicionar `loading.tsx` só em `grupos/[id]` se o baseline
  mostrar TTFB alto.
- **Rationale**: com o shell já resolvido no layout, a página deixa de esperar a chamada mais
  lenta (FR-007, FR-015). Dentro de um `<Suspense>`, erro de seção usa o `error.tsx` existente
  ou um fallback local com "Tentar de novo".

## R9. Medição

- **Decision**:
  - `@vercel/speed-insights` (`<SpeedInsights />` no root layout, junto do `<Analytics />`).
    Dependência nova justificada: CWV reais por rota pedidos na issue; ~1 kB, sem alternativa
    nativa equivalente.
  - `apiRequest` registra `[api] #<n> <METHOD> <path> -> <status> <ms>ms` quando
    `API_TIMING_LOG=1`; o contador `n` vem de `React.cache(() => ({ calls: 0 }))`, que é por
    request. Path sem query string de cursor; nunca token ou corpo.
  - Bundle: `pnpm next experimental-analyze --output` (já no Next 16; sem dependência nova).
  - Lighthouse mobile (Moto G Power, 4G lento) nas 7 rotas.
  - Baseline e "depois" em `specs/018-front-performance/baseline.md` e copiados na issue #14.
- **Alternatives considered**: `@next/bundle-analyzer` — dependência desnecessária; OpenTelemetry
  no front — excesso para contar chamadas.

## R10. Imagens e prefetch

- **Decision**: `AvatarPhoto` e imagens de nota com `loading="lazy"`, `decoding="async"` e
  `width`/`height` explícitos (ou `next/image` onde já existe). `Link` da tab bar mantém o
  prefetch padrão (em produção, prefetch até o `loading.tsx` mais próximo); conferir no mobile e
  só forçar `prefetch` se o baseline mostrar navegação lenta.
