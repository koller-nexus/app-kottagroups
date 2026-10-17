# Contrato consumido: API de convites (api-kottagroups spec 071)

Fonte: `koller-nexus/api-kottagroups` → `specs/071-group-invite-links/contracts/invites.md`.
Todas as rotas sob `/api/v1`, sucesso embrulhado em `{ "data": … }` (desembrulhado por `apiRequest`),
erro `{ "code", "message" }`.

| Uso na web | Chamada | Auth | Sucesso | Erros tratados |
|---|---|---|---|---|
| Gerar convite (modal) | `POST /groups/{id}/invites` `{ email?, maxUses?, expiresInHours? }` | sessão, dono/admin | 201 `GroupInviteCreated` | 400 `VALIDATION_FAILED`, 403 `FORBIDDEN`, 404, 429 `RATE_LIMITED` |
| Lista (Membros) | `GET /groups/{id}/invites?limit=50` | sessão, dono/admin | 200 `{ items, nextCursor, hasMore }` | 403, 404 → aviso local |
| Revogar | `DELETE /groups/{id}/invites/{inviteId}` | sessão, dono/admin | 204 (idempotente) | 403, 404 |
| Prévia (página pública) | `POST /invites/preview` `{ token }` | **nenhuma** (`auth: false`) | 200 `InvitePreview` | 400/404 `INVITE_INVALID` → estado inválido; 429 |
| Entrar no grupo | `POST /invites/accept` `{ token }` | sessão | 200 `{ groupId, joined }` | 401 → `/sair`; 403 `EMAIL_NOT_CONFIRMED` → `/confirme-seu-email?next=`; 403 `INVITE_EMAIL_MISMATCH`; 404 `INVITE_INVALID`; 429 |

Tipos: ver [data-model.md](../data-model.md).

Regras que a web **não** reimplementa (a API decide): validade, contagem atômica de usos, comparação
de e-mail sem diferenciar maiúsculas, limite de tentativas, permissões.
