# UI Contract: rotas de sessão e moldura de páginas

Contrato das URLs e dos componentes que outras partes do app usam. Textos em pt-BR são os que
aparecem na tela.

## `GET /entrar`

| Query | Tipo | Efeito |
|---|---|---|
| `next` | caminho interno | Destino após entrar (via `safeNextPath`; inválido → `/`). |
| `motivo` | `saiu` \| `expirada` \| `envio` | Aviso acima do formulário (data-model "Motivo do aviso"). |

- Com sessão: o proxy redireciona para `/` (sem mudança).
- Erro de login: mensagem com `role="alert"`, e-mail preservado, foco no campo a corrigir.

## `GET /sair` (só limpeza de sessão expirada)

| Query | Tipo | Efeito |
|---|---|---|
| `motivo` | `expirada` \| `envio` | Repassado a `/entrar`. |
| `next` | caminho interno | Repassado a `/entrar` (validado). |

Comportamento:

1. Sem cookie → `/entrar` com os mesmos parâmetros.
2. API responde 401 a `GET /users/me` → apaga o cookie → `/entrar?motivo=…&next=…`.
3. API aceita o token → **não apaga** → redireciona para `next` (ou `/`).
4. Falha de rede ou outro erro → `/entrar` sem apagar.

Nenhuma outra forma de `GET` encerra a sessão.

## `logoutAction` (Server Action, POST)

- Apaga o cookie e redireciona para `/entrar?motivo=saiu`.
- Acionada só pelo `LogoutButton` (barra lateral, Perfil, Confirme seu e-mail).

## Cabeçalho interno `x-kotta-path`

- Gravado pelo `proxy.ts` em toda requisição que passa pelo matcher: `pathname + search`.
- Sobrescreve qualquer valor vindo do cliente. Lido só por `apiRequest` para montar `next`.

## `apiRequest` em sessão inválida

| Situação | Redireciona para |
|---|---|
| sem token | `/entrar?next=<x-kotta-path>` |
| 401, método GET | `/sair?motivo=expirada&next=<x-kotta-path>` |
| 401, outro método | `/sair?motivo=envio&next=<x-kotta-path>` |
| 403 `EMAIL_NOT_CONFIRMED` | `/confirme-seu-email` (sem mudança) |

## Componente `<Page>` (`components/app/page-header.tsx`)

```text
<Page title description? leading? actions? width?="view"|"reading">
  …seções…
</Page>
```

- Renderiza `PageHeader`, 32 px de espaço, e as seções empilhadas com 32 px (celular) / 48 px
  (≥ 1024 px) entre elas.
- `width="reading"` limita a 720 px alinhado à esquerda; `view` usa a área toda (até 1120 px).
- Toda página em `app/(conta)/` e o Painel usam `<Page>`; nenhuma define `max-w-*` própria no
  wrapper da página.

## `<LogoutButton>` (`components/auth/logout-button.tsx`)

- Formulário com `logoutAction`. Durante o envio mostra "Saindo…" e fica `disabled`.
- Alvo de toque mínimo 44 × 44 px.

## Moldura de acesso

- `app/(acesso)/layout.tsx` é a única moldura das seis telas de acesso: `/entrar`, `/cadastrar`,
  `/esqueci-a-senha`, `/confirme-seu-email`, `/confirm-email`, `/forget-password`.
- As URLs não mudam.
