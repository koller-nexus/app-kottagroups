# Implementation Plan: Convidar para o grupo por link e por e-mail

**Branch**: `feature/019-group-invite-links` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/019-group-invite-links/spec.md`

## Summary

Telas da web para a API de convites (spec 071 da API, já em produção): página pública
`/convite/[token]` (prévia → cadastro/login com `next` → "Entrar no grupo"), modal "Convidar" para
dono/admin (link, copiar, compartilhar, QR, envio por e-mail, P3: várias pessoas e validade) e a
seção "Convites" em Membros (pendentes/encerrados, revogar). Tudo via `apiRequest` no servidor e
Server Actions; regras puras em `lib/invites.ts` com `node --test`. Uma dependência nova (`uqr`) para
gerar QR. O segredo da URL é protegido de buscadores, Referer e analytics.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.2.8

**Primary Dependencies**: Next.js 16.3.5 (App Router), Tailwind CSS 4, `@vercel/analytics`,
`@vercel/speed-insights`; **nova**: `uqr@0.1.3` (gerar QR; justificada em research R1)

**Storage**: N/A (dados da API Kotta; sessão em cookie `HttpOnly`)

**Testing**: `pnpm test` (`node --test lib/*.test.mjs lib/api/*.test.mjs`); roteiro manual em
[quickstart.md](./quickstart.md); E2E Playwright opcional (depende de API com convites)

**Target Platform**: web mobile-first (375 px) e desktop; deploy na Vercel

**Project Type**: web-app (front Next.js; API em repositório separado)

**Performance Goals**: página pública com 1 chamada à API sem sessão (prévia) e 2 com sessão
(prévia + `getMe`, em paralelo); `uqr` só no bundle do modal (dono/admin), nunca na página pública

**Constraints**: token de sessão nunca no navegador; token do convite nunca em logs, analytics,
Referer ou índice de busca; textos de UI em pt-BR, código e erros de API em inglês

**Scale/Scope**: 1 rota nova, 3 Server Actions, 4 componentes, ~10 arquivos existentes tocados
(ver [contracts/ui.md](./contracts/ui.md))

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Nota |
|---|---|---|
| I. Simplicity First | ✅ | Reusa `apiRequest`, encadeamento de `next` (specs 016/017), `CopyTextButton`, `<dialog>` nativo, `window.confirm`, `canDeleteGroup`, `EMAIL_PATTERN`. Sem "carregar mais" na lista (R10). 1 dependência nova (`uqr`): codificar QR passa muito de 20 linhas; sem alternativa nativa (R1). |
| II. Clean Code | ✅ | Limites e opções como constantes nomeadas (data-model); estado da página por função pura `invitePageState`; nada de boolean que troca comportamento. Identificadores em inglês, UI em pt-BR. |
| III. Organized Structure | ✅ | Componentes em `components/invites/`, actions em `app/actions/invites.ts`, regras em `lib/invites.ts`, rota em `app/(acesso)/convite/[token]/`. Sem barrel. |
| IV. Best Practices | ✅ | Server Components por padrão; `"use client"` só em `InviteDialog`, `QrCode`, `RevokeInviteButton`. Actions validam entrada antes da API e autenticam via `apiRequest` (`server-only`). Prévia e `getMe` em `Promise.all`. Tokens `kotta-*`. Foco, labels, `aria-live`, reduced motion. Regra do `VERSION`: arquivo não existe (pendência registrada na constituição), sem ação. |
| V. Testable by Default | ✅ | `lib/invites.test.mjs` cobre todas as regras puras (data-model); teste dos códigos novos em `friendlyMessage`. |

Sem violações → Complexity Tracking vazio.

**Re-check pós-design**: ✅ mantido. O design só acrescentou um campo opcional em `logoutAction` e o
`next` no cadastro, ambos reaproveitando fluxos existentes.

## Project Structure

### Documentation (this feature)

```text
specs/019-group-invite-links/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api-consumed.md
│   └── ui.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── (acesso)/
│   ├── convite/[token]/page.tsx        # NOVO: página pública do convite
│   └── cadastrar/page.tsx              # repassa next
├── (conta)/grupos/[id]/
│   ├── page.tsx                        # botão Convidar + aviso ?aviso=
│   └── membros/page.tsx                # botão Convidar + seção Convites
├── actions/
│   ├── invites.ts                      # NOVO: create/revoke/accept
│   └── auth.ts                         # logoutAction aceita next
└── layout.tsx                          # beforeSend redige /convite/<token>
components/
├── invites/                            # NOVO
│   ├── invite-dialog.tsx
│   ├── qr-code.tsx
│   ├── invite-list.tsx
│   └── revoke-invite-button.tsx
├── auth/register-form.tsx              # campo hidden next
└── app/copy-text-button.tsx            # texto de falha configurável
lib/
├── invites.ts                          # NOVO: regras puras
├── invites.test.mjs                    # NOVO
├── permissions.ts                      # canInviteMembers
├── auth-validation.ts                  # exporta EMAIL_PATTERN
└── api/
    ├── types.ts                        # tipos de convite
    ├── kotta.ts                        # previewInvite, listGroupInvites
    └── errors.ts                       # INVITE_INVALID, INVITE_EMAIL_MISMATCH
```

**Structure Decision**: app Next.js único, seguindo a organização atual por capacidade
(`components/<domínio>/`, `app/actions/<domínio>.ts`, `lib/<domínio>.ts`). A rota pública entra no
grupo `(acesso)` para herdar o `PublicFrame`, e o `proxy.ts` não muda porque `/convite` não está em
`PROTECTED` nem em `GUEST_ONLY`.

## Complexity Tracking

Sem violações.
