# Contrato consumido: URL da foto de perfil

Fonte: `api-kottagroups/api/openapi.yaml` (`PublicUser.avatarUrl`, `/api/v1/avatars/{userID}/{file}`),
commit `edd0405`.

## Onde a URL chega

| Chamada | Campo |
|---------|-------|
| `GET /api/v1/users/me` | `avatarUrl` |
| `PATCH /api/v1/users/me` | `avatarUrl` |
| `POST /api/v1/users/me/avatar` | `avatarUrl` (a nova, diferente da anterior) |

## Formato

```text
https://api.kottagroups.com.br/api/v1/avatars/{userID}/{ulid}.{jpg|png|webp}
```

- Absoluta, sem query string. `userID` e `ulid`: ULID canônico (26 caracteres).
- Ausente quando a conta não tem foto.

## Leitura da imagem (`GET /api/v1/avatars/{userID}/{file}`)

- Pública: sem Bearer, sem cookie. O front não manda credencial.
- `200`: bytes da imagem, `Cache-Control: public, max-age=31536000, immutable`,
  `Cross-Origin-Resource-Policy: cross-origin`, sem `Set-Cookie`.
- `404` / `415` / `503`: JSON de erro com `Cache-Control: no-store`. No front: iniciais.

## O que o front garante

1. Usa `avatarUrl` exatamente como veio (FR-001, FR-002).
2. Carrega a imagem direto dessa URL, sem otimizador intermediário (FR-006).
3. Não busca dados de novo para "renovar" a URL (FR-003).
4. Se uma CSP for adotada, ela inclui em `img-src` a origem de `API_ORIGIN` e `blob:` (prévia local
   do upload em `components/forms/avatar-form.tsx`) (FR-007).
