# Implementation Plan: Layout web e fluxos de entrar e sair

**Branch**: `003-web-layout-auth-flows` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-web-layout-auth-flows/spec.md`

## Summary

Trocar as medidas herdadas do mobile por um layout web consistente e consertar os fluxos de
sessão. No layout: duas larguras de conteúdo (visão 1120 px, leitura 720 px) como tokens do tema;
um componente `<Page>` que aplica largura, cabeçalho e ritmo vertical nas 17 páginas logadas; o
Painel em duas colunas no desktop; e uma única moldura para as seis telas de acesso. Na sessão:
"Sair" com estado de andamento na barra lateral, no Perfil e em "Confirme seu e-mail"; aviso
"Você saiu da conta."; o `GET /sair` só apaga o cookie depois de a API confirmar o 401; e o retorno
à página de origem quando a sessão expira (o proxy grava o caminho num cabeçalho interno).

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.3.5 (App Router, `proxy.ts`)

**Primary Dependencies**: Next.js, Tailwind CSS 4 — nenhuma dependência nova

**Storage**: Cookie httpOnly `kotta_session` (sem mudança de formato)

**Testing**: `node --test` via `pnpm test` (`lib/**/*.test.mjs`) + validação manual em `quickstart.md`

**Target Platform**: Navegadores atuais (Chrome, Safari, Firefox) de 320 a 1920 px; deploy Vercel

**Project Type**: Aplicação web (frontend Next.js; a API Go em `../api-kottagroups` não muda)

**Performance Goals**: Nenhuma chamada extra no caminho normal. `GET /sair` faz uma chamada
(`/users/me`) só quando a sessão já expirou.

**Constraints**: Tokens de `DESIGN.md` intocados (FR-024); selos das lojas conforme `AGENTS.md`;
URLs públicas não mudam.

**Scale/Scope**: 17 páginas logadas, 6 telas de acesso, a página inicial, o shell e 3 pontos de sair

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|---|---|---|
| I. Simplicity First | Nenhuma dependência nova. Abstrações novas: `<Page>` (usado 17×, substitui wrappers repetidos), `LogoutButton` (3×), `SubmitLostNotice` (1×, exigido pelo caso de borda), funções puras em `lib/session-flow.ts`. Moldura de acesso unificada **apagando** duas cópias. Sem guardar rascunho de formulário (Clarification 3). | Pass |
| II. Clean Code | `DashboardView` (184 linhas) só ganha os wrappers de coluna; `forget-password-screen.tsx` (239 linhas) **encolhe** ao perder a moldura. `grupos/[id]/page.tsx` (462 linhas) já passa de 200: a mudança aqui toca só o wrapper; não aumenta. | Pass (dívida existente registrada abaixo) |
| III. Organized Structure | Telas de link de e-mail vão para `app/(acesso)/`, ao lado das irmãs. Regras de sessão em `lib/session-flow.ts`. | Pass |
| IV. Best Practices | Server Components por padrão; cliente só em `LogoutButton`, `SubmitLostNotice` e o `LoginForm` existente. `server-only` mantido em `lib/api/*`. `/sair` decide no handler, consultando a API. Tokens de largura no `@theme`, sem hex novo. Acessibilidade: `role="alert"`, foco no erro, alvos de 44 px, sem rolagem horizontal. Arquivo `VERSION`: não existe e esta feature não introduz versionamento. | Pass |
| V. Testable by Default | `lib/session-flow.test.mjs` cobre `motivo`, montagem das URLs de expiração e o `next`. Layout validado pelo quickstart (não há runner de UI no projeto). | Pass |
| Stack & Workflow | `pnpm lint`, `pnpm test` e `pnpm build` obrigatórios. A árvore está em `main`: implementar num branch `feature/003-web-layout-auth-flows` e abrir PR. | Pass (ação: criar branch) |

Pós-design (Phase 1): reavaliado, sem violações novas.

## Project Structure

### Documentation (this feature)

```text
specs/003-web-layout-auth-flows/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── routes.md
├── checklists/
│   └── requirements.md
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
proxy.ts                                   # grava x-kotta-path
app/
├── globals.css                            # --container-reading / --container-view
├── page.tsx                               # prévia sem login: margens web + Painel em 2 colunas
├── sair/route.ts                          # só apaga cookie após 401 confirmado
├── actions/auth.ts                        # logoutAction -> /entrar?motivo=saiu
├── (acesso)/
│   ├── layout.tsx                         # moldura única
│   ├── entrar/page.tsx                    # avisos por motivo
│   ├── confirme-seu-email/page.tsx        # usa LogoutButton
│   ├── confirm-email/page.tsx             # movido de app/confirm-email
│   └── forget-password/page.tsx           # movido de app/forget-password
└── (conta)/**/page.tsx                    # 17 páginas passam a usar <Page width=…>
components/
├── app/
│   ├── app-shell.tsx                      # max-w-view, margens, LogoutButton, SubmitLostNotice
│   ├── sidebar-nav.tsx                    # lista de grupos rola; área da conta fixa
│   ├── page-header.tsx                    # + <Page>
│   ├── submit-lost-notice.tsx             # novo (cliente)
│   ├── dashboard.tsx                      # remove max-w-2xl
│   └── dashboard-view.tsx                 # 2 colunas em lg
├── auth/
│   ├── login-form.tsx                     # foco no erro
│   └── logout-button.tsx                  # novo (cliente)
├── confirm-email/confirm-email-screen.tsx # sem moldura própria
└── forget-password/forget-password-screen.tsx
lib/
├── api/server.ts                          # 401 -> /sair com motivo e next
├── session-flow.ts                        # novo: funções puras
└── session-flow.test.mjs                  # novo
DESIGN.md                                  # nota do Painel em 2 colunas no desktop
```

**Structure Decision**: Projeto único Next.js já existente. Nenhuma pasta nova além dos arquivos
listados; as telas de link de e-mail mudam de pasta para dentro do grupo `(acesso)` sem mudar URL.

## Complexity Tracking

Sem violações a justificar. Registros:

| Item | Observação |
|---|---|
| `app/(conta)/grupos/[id]/page.tsx` com 462 linhas | Dívida anterior (II pede ≤ 200 para componentes). Fora do escopo; esta feature não aumenta o arquivo. Sugerido follow-up para dividir por aba. |
| Textos de validação em pt-BR | A constituição II pede validação em inglês, mas a UI do produto já é pt-BR. Os avisos novos são texto de interface. Sugerida emenda PATCH esclarecendo "validation text" = mensagens da API. |
| Revogação de token no servidor | A API não oferece (research R1). Follow-up na API se for exigido. |
