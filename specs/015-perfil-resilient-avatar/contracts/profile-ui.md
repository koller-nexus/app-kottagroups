# Contract: Perfil (UI, Server Action e controle de e2e)

## Página `/perfil`

| Região | Fonte | Se falhar |
|---|---|---|
| Resumo da conta (foto, nome, e-mail, chave Pix, membro desde, status do e-mail, sair) | `getMe()` | tela de erro geral `app/(conta)/error.tsx` |
| Contador de grupos (dentro do resumo) | `listGroups()` | "Não foi possível carregar seus grupos." + "Tentar de novo"; contador omitido |
| Seus dados (e-mail somente leitura + formulário nome/Pix) | `getMe()` | — |
| Categorias | `listCategories()` | "Não foi possível carregar suas categorias." + "Tentar de novo"; "Gerenciar categorias" continua visível |

Ordem de leitura para leitor de tela e teclado: resumo → Seus dados → Categorias.

## Tela de erro geral (`LoadError`)

| `loadErrorKind` | Título | Texto |
|---|---|---|
| `offline` | Você está sem conexão | Verifique sua internet e tente de novo. |
| `unavailable` | O Kotta Groups não respondeu | O serviço está fora do ar agora. Tente de novo em instantes. |
| `unexpected` | Algo deu errado | Tivemos um problema ao abrir esta tela. Tente de novo. Código: `{digest}` |

Sempre com o botão "Tentar de novo" (`retry()`). O erro é registrado com `console.error` contendo
`digest`.

## Server Action `updateAvatarAction(prev: AvatarFormState, formData: FormData)`

- Entrada: `formData.get("file")` (`File`).
- Valida com `avatarFileProblem`; inválido → `{ error }` sem chamar a API.
- Chama `POST /api/v1/users/me/avatar` (multipart, campo `file`).
- Sucesso → `revalidatePath("/", "layout")` e `{ ok: true }`.
- Erros (mensagem via `friendlyMessage`):

| Código da API | Mensagem |
|---|---|
| `AVATAR_TOO_LARGE` | A foto passa de 5 MB. Escolha uma menor. |
| `INVALID_AVATAR_TYPE` | Use uma foto JPG, PNG ou WebP. |
| `VALIDATION_FAILED` | Escolha uma foto. (sobrescrito na action) |
| `RATE_LIMITED` | Muitas tentativas seguidas. Espere alguns minutos e tente de novo. (já existe) |
| `STORAGE_UNAVAILABLE` | O armazenamento de arquivos está fora do ar. Tente de novo mais tarde. (já existe) |
| outro | Não foi possível atualizar a foto. Tente de novo. (`code`) |

## Formulário de foto (acessibilidade)

- Botão/label com `aria-label="Alterar foto de perfil"`, foco visível (`focus-visible:outline-*`).
- `<input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only">`.
- Região `aria-live="polite"` com "Enviando…", "Foto atualizada." ou a mensagem de erro.

## Controle do proxy de e2e (`e2e/mock-api-proxy.ts`)

- `PUT /__mock/fail` body `{ "path": "/api/v1/categories", "status": 503 }` → `GET` nesse path
  responde `status` com `{ "error": { "code": "SERVICE_UNAVAILABLE", "message": "Mock failure." } }`.
- `DELETE /__mock/fail` → limpa todas as falhas.
