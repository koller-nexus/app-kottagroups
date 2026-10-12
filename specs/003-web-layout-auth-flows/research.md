# Research: Layout web e fluxos de entrar e sair

Fontes: código atual, docs instaladas do Next 16.3.5 (`node_modules/next/dist/docs/`), API Go em
`../api-kottagroups`, skills `frontend-design` e `ui-ux-pro-max` (`.agents/skills/`).

## R1. Encerrar a sessão no servidor (FR-006)

- **Decision**: Sair encerra só a sessão do navegador (apaga o cookie `kotta_session`).
- **Rationale**: A API (`internal/http/router.go`) não tem rota de logout nem lista de tokens
  revogados; o JWT é sem estado e dura 24 h (`lib/api/session.ts`). FR-006 já prevê esse caso.
- **Alternatives considered**: Criar `POST /auth/logout` com lista de revogação na API — fora do
  escopo deste repositório; registrar como follow-up se a revogação passar a ser exigida.

## R2. Sair de propósito só por ação da pessoa (FR-005)

- **Decision**: Sair continua sendo a Server Action `logoutAction` (POST). A rota `GET /sair`, usada
  só quando a sessão expira, passa a **confirmar com a API** que o token é inválido antes de apagar
  o cookie: chama `GET /users/me`; com 401 apaga e vai para entrar; com token válido redireciona
  para o destino sem apagar; com falha de rede vai para entrar sem apagar.
  A checagem chama a API direto, sem `apiRequest` (que redirecionaria de novo para `/sair` no 401).
  `GET /users/me` fica no grupo `protected` da API, que não exige e-mail confirmado.
- **Rationale**: Server Actions só aceitam POST e o Next compara `Origin` com `Host`
  (`02-guides/data-security.md`), então o botão de sair já é protegido. O risco está no `GET /sair`,
  que hoje apaga o cookie para qualquer visitante. Conferir o token não cria laço: só se chega em
  `/sair` depois de um 401, e o cookie só é apagado com outro 401.
- **Alternatives considered**: Checar `Sec-Fetch-Site` — rejeitado: quem chega por um link de e-mail
  (navegação cross-site) com sessão expirada ficaria num laço `/` → `/sair` → `/`. Diálogo de
  confirmação para sair — rejeitado na spec (Assumptions).

## R3. Voltar à página após sessão expirada (FR-007, FR-008)

- **Decision**: O `proxy.ts` grava o caminho atual (`pathname + search`) num cabeçalho interno da
  requisição (`x-kotta-path`, via `NextResponse.next({ request: { headers } })`, como em
  `03-file-conventions/proxy.md`). Ao receber 401, `apiRequest` lê esse cabeçalho e redireciona para
  `/sair?motivo=expirada&next=<caminho>` (ou `motivo=envio` quando o método não é GET). `/sair`
  repassa `next` e `motivo` para `/entrar`. O mesmo vale para `apiRequest` sem token.
- **Rationale**: Server Components e Server Actions não sabem o caminho atual; o proxy já roda em
  toda requisição, inclusive no POST das Server Actions, que vai para a URL da página. O valor passa
  por `safeNextPath` antes de ser usado, e o proxy sobrescreve o cabeçalho, então o cliente não o
  forja.
- **Alternatives considered**: `Referer` — ausente em parte das navegações e controlado por
  política do navegador. Guardar o caminho num cookie — mais estado para limpar.

## R4. Aviso de envio perdido (FR-008, edge case)

- **Decision**: Com `motivo=envio`, a tela de entrar mostra "Sua sessão expirou. Entre de novo para
  continuar." e o destino recebe `?aviso=envio-nao-salvo`. Um componente cliente pequeno no
  `AppShell` (`SubmitLostNotice`) lê esse parâmetro e mostra "A sessão expirou e o envio não foi
  salvo. Preencha de novo." no topo do conteúdo.
- **Rationale**: Atende ao caso de borda da spec (aviso na página do formulário) sem guardar
  rascunho (Clarification 3) e sem tocar em cada formulário.
- **Alternatives considered**: Avisar só na tela de entrar — não cumpre o texto do caso de borda.

## R5. Dados visíveis depois de sair (FR-004)

