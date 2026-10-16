# Contract: rotas e Server Actions do fluxo de acesso

## Rotas

| Rota | Acesso (proxy.ts) | Query | Notas |
|------|-------------------|-------|-------|
| `/cadastrar` | GUEST_ONLY | — | Aceite obrigatório; links para `/termos` e `/privacidade` em nova aba |
| `/entrar` | GUEST_ONLY | `next`, `motivo` (`saiu`\|`expirada`\|`envio`\|`conta-criada`), `email` | `email` preenche o campo |
| `/confirme-seu-email` | PROTECTED | `next` | Redireciona a `next` (ou `/`) se já confirmado |
| `/confirmar-email` | público | `token` | Substitui `/confirm-email` |
| `/redefinir-senha` | público | `token` | Substitui `/forget-password` |
| `/termos` | público | — | Novo |
| `/privacidade` | público | — | Novo |
| `/confirm-email` | — | repassa a query | `redirect` (307) para `/confirmar-email` |
| `/forget-password` | — | repassa a query | `redirect` (307) para `/redefinir-senha` |

`next` sempre passa por `safeNextPath` (só caminho interno).

## Server Actions (`app/actions/auth.ts`)

### `registerAction(prev, formData) → AuthFormState`

- Entrada: `name`, `email`, `password`, `pixKey?`, `acceptTerms` (`"on"`).
- `validateRegistration` falha → `{ fieldErrors, fields }`, **sem** chamar a API.
- `POST /auth/register` falha → `VALIDATION_FAILED` mapeável → `fieldErrors[campo]`;
  `EMAIL_EXISTS` → `fieldErrors.email`; resto → `error`.
- Cadastro ok e login ok → `redirect("/confirme-seu-email")`.
- Cadastro ok e login falha → `redirect("/entrar?motivo=conta-criada&email=<email>")`.
- Corpo enviado: `{ name, email, password, pixKey?, termsVersion, privacyVersion }` (versões de
  `lib/legal.ts`; exige api-kottagroups ≥ 0.6.0).

### `loginAction(prev, formData) → AuthFormState`

- Entrada: `email`, `password`, `next`.
- Inválido → `fieldErrors`.
- `RATE_LIMITED` com `retryAfter` → `error` com o tempo; sem → texto genérico.
- Ok e confirmado → `redirect(next)`; não confirmado → `redirect("/confirme-seu-email?next=<next>")`
  (sem `next` quando é `/`).

### `confirmEmailAction(token) → { state, signedIn }`

- Ver `ConfirmationOutcome` em `data-model.md`. Sucesso com sessão → `revalidatePath("/", "layout")`.
- Nunca devolve nem registra o token.

### `checkConfirmationAction(prev, formData) → { message?: string }`

- Entrada: `next`. Confirmado → `redirect(next)`. Não → mensagem "Ainda não recebemos a confirmação.
  Abra o link no seu e-mail." Falha de rede → mensagem de serviço fora do ar.

### `resendConfirmationAction(prev) → ResendState`

- Ok → `{ status: "sent", retryAfter: 60 }`. Já confirmado → `redirect("/")`.
- `RATE_LIMITED` → `{ status: "error", retryAfter: err.retryAfter ?? 60, message }`.

### `logoutAction(formData)`

- Campo `destino` opcional: `cadastrar` → `/cadastrar`; ausente/outro → `/entrar?motivo=saiu`.

## Mudança em `lib/api`

- `ApiError` ganha `retryAfter?: number` (segundos, do cabeçalho `Retry-After` quando numérico).
- `apiRequest`, em `403 EMAIL_NOT_CONFIRMED`, redireciona para
  `/confirme-seu-email?next=<caminho atual>`.
- `friendlyMessage` ganha `EMAIL_NOT_CONFIRMED` e `INVALID_TOKEN`; `RATE_LIMITED` deixa de dizer
  "alguns minutos".

## Dependências externas (issues na api-kottagroups)

1. ~~Aceitar `termsVersion`/`privacyVersion` no `POST /auth/register` e registrar versão, data/hora e IP.~~ Feito na api-kottagroups spec 066.
2. Códigos distintos para confirmação expirada e já usada.
3. Trocar `/confirm-email` → `/confirmar-email` e o link de recuperação → `/redefinir-senha`.
