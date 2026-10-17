# Contrato de interface: rotas, actions e componentes

## Rota pública `/convite/[token]`

- Arquivo: `app/(acesso)/convite/[token]/page.tsx` (layout de acesso já existente, centrado e sem
  shell logado). **Não** entra em `PROTECTED` nem em `GUEST_ONLY` do `proxy.ts`.
- Query aceita: `erro=<CODE>` (vindo de `acceptInviteAction`).
- Metadata: título "Convite — Kotta Groups", `robots: { index: false, follow: false }`,
  `referrer: "no-referrer"`.
- Estados: ver tabela em [data-model.md](../data-model.md#página-convitetoken).
- Saídas:
  - "Criar conta" → `/cadastrar?next=/convite/<token>`
  - "Já tenho conta" → `/entrar?next=/convite/<token>`
  - "Entrar no grupo" → `acceptInviteAction`
  - "Sair e entrar com outra conta" → `logoutAction` com `next=/convite/<token>`
  - inválido: "Ir para o Painel" (`/`) com sessão, "Entrar" (`/entrar`) sem.

## Server Actions — `app/actions/invites.ts` (`"use server"`)

| Action | Entrada (`FormData`) | Saída |
|---|---|---|
| `createInviteAction(prev, fd)` | `groupId`, `email?`, `maxUses?`, `expiresInHours?` | `InviteFormState`: `{ created?: CreatedInviteView; error?; fieldErrors?; values? }`; revalida `/grupos/<id>/membros` |
| `revokeInviteAction(fd)` | `groupId`, `inviteId` | revalida `/grupos/<id>/membros`; erro → `?erro=<CODE>` na página de Membros |
| `acceptInviteAction(fd)` | `token` | redirect `/grupos/<groupId>?aviso=entrou\|ja-membro`; erro → `/convite/<token>?erro=<CODE>` |

Todas validam a entrada antes de chamar a API e autenticam via `apiRequest` (token de sessão no
servidor).

## Mudanças em código existente

| Arquivo | Mudança |
|---|---|
| `lib/permissions.ts` | `canInviteMembers = canDeleteGroup` |
| `lib/api/types.ts` | tipos de convite |
| `lib/api/kotta.ts` | `previewInvite(token)`, `listGroupInvites(groupId)` |
| `lib/api/errors.ts` | `INVITE_INVALID`, `INVITE_EMAIL_MISMATCH` em `friendlyMessage` |
| `app/(acesso)/cadastrar/page.tsx`, `components/auth/register-form.tsx` | repassar `next` |
| `app/actions/auth.ts` | `logoutAction` aceita `next` opcional |
| `app/layout.tsx` | `beforeSend` em `Analytics`/`SpeedInsights` com `redactInviteUrl` |
| `app/(conta)/grupos/[id]/page.tsx` | botão "Convidar" (dono/admin, grupo não arquivado) e aviso `?aviso=entrou\|ja-membro` |
| `app/(conta)/grupos/[id]/membros/page.tsx` | botão "Convidar" + seção "Convites" (`<Suspense>`) |
| `components/app/copy-text-button.tsx` | texto de falha configurável (hoje cita "Sua chave") |
| `package.json` | `uqr@0.1.3` |

## Componentes novos

| Componente | Tipo | Responsabilidade |
|---|---|---|
| `components/invites/invite-dialog.tsx` | cliente | botão "Convidar" + `<dialog>`; formulário (e-mail, P3: várias pessoas/validade); resultado com link, copiar, compartilhar, QR, aviso "só aparece agora" |
| `components/invites/qr-code.tsx` | cliente | `encode(url)` do `uqr` → `<svg role="img" aria-label="QR code do convite">` com um `<path d={qrSvgPath(...)}>` |
| `components/invites/invite-list.tsx` | servidor (async) | busca, separa em Pendentes/Encerrados, estados vazio e erro, nota "o link só aparece na criação" |
| `components/invites/revoke-invite-button.tsx` | cliente | `window.confirm` antes de enviar (padrão de `delete-category-button.tsx`), botão com `aria-label` |

## Acessibilidade (verificável)

- Todos os controles ≥ 44 px de altura, foco visível com `focus-visible:outline-kotta-primary`.
- Campos com `<label>` visível; erro ligado por `aria-describedby`.
- "Link copiado", "Convite enviado para …", "Convite revogado" e o aviso no grupo em região
  `aria-live="polite"` / `role="status"`.
- Modal: foco no primeiro controle ao abrir, Esc fecha, foco volta ao botão "Convidar".
- Esqueletos respeitam `prefers-reduced-motion`.
