# Data Model: Pedir a senha atual para trocar a chave Pix no perfil

Nada é persistido no app. As estruturas abaixo existem só durante um salvamento.

## Campos do formulário (`FormData` de `updateProfileAction`)

| Campo | Origem | Regra |
|-------|--------|-------|
| `name` | digitado | `trim`; vazio → erro "O nome não pode ficar vazio." antes da API (como hoje) |
| `pixKey` | digitado | `trim`; vazio = sem chave |
| `savedPixKey` | oculto, prop da página | chave salva, já normalizada pela API; `""` quando não há |
| `currentPassword` | digitado, só quando o campo está visível | sem `trim`; nunca devolvido |

## `isPixKeyChange(typed, saved)` → boolean

`typed.trim() !== saved`

| typed | saved | resultado |
|-------|-------|-----------|
| `"a@b.com"` | `"a@b.com"` | false |
| `" a@b.com "` | `"a@b.com"` | false |
| `"c@d.com"` | `"a@b.com"` | true (troca) |
| `""` | `"a@b.com"` | true (remoção) |
| `"a@b.com"` | `""` | true (primeira chave) |
| `""` | `""` | false |

## `profileUpdateBody(input)` → corpo do PATCH

Entrada: `{ name, pixKey, savedPixKey, currentPassword }`.

| Caso | Corpo |
|------|-------|
| chave não mudou | `{ name }` |
| troca ou primeira chave | `{ name, pixKey, currentPassword }` |
| remoção | `{ name, pixKey: null, currentPassword }` |

`currentPassword` vai como foi digitada, inclusive `""`. A API responde
`CURRENT_PASSWORD_REQUIRED` para senha vazia.

## `passwordErrorMessage(code, retryAfter?)` → string | undefined

| code | resultado |
|------|-----------|
| `CURRENT_PASSWORD_REQUIRED` | "Digite sua senha atual para trocar a chave Pix." |
| `CURRENT_PASSWORD_INVALID` | "Senha incorreta." |
| `RATE_LIMITED` | `rateLimitMessage(retryAfter)` |
| outro | `undefined` → segue em `failure()` |

## `ProfileFormState` (estado devolvido ao navegador)

`FormState & { passwordError?: string }`

| Situação | Estado |
|----------|--------|
| nome vazio | `{ error, values: { name, pixKey } }` |
| erro de senha | `{ passwordError, values: { name, pixKey } }` |
| outro erro da API | `{ error, values: { name, pixKey } }` |
| salvo | `{ ok: true, values: { name, pixKey } }` |

`values` nunca tem `currentPassword` nem `savedPixKey`.

## Visibilidade do campo "Senha atual" (cliente)

```text
visível = isPixKeyChange(chave digitada, savedPixKey) || Boolean(state.passwordError)
```

- O valor é recalculado a cada digitação na chave e a cada novo estado do servidor.
- Depois de salvar, `savedPixKey` passa a ser a chave nova, então o campo some.
