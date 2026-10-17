# Data Model: Convidar para o grupo por link e por e-mail

A web não guarda dados: tudo vem da API. Abaixo, os tipos novos em `lib/api/types.ts`, os valores
de view em `lib/invites.ts` e as regras de validação.

## Tipos da API (`lib/api/types.ts`)

```ts
type ApiInviteStatus = "active" | "expired" | "revoked" | "exhausted";

interface ApiGroupInvite {
  id: string;
  groupId: string;
  createdBy: string;      // id do usuário
  email: string | null;
  maxUses: number;
  uses: number;
  expiresAt: string;      // ISO
  revokedAt: string | null;
  createdAt: string;
  status: ApiInviteStatus;
}

interface ApiGroupInviteCreated {
  invite: ApiGroupInvite;
  token: string;          // não sai da Server Action
  url: string;            // <web>/convite/<token>
  emailSent: boolean;
}

interface ApiInvitePreview {
  group: { name: string; emoji: string };
  inviterName: string;
  expiresAt: string;
}

interface ApiInviteAccepted {
  groupId: string;
  joined: boolean;        // false = já era membro
}
```

`ApiGroupInvitePage` reusa o formato de página com cursor já existente (`items`, `nextCursor`,
`hasMore`).

## Valores de view (`lib/invites.ts`, puros e testados)

| Nome | Forma | Uso |
|---|---|---|
| `InviteFormInput` | `{ email: string \| null; maxUses: number; expiresInHours: number }` | corpo do `POST /groups/{id}/invites` |
| `InviteFormErrors` | `Partial<Record<"email" \| "maxUses" \| "expiresInHours", string>>` | erros junto ao campo |
| `CreatedInviteView` | `{ url; email; emailSent; maxUses; expiresAt }` | resultado mostrado no modal (sem `token`) |
| `InviteRow` | `{ id; target: string /* e-mail ou "Link" */; creatorName; uses; maxUses; expiresAt; createdAt; statusLabel }` | linha da lista |

## Constantes

| Constante | Valor | Origem |
|---|---|---|
| `INVITE_MAX_USES_MIN` / `_MAX` | 1 / 100 | API 071 FR-003 |
| `INVITE_EXPIRY_OPTIONS` | `[{hours:1,"1 hora"},{hours:24,"1 dia"},{hours:168,"7 dias"},{hours:720,"30 dias"}]` | R11 |
| `INVITE_DEFAULT_EXPIRY_HOURS` | 168 | API padrão |
| `INVITE_LIST_LIMIT` | 50 | R10 |
| `INVITE_TOKEN_PATTERN` | `/^[A-Za-z0-9_-]{16,256}$/` | R9 |

## Regras de validação (`parseInviteForm`)

- `email`: vazio → `null`; preenchido → precisa casar com o `EMAIL_PATTERN` de
  `lib/auth-validation.ts` (passa a ser exportado, sem duplicar a regex) → erro "Informe um e-mail
  válido."
- `maxUses`: inteiro entre 1 e 100 → erro "Escolha de 1 a 100 pessoas."; com `email` preenchido,
  forçado a 1 (a opção nem aparece).
- `expiresInHours`: precisa ser um dos valores de `INVITE_EXPIRY_OPTIONS` → erro "Escolha uma
  validade da lista."
- Formulário vazio = convite padrão (uso único, 7 dias).

## Estados

### Convite (lista)

```text
active ──(usos == máximo)──▶ exhausted   rótulo "Usado"
active ──(passa a validade)─▶ expired    rótulo "Expirado"
active ──(Revogar)──────────▶ revoked    rótulo "Revogado"
```

Só `active` aparece em "Pendentes" e tem "Revogar". Estados finais não voltam.

### Página `/convite/[token]`

| Estado | Condição | Mostra |
|---|---|---|
| `invalid` | token fora do formato, ou prévia `INVITE_INVALID`, ou `?erro=INVITE_INVALID` | mensagem única + Painel (logado) / Entrar (sem sessão) |
| `guest` | prévia ok, sem sessão | prévia + "Criar conta" + "Já tenho conta" |
| `member-ready` | prévia ok, com sessão | prévia + "Entrando como <e-mail>" + "Entrar no grupo" |
| `email-mismatch` | `?erro=INVITE_EMAIL_MISMATCH` | prévia + aviso + "Sair e entrar com outra conta" |
| `error` | prévia falhou por outro motivo (rede, 429) | mensagem amigável + "Tentar de novo" |

`?erro=` com outro código (ex.: `RATE_LIMITED`) mostra a mensagem acima do botão em `member-ready`.

## Funções puras em `lib/invites.ts`

`isInviteTokenShape`, `inviteReturnPath`, `parseInviteForm`, `splitInvites` (→ pendentes/encerrados
como `InviteRow[]`, com nome do criador por mapa de membros e "Ex-membro" de fallback),
`invitePageState` (prévia + sessão + `erro` → estado da tabela), `qrSvgPath`, `redactInviteUrl`.
