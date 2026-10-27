# Contract: salvamento do perfil (`updateProfileAction` → `PATCH /api/v1/users/me`)

Fonte do lado da API: `api-kottagroups/specs/094-pix-key-reauth/contracts/patch-users-me.md`
(PR api#254) e `api/openapi.yaml` (`PatchMe`).

## O que o app envia

| Situação no formulário | Corpo |
|------------------------|-------|
| só o nome mudou (ou nada) | `{"name": "<nome>"}` |
| chave trocada ou primeira chave | `{"name": "<nome>", "pixKey": "<chave>", "currentPassword": "<senha>"}` |
| chave apagada | `{"name": "<nome>", "pixKey": null, "currentPassword": "<senha>"}` |

O app nunca envia `email`. Também não envia `currentPassword` sem `pixKey`.

## Como o app trata a resposta

| Resposta da API | No formulário |
|-----------------|---------------|
| 200 | "Alterações salvas."; o resumo e o shell mostram os dados novos; o campo de senha some |
| 400 `CURRENT_PASSWORD_REQUIRED` | erro no campo de senha: "Digite sua senha atual para trocar a chave Pix." |
| 403 `CURRENT_PASSWORD_INVALID` | erro no campo de senha: "Senha incorreta."; a pessoa continua logada |
| 429 `RATE_LIMITED` | erro no campo de senha: `rateLimitMessage(Retry-After)` |
| 400 `VALIDATION_FAILED` | erro geral: "Confira os campos e tente de novo." |
| 401 | sessão expirada → `/entrar` (como hoje, via `apiRequest`) |
| 403 `EMAIL_NOT_CONFIRMED` | confirmar e-mail (como hoje, via `apiRequest`) |
| 503 / rede | erro geral genérico |

Em todas as recusas, nome e chave digitados continuam no formulário, e o campo de senha volta
vazio.

## Ordem de deploy

A API foi primeiro (api#254). Sem este PR, trocar a chave pelo app mostra o erro genérico e editar
o nome continua funcionando. Este PR não depende de flag nem de configuração.
