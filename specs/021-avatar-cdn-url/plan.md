# Implementation Plan: Foto de perfil com endereço fixo, guardada em cache pelo navegador

**Branch**: `feature/021-avatar-cdn-url` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/021-avatar-cdn-url/spec.md`

## Summary

A API (PR #244) já devolve `avatarUrl` como URL absoluta, pública e imutável, servida com cache de um
ano. O front já usa essa URL como veio, num `<img>` simples, com fallback para iniciais e remontagem
quando a URL muda. O trabalho é quase todo remoção: tirar a normalização de URL relativa em `getMe`,
trocar os comentários que descrevem a foto como link assinado e temporário, e apertar o e2e do upload
para exigir a URL estável sem query string. Sem `next/image`, sem `remotePatterns`, sem CSP nova
(não existe hoje). Fotos de membros ficam de fora: a API não manda `avatarUrl` em `GroupMember`
(ver [research.md](research.md) R5).

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.2, Next.js 16.3 (App Router)

**Primary Dependencies**: nenhuma nova

**Storage**: N/A

**Testing**: `pnpm test` (node:test em `lib/*.test.mjs`), Playwright em `e2e/` contra a API local

**Target Platform**: web (celular e desktop), Vercel

**Project Type**: web application (front de `api-kottagroups`)

**Performance Goals**: foto já vista exibida do cache do navegador, sem nova transferência (SC-001)

**Constraints**: usar `avatarUrl` como veio; nada de cache-buster; sem otimizador intermediário

**Scale/Scope**: 3 arquivos de código + 1 teste e2e

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Nota |
|-----------|--------|------|
| I. Simplicity First | ✅ | Remove código sem uso (R2); sem dependência, config ou abstração nova; `<img>` em vez de `next/image` (R3). |
| II. Clean Code | ✅ | Comentários passam a explicar o porquê atual; nenhum comentário velho fica. |
| III. Organized Structure | ✅ | Mudanças nos arquivos donos do comportamento; nenhum arquivo novo. |
| IV. Best Practices | ✅ | `Avatar` segue Server Component; só `AvatarPhoto` é cliente, como já é. Sem arquivo `VERSION` no projeto, nada a incrementar. Nenhuma API nova do Next. |
| V. Testable by Default | ✅ | E2e existente apertado (R7); motivo escrito para não ter teste unitário (sem regra nova em `lib/`). |

Pós-design: sem mudança; nenhuma violação. Complexity Tracking vazio.

## Project Structure

### Documentation (this feature)

```text
specs/021-avatar-cdn-url/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/avatar-url.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
lib/api/kotta.ts                # getMe: remover a normalização da URL da foto (R2)
components/app/avatar.tsx       # comentário de AvatarPerson.avatarUrl: URL estável, muda a cada upload
components/app/avatar-photo.tsx # comentários: fallback para foto removida/erro de rede; <img> pelo cache direto
e2e/profile.spec.ts             # upload: src no formato estável, sem query, diferente do anterior
```

Sem mudança: `components/forms/avatar-form.tsx` e `app/actions/kotta.ts` (revalidação já traz a URL
nova, R4), `next.config.ts` (sem `remotePatterns`, R3), CSP (não existe, R6). Os comentários de
"URL assinada" em `components/app/invoice-photo.tsx` e na página de lista de compras são de notas
fiscais e continuam certos.

**Structure Decision**: app Next.js único na raiz; mudanças nos arquivos acima.

## Follow-ups

- Issue em `koller-nexus/api-kottagroups`: incluir `avatarUrl` em `GroupMember` para as listas de
  membros mostrarem fotos. No front, depois, só acrescentar o campo em `ApiGroupMember`.

## Complexity Tracking

Sem violações.
