# Baseline de performance — 018

## Método

- **Ambiente**: build de produção (`next build` + `next start`) local, API local
  (`api-kottagroups` em `5b25322`, PR #209) com Postgres/Redis do `deployments/dev`. Dados: um
  usuário com **1 grupo** e outro com **20 grupos**; cada grupo com 1 despesa no mês e o primeiro
  com uma lista de compras de 5 itens.
- **Navegador**: Chromium (Playwright), viewport mobile 412×823, CPU 4× mais lenta. A rede é
  loopback e **não** foi limitada (o throttling do CDP não vale para `localhost`). Os tempos servem
  para comparar **antes × depois** no mesmo ambiente, não como CWV de produção. Os CWV reais
  (LCP, INP, CLS, TTFB por rota) passam a vir do Speed Insights em produção.
- **Colunas**:
  - *HTML completo*: `responseEnd` da navegação (fim do streaming do servidor).
  - *LCP*: `largest-contentful-paint`.
  - *Chamadas (doc)*: chamadas à API feitas pela renderização da página aberta (shell + página),
    contadas pela tag de request do log `API_TIMING_LOG=1`.
  - *Chamadas (prefetch)*: chamadas feitas, depois da hidratação, pelo prefetch automático dos
    `<Link>` visíveis (build de produção).
- **JS por rota**: soma dos chunks de cliente (`static/chunks/*.js`) do
  `next experimental-analyze --output`, com o framework compartilhado incluído.
- Visita = carregamento completo (`page.goto`). Em navegação dentro do app, o layout `(conta)`
  não re-renderiza (docs do Next: "Layouts do not re-render on navigation"), então o shell (3
  chamadas) só entra no carregamento completo, no `router.refresh()` e na ida do `/` para uma
  rota de `(conta)`.

## Chamadas à API e tempos

Antes: `main` em `04302e5` + log de chamadas. Depois: esta branch. Data: 2026-10-16.

### 20 grupos

| Rota | Chamadas doc (antes → depois) | Prefetch (antes → depois) | HTML completo ms (antes → depois) | LCP ms (antes → depois) |
|---|---|---|---|---|
| `/` (Painel) | **44 → 5** | 8 → 7 | 59 → 34 | 96 → 44 |
| `/grupos` | **43 → 24** | 4 → 4 | 68 → 38 | 36 → 32 |
| `/grupos/[id]` | 10 → 10 | 3 → 3 | 22 → 28 | 64 → 48 |
| `/grupos/[id]/listas/[listId]` | 6 → 6 | 1 → 1 | 16 → 22 | 36 → 56 |
| `/grupos/[id]/notas` | 5 → 5 | 1 → 1 | 9 → 13 | 48 → 36 |
| `/despesas/nova` | **24 → 5** | 1 → 1 | 28 → 19 | 340 → 40 |
| `/perfil` | 4 → 4 | 0 → 0 | 10 → 9 | 36 → 36 |
| `/notificacoes` | **24 → 5** | 0 → 0 | 21 → 13 | 340 → 32 |
| `/grupos/[id]/membros` | **23 → 5** | 1 → 1 | 25 → 14 | 44 → 32 |

### 1 grupo

| Rota | Chamadas doc (antes → depois) | Prefetch (antes → depois) | HTML completo ms (antes → depois) | LCP ms (antes → depois) |
|---|---|---|---|---|
| `/` (Painel) | 6 → 5 | 5 → 4 | 25 → 28 | 60 → 60 |
| `/grupos` | 5 → 5 | 1 → 1 | 14 → 13 | 32 → 48 |
| `/grupos/[id]` | 10 → 10 | 3 → 3 | 22 → 27 | 48 → 48 |
| `/grupos/[id]/listas/[listId]` | 6 → 6 | 1 → 1 | 13 → 14 | 52 → 40 |
| `/grupos/[id]/notas` | 5 → 5 | 1 → 1 | 10 → 12 | 44 → 32 |
| `/despesas/nova` | 5 → 5 | 1 → 1 | 9 → 9 | 32 → 44 |
| `/perfil` | 4 → 4 | 0 → 0 | 8 → 8 | 36 → 32 |
| `/notificacoes` | 5 → 5 | 0 → 0 | 9 → 9 | 52 → 28 |
| `/grupos/[id]/membros` | 4 → 5 | 1 → 1 | 8 → 9 | 28 → 28 |

CLS foi 0,000 em todas as rotas, antes e depois.

Leitura:

- Painel, Nova despesa, Notificações e Membros passam a fazer um nº **constante** de chamadas
  (5), igual com 1 ou 20 grupos. Com a API local cada chamada custa poucos ms; em produção,
  cada uma soma a latência até a API, então o ganho real cresce com o nº de grupos.
- Com 1 grupo, Membros vai de 4 para 5: antes a página reaproveitava `getGroup(id)` dentro de
  `listGroupDetails()`, e agora o lote é uma chamada separada. Fica constante.
- `/grupos` ainda cresce com N (24 com 20 grupos): é uma chamada por grupo para a data da última
  despesa. A API não devolve esse dado em lote. Follow-up na api-kottagroups (ex.: `lastExpenseAt`
  no `include`).
- `/grupos/[id]` e a lista já eram constantes (10 e 6 chamadas em paralelo).
- A diferença de poucos ms nas rotas que não mudaram é ruído de medição local.

## JS de cliente por rota

| Rota | JS KiB (antes → depois) | JS gzip KiB (antes → depois) |
|---|---|---|
| `/` | 636 → 645 | 246 → 250 |
| `/grupos` | 644 → 647 | 250 → 251 |
| `/grupos/[id]` | 788 → 793 | 303 → 305 |
| `/grupos/[id]/listas/[listId]` | 799 → 803 | 309 → 310 |
| `/grupos/[id]/notas` | 648 → 652 | 252 → 254 |
| `/grupos/[id]/notas/[notaId]` | 649 → 653 | 252 → 254 |
| `/despesas/nova` | 652 → 655 | 253 → 254 |
| `/notificacoes` | 645 → 648 | 250 → 251 |
| `/perfil` | 654 → 657 | 255 → 256 |

Aumento máximo de +4 KiB gzip (+1,6%, no `/`), quase todo do `@vercel/speed-insights`. Bem
abaixo do teto de 10%.

Listas: páginas de 20 a 100 itens (despesas, notas, notificações); nenhuma passa de ~100 itens
visíveis, então virtualização não se aplica (ADR 0001).

## Prefetch da navegação

Em produção, o `<Link>` prefetcha as rotas visíveis até o `loading.tsx` mais próximo. Por isso a
tab bar já abre com esqueleto imediato, sem precisar forçar `prefetch`. O custo aparece na coluna
"Prefetch": do `/` (fora do layout `(conta)`), o prefetch de `/grupos` renderiza o shell (3
chamadas), e cada link de grupo chama `getGroup` no `generateMetadata`. Com 20 grupos no Painel,
são 7 chamadas de prefetch. Fica registrado: não vale mexer agora, porque são chamadas baratas
e só ocorrem para links na tela.

## Polling de notas

Com uma nota em leitura, a tela consultava a árvore RSC inteira (shell + página) a cada 3 s.
Agora consulta só `GET /api/notas/status` (3 s → 5 s → 10 s, pausa com a aba oculta, para em
10 min) e faz **um** `router.refresh()` quando a leitura termina. Isso é coberto pelo E2E
"nota em leitura consulta só o status e atualiza a tela quando termina".

## Scripts

Fora do repositório, no scratchpad da sessão: `seed.sh` (usuários locais), `measure.mjs`
(rotas) e `route-js.cjs` (bundle).