- **Decision**: Confiar na plataforma e verificar no quickstart: apagar cookie numa Server Action
  re-renderiza e invalida o cache do roteador (`02-guides/server-actions.md`), e as páginas logadas
  são dinâmicas (`Cache-Control: no-store`), o que tira ou invalida a página do bfcache ao mudar o
  cookie. Só se o quickstart falhar em Safari ou Chrome: ouvir `pageshow` com `persisted` e
  recarregar.
- **Rationale**: Constituição I (não construir o que a plataforma já faz). O teste de voltar está
  no quickstart.
- **Alternatives considered**: Recarregar sempre em `pageshow` — código extra sem falha observada.

## R6. Larguras e ritmo (FR-013 a FR-017)

- **Decision**: Dois tokens no `@theme` de `app/globals.css`: `--container-reading: 45rem` (720 px)
  e `--container-view: 70rem` (1120 px), gerando `max-w-reading` e `max-w-view` no Tailwind v4.
  `AppShell` aplica `max-w-view` e as margens `px-4 sm:px-8 lg:px-10`. Um componente `Page` em
  `components/app/page-header.tsx` monta título → 32 px → seções com `gap-8 lg:gap-12` e aplica
  `max-w-reading` quando `width="reading"`, alinhado à esquerda.
- **Rationale**: Hoje 17 páginas repetem largura e espaços à mão (sete larguras diferentes). Um
  componente usado 17× centraliza FR-013, FR-014, FR-016 e FR-017 e apaga os wrappers soltos.
- **Alternatives considered**: Só classes utilitárias em cada página — a mesma combinação repetida
  17×, que é exatamente o desvio que gerou o problema. `layout.tsx` por grupo de rotas por largura —
  mexe na árvore de rotas por estética.

Classificação das páginas logadas:

| Largura | Páginas |
|---|---|
| visão | `/` (Painel), `/grupos`, `/grupos/[id]`, `/grupos/[id]/listas/[listId]`, `/notas`, `/notificacoes`, `/perfil`, `/perfil/categorias` |
| leitura | `/grupos/novo`, `/grupos/[id]/editar`, `/grupos/[id]/membros`, `/despesas/nova`, `/despesas/[id]`, `/despesas/[id]/editar`, `/notas/[id]`, `/perfil/categorias/nova`, `/perfil/categorias/[id]` |

## R7. Painel em duas colunas (FR-012)

- **Decision**: `DashboardView` envolve as seções em duas colunas (`lg:grid-cols-2`): coluna 1 =
  campo de saldo + "Gastos dos grupos"; coluna 2 = "Últimas quitações" + "Seus grupos". Abaixo de
  1024 px as colunas empilham, e a ordem resultante é a de `DESIGN.md`. A prévia sem login em `/`
  usa o mesmo `DashboardView`.
- **Rationale**: Um único ponto de mudança atende o Painel logado e a prévia.

## R8. Telas de acesso (FR-022)

- **Decision**: Mover `app/confirm-email/` e `app/forget-password/` para `app/(acesso)/`. O grupo
  de rotas não muda as URLs e aplica o layout de acesso; as telas perdem o `<main>`, a moldura e a
  sombra próprios (sombra em cartão contraria `DESIGN.md`).
- **Rationale**: Apaga duas cópias da moldura em vez de criar uma terceira abstração.

## R9. Erro ao entrar acessível (FR-010, FR-011)

- **Decision**: `FormError` já usa `role="alert"`. `LoginForm` passa a focar o campo de senha quando
  há erro e e-mail preenchido, ou o e-mail quando ele está vazio. Campos já têm `autoComplete` e não
  bloqueiam colar.
- **Rationale**: Orientação "Accessible Authentication" do ui-ux-pro-max; mudança local ao
  formulário.

## R10. Sair na barra lateral e no Perfil (FR-001, FR-002)

- **Decision**: Um `LogoutButton` cliente (formulário com `logoutAction` + `useFormStatus` para
  "Saindo…" e `disabled`) usado na área da conta da barra lateral (logo abaixo do cartão do perfil),
  no Perfil (logo abaixo do resumo da conta) e em "Confirme seu e-mail". `logoutAction` redireciona
  para `/entrar?motivo=saiu`. A navegação da barra lateral rola sozinha (`min-h-0 overflow-y-auto`)
  para a área da conta ficar sempre visível.
- **Rationale**: Um botão direto na barra lateral é 1 interação (menos que o limite de 2), sem menu.
