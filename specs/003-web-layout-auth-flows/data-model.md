# Data Model: Layout web e fluxos de entrar e sair

Não há dados novos persistidos. As "entidades" abaixo são estados de navegação que vivem no cookie
de sessão e em parâmetros de URL.

## Sessão

| Campo | Onde vive | Regra |
|---|---|---|
| token | cookie `kotta_session` (httpOnly, `sameSite=lax`, 24 h) | Igual a hoje (`lib/api/session.ts`). |

Estados e transições:

```text
(sem sessão) --entrar ok--> ativa
ativa --"Sair" (POST, logoutAction)--> encerrada  -> /entrar?motivo=saiu
ativa --API responde 401--> expirada --GET /sair confirma 401--> (sem sessão) -> /entrar?motivo=expirada|envio&next=…
ativa --GET /sair com token válido--> ativa (nada é apagado) -> next ou /
```

- Só `logoutAction` (POST) e `GET /sair` apagam o cookie, e `GET /sair` apaga só depois de a API
  confirmar o 401 (research R2).
- Não há encerramento no servidor; a API não oferece (research R1).

## Destino de retorno (`next`)

| Campo | Origem | Validação |
|---|---|---|
| caminho + query | cabeçalho interno `x-kotta-path` gravado pelo `proxy.ts`; ou o caminho protegido que o proxy barrou | `safeNextPath` (só `/…`, nunca `//` nem `/\`); inválido vira `/` |

- Atravessa `/sair` → `/entrar` → campo oculto do formulário → `redirect` após entrar.
- Para `motivo=envio`, o destino ganha `aviso=envio-nao-salvo` (research R4).

## Motivo do aviso (`motivo`)

| Valor | Quando | Texto na tela de entrar |
|---|---|---|
| `saiu` | depois de "Sair" | "Você saiu da conta." |
| `expirada` | 401 numa leitura (GET) | "Sua sessão expirou. Entre de novo para continuar." |
| `envio` | 401 numa escrita (POST/PATCH/PUT/DELETE) | "Sua sessão expirou. Entre de novo para continuar." |
| outro / ausente | — | nenhum aviso |

Depois de entrar com `motivo=envio`, a página de destino mostra "A sessão expirou e o envio não foi
salvo. Preencha de novo."

As regras de `motivo` e de montagem das URLs ficam em funções puras em `lib/session-flow.ts`,
testadas em `lib/session-flow.test.mjs`.

## Largura de conteúdo

| Valor | Largura máxima | Alinhamento | Páginas |
|---|---|---|---|
| `view` | 1120 px (`max-w-view`) | ocupa a área de conteúdo | ver research R6 |
| `reading` | 720 px (`max-w-reading`) | à esquerda, mesma borda do título | ver research R6 |

Toda página logada declara exatamente uma, via `<Page width=…>` (padrão `view`).
