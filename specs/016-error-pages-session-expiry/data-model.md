# Data Model: Páginas de erro padronizadas e logout automático

Nenhuma entidade persistida nova. Tudo aqui é estado derivado do token da API ou da URL.

## Sessão (lado do app)

| Campo | Origem | Tipo | Regras |
|---|---|---|---|
| `token` | cookie `kotta_session` (httpOnly) | JWT string | nunca enviado ao cliente; lido só em `lib/api/session.ts`, `proxy.ts`, `app/sair/route.ts` |
| `expiresAt` | claim `exp` do payload do JWT | ms desde epoch, ou `undefined` | `undefined` (token ilegível, sem `exp`, `exp` não numérico) é tratado como vencido |
| `isExpired` | `expiresAt`, `now` | boolean | `expiresAt === undefined \|\| expiresAt - EXPIRY_LEEWAY_MS <= now`, com `EXPIRY_LEEWAY_MS = 30_000` |
| cookie `expires` | `expiresAt` | Date | igual ao `expiresAt`; fallback `maxAge` 24 h quando `expiresAt` é `undefined` |
| `msLeft` | `expiresAt - Date.now()` no servidor | número (ms) | único dado de sessão passado ao `SessionWatcher`; `≤ 0` dispara logout imediato |

Transições de estado da sessão no navegador:

```text
[sem cookie] --login--> [válida] --exp - 30s (proxy) / exp (watcher)--> [vencida] --proxy apaga cookie--> [sem cookie]
[válida] --logoutAction (POST)--> [sem cookie]
[válida] --/sair com API fora ("unknown")--> [válida] (volta para `next`)
```

## Prazos do watcher (`watcherDeadlines(msLeft)`)

| Campo | Regra |
|---|---|
| `warnInMs` | `max(0, msLeft - 120_000)`; `0` mostra o aviso na hora |
| `expireInMs` | `max(0, min(msLeft, 2**31 - 1))` |

## Estado de erro (`ErrorKind`)

| `kind` | Quando | Título | Texto padrão | Ação primária | Ação secundária |
|---|---|---|---|---|---|
| `not-found` | `notFound()` ou URL não casada | Página não encontrada | pública: "Essa página não existe ou mudou de lugar."; no app: "Esse item não existe ou você não tem acesso a ele." | Ir para o Painel (com sessão) / Ir para o início | Voltar |
| `session-expired` | `/sessao-expirada` | Sua sessão expirou | "Entre de novo para continuar de onde parou." | Entrar de novo | — |
| `offline` | `navigator.onLine === false` | Sem conexão | "Verifique sua internet e tente de novo." | Tentar de novo | — |
| `unavailable` | digest `API_ERROR:<status>:<code>` com status ≥ 500 ou código em `NETWORK_ERROR`, `SERVICE_UNAVAILABLE`, `EDGE_BLOCKED`, `INTERNAL_ERROR` | O Kotta Groups está fora do ar | `friendlyMessage(code)` | Tentar de novo | — |
| `unexpected` | qualquer outro erro | Algo deu errado | com código da API: `friendlyMessage(code)`; sem: "Tivemos um problema ao abrir esta tela. Tente de novo." | Tentar de novo | Ir para o Painel / Ir para o início |

Regras de escolha (`errorKind({ digest, isOnline })`), nesta ordem: `offline` → `unavailable` →
`unexpected`. `not-found` e `session-expired` não passam por `errorKind`; são escolhidos pela rota.

`code` exibido ("Código: …"): o código da API quando o digest é `API_ERROR:…`; senão o `digest` do
Next (hash) quando existir; nada quando não houver nenhum.

## `ApiError.digest`

| Antes | Depois |
|---|---|
| `API_UNAVAILABLE:<code>` só para status ≥ 500 ou código indisponível; ausente nos demais | `API_ERROR:<status>:<code>` sempre |

## Aviso de login (`loginNotice(motivo)`) — sem mudança

| `motivo` | Texto |
|---|---|
| `saiu` | Você saiu da conta. |
| `expirada` | Sua sessão expirou. Entre de novo para continuar. |
| `envio` | Sua sessão expirou. Entre de novo para continuar. (+ `aviso=envio-nao-salvo` no `next`) |

## Mensagem entre abas (`BroadcastChannel("kotta-session")`)

```json
{ "type": "signed-out", "motivo": "saiu" | "expirada" }
```

Emissor: `/entrar` ao ser aberto com `motivo` (cookie já apagado). Receptor: cada `SessionWatcher`. `saiu` → `/entrar?motivo=saiu`; `expirada` →
`/entrar?motivo=expirada&next=<pathname+search da própria aba>`.

## Destino do `/sair` (`logoutDestination`)

| Entrada | Saída |
|---|---|
| sem token | `/entrar` (+ `motivo` se `expirada`/`envio`, + `next` se ≠ `/`), sem apagar cookie |
| `check = "valid"` | `next`, cookie mantido |
| `check = "invalid"` | `/entrar` (+ `motivo`, + `next`), cookie apagado |
| `check = "unknown"` | `next`, cookie mantido |
