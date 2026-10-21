# Data Model: Foto de perfil com endereço fixo

Sem dado novo. Só muda o significado de um campo que já existe.

## ApiUser.avatarUrl (`lib/api/types.ts`)

| Campo | Tipo | Regra |
|-------|------|-------|
| `avatarUrl` | `string \| null`, opcional | URL absoluta, estável e pública da foto atual. Ausente ou `null` = sem foto. Muda a cada upload; uma URL nunca passa a mostrar outra imagem. Usada como veio, sem montar nem acrescentar query. |

Formato (ver [contracts/avatar-url.md](contracts/avatar-url.md)):
`{origem da API}/api/v1/avatars/{userID}/{ulid}.{jpg|png|webp}`.

## AvatarPerson (`components/app/avatar.tsx`)

| Campo | Tipo | Regra |
|-------|------|-------|
| `id` | `string` | define a cor do fundo das iniciais |
| `name` | `string` | fonte das iniciais |
| `avatarUrl` | `string \| null`, opcional | igual a `ApiUser.avatarUrl`. Sem valor, ou se a imagem falhar, mostra as iniciais. |

## ApiGroupMember (`lib/api/types.ts`)

Sem `avatarUrl` (a API não manda). Membros aparecem com iniciais. Quando a API incluir o campo,
acrescentá-lo aqui; `Avatar` já o usa.

## Estados da foto

```text
sem avatarUrl ──────────────► iniciais
com avatarUrl ── carrega ───► foto (cache do navegador a partir da 2ª carga)
              └─ falha ─────► iniciais (onError)
upload ok ── nova avatarUrl ► remonta a foto (key = URL), estado de falha zerado
```
