# Implementation Plan: Perfil que sempre abre, com todos os dados da conta e foto

**Branch**: `feature/015-perfil-resilient-avatar` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-perfil-resilient-avatar/spec.md` (issue #11)

## Summary

O Perfil passa a depender só de `getMe()`. Contador de grupos e categorias viram Server Components
async isolados por `<Suspense>` + boundary `catchError` (Next 16.3), cada um com erro local e
"Tentar de novo". `listCategories()` valida o formato da resposta. A tela de erro geral da área
logada registra o erro com `digest` e diferencia offline / serviço fora / inesperado, usando um
`digest` `API_UNAVAILABLE:<code>` que o `ApiError` carrega. O resumo mostra todos os campos de
`/users/me`; o avatar exibe a foto (com fallback para iniciais) e uma Server Action envia a foto nova.
Detalhes e alternativas em [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.3.5 (App Router)

**Primary Dependencies**: as já instaladas (`next`, `react`, `server-only`); nenhuma nova

**Storage**: N/A (dados vêm da `api-kottagroups`; foto guardada pela API)

**Testing**: `node --test` (`pnpm test`, arquivos `lib/**/*.test.mjs`) + Playwright (`pnpm test:e2e`)
com o proxy `e2e/mock-api-proxy.ts`

**Target Platform**: web (Vercel), mobile 375px e desktop

**Project Type**: web app Next.js (frontend que fala com a API no servidor)

**Performance Goals**: dados da conta visíveis sem esperar grupos/categorias (streaming); troca de
foto < 10 s em rede móvel comum (SC-004)

**Constraints**: foto JPG/PNG/WebP ≤ 5 MiB; `avatarUrl` é assinada e expira (não cachear);
`serverActions.bodySizeLimit` já é 11 MB

**Scale/Scope**: 1 página (`/perfil`), 1 boundary de erro, 1 componente de avatar, 1 Server Action

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Situação |
|---|---|
| I. Simplicity First | ✅ Usa `catchError`/`Suspense` nativos, `<img>` nativo, `apiRequest` com `FormData` já existente, padrão de `updateProfileAction`. Sem dependência nova (Sentry rejeitado). Um único fallback de seção reaproveitado nas duas seções. |
| II. Clean Code | ✅ Regras com nome de intenção (`avatarFileProblem`, `loadErrorKind`, `formatMemberSince`); constantes `AVATAR_MAX_BYTES`, `AVATAR_TYPES`, prefixo `API_UNAVAILABLE`. Erros tratados explicitamente (boundary por seção, mensagens por código). |
| III. Organized Structure | ✅ Regras puras em `lib/`, UI em `components/app` e `components/forms`, action em `app/actions/kotta.ts`, seções no próprio `app/(conta)/perfil/`. Sem barrel. |
| IV. Best Practices | ✅ `"use client"` só em `avatar-photo.tsx`, `avatar-form.tsx`, `section-error.tsx` (e `error.tsx`, que já é). Validação do arquivo antes do envio no cliente e na action; resposta de `/categories` validada na fronteira. Auth: `apiRequest` envia o token e trata 401/403 dentro da action. Acessibilidade: `aria-label`, foco visível, `aria-live`, `alt=""` (imagem decorativa ao lado do nome). Tokens `kotta-*`. `VERSION` não existe (research R9). |
| V. Testable by Default | ✅ Testes `node --test` para `loadErrorKind`, `avatarFileProblem`, `formatMemberSince`, mensagens de avatar e `digest` do `ApiError`; e2e para Perfil com `/categories` falhando e arquivo inválido. |

Resultado: sem violações. Re-checado após a Phase 1: mantém-se.

## Project Structure

### Documentation (this feature)

```text
specs/015-perfil-resilient-avatar/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/profile-ui.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── (conta)/
│   ├── error.tsx                 # loga error+digest; passa kind ao LoadError
│   └── perfil/page.tsx           # só getMe(); GroupCount e CategoryList isolados
└── actions/kotta.ts              # + updateAvatarAction

components/
├── app/
│   ├── avatar.tsx                # AvatarPerson.avatarUrl; delega para AvatarPhoto
│   ├── avatar-photo.tsx          # NOVO (client): <img> com fallback onError
│   ├── load-error.tsx            # textos por kind + código
│   └── section-error.tsx         # NOVO (client): SectionBoundary = catchError(...)
└── forms/
    └── avatar-form.tsx           # NOVO (client): seletor, prévia, envio, aria-live

lib/
├── avatar.ts (+ avatar.test.mjs)         # NOVO: limites e avatarFileProblem
├── load-error.ts (+ load-error.test.mjs) # NOVO: loadErrorKind
├── dates.ts (+ dates.test.mjs)           # + formatMemberSince
└── api/
    ├── errors.ts (+ errors.test.mjs)     # digest API_UNAVAILABLE; mensagens de avatar
    └── kotta.ts                          # getMe normaliza avatarUrl; listCategories valida

e2e/
├── mock-api-proxy.ts             # + PUT/DELETE /__mock/fail
└── profile.spec.ts               # + /categories falhando; arquivo inválido
```

`components/app/app-shell.tsx` não muda: já passa `me` inteiro para `Avatar`, que passa a usar
`avatarUrl` (a foto aparece na sidebar do desktop; o header mobile não tem avatar hoje).

**Structure Decision**: app Next.js único na raiz; mudanças concentradas na rota `/perfil`, nos
componentes de avatar/erro e em regras puras de `lib/`.

## Complexity Tracking

Nenhuma violação a justificar.
