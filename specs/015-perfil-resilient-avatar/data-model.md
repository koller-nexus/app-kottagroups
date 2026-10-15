# Data Model: Perfil resiliente, dados completos e foto

Nada novo é persistido pela web. Os tipos já existem em `lib/api/types.ts`.

## ApiUser (resposta de `GET /users/me` e de `POST /users/me/avatar`)

| Campo | Tipo | Uso no Perfil | Regras |
|---|---|---|---|
| `id` | string | cor do avatar | não exibir |
| `name` | string | resumo + formulário | — |
| `email` | string | resumo + "Seus dados" (completo, somente leitura) | quebrar linha, não truncar em "Seus dados" |
| `pixKey` | string \| null | resumo ("Chave Pix: …" ou "Nenhuma chave Pix cadastrada" → `#pixKey`) + formulário | vazio = sem chave |
| `avatarUrl` | string \| null | foto no resumo e na sidebar | normalizada com `new URL(url, apiOrigin())` em `getMe()`; nunca guardada no cliente |
| `createdAt` | ISO string | "Membro desde {mês} de {ano}" | inválida/ausente → linha omitida |
| `emailConfirmed` | boolean | badge + habilita "Alterar foto" | `false` → link `/confirme-seu-email` |

## AvatarPerson (`components/app/avatar.tsx`)

`{ id: string; name: string; avatarUrl?: string | null }`. Sem URL, ou com erro ao carregar a
imagem → iniciais.

## Arquivo de foto (validação em `lib/avatar.ts`)

- `AVATAR_MAX_BYTES = 5 * 1024 * 1024`
- `AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"]`
- `avatarFileProblem(file: { type: string; size: number } | null): string | null`
  - `null`/`size === 0` → "Escolha uma foto."
  - tipo fora da lista ou `size > AVATAR_MAX_BYTES` → "Use uma foto JPG, PNG ou WebP de até 5 MB"
  - válido → `null`

## Estado do formulário de foto (`AvatarFormState`)

| Estado | Visível | Ação |
|---|---|---|
| ocioso | foto atual (ou iniciais) + "Alterar foto" | abre seletor |
| inválido (cliente) | erro de validação | nada é enviado |
| enviando | prévia local + "Enviando…" (desabilitado) | — |
| sucesso | foto nova (vinda do servidor) + "Foto atualizada." | prévia revogada |
| erro (API) | foto anterior + mensagem do código | prévia revogada |
| e-mail não confirmado | aviso + link `/confirme-seu-email` | sem seletor |

## Tipo de erro da tela geral (`lib/load-error.ts`)

`loadErrorKind({ digest?: string; isOnline: boolean }): "offline" | "unavailable" | "unexpected"`

- `!isOnline` → `"offline"`
- `digest` começa com `API_UNAVAILABLE:` → `"unavailable"`
- senão → `"unexpected"`

`ApiError` ganha `digest = "API_UNAVAILABLE:<code>"` quando `status >= 500` ou o código é
`NETWORK_ERROR`, `SERVICE_UNAVAILABLE`, `EDGE_BLOCKED` ou `INTERNAL_ERROR`.
