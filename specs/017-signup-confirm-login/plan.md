# Implementation Plan: Rever fluxo de criar conta, confirmação de e-mail e login

**Branch**: `feature/017-signup-confirm-login` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-signup-confirm-login/spec.md`

## Summary

Fechar os buracos do caminho cadastro → confirmação → login, adicionar Termos de Uso e Política de
Privacidade com aceite obrigatório e tirar da copy as menções a um app nativo. A abordagem reaproveita
as Server Actions de `app/actions/auth.ts`, move a confirmação do link para uma Server Action (para
saber da sessão e do "já confirmado"), concentra regras em módulos puros testáveis em `lib/`
(`auth-validation.ts`, `confirm-email.ts`, `session-flow.ts`, `api/errors.ts`) e cria o conteúdo legal
em TSX versionado, sem novas dependências.

Duas descobertas na API mudam o escopo (research R1, R2): o cadastro rejeita campos desconhecidos,
então as versões dos termos só são enviadas quando a API aceitar; e "expirado", "usado" e "inválido"
voltam iguais, então a tela junta expirado e inválido e detecta "já confirmado" via `/users/me`.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.2, Next.js 16.3 (App Router, `proxy.ts`)

**Primary Dependencies**: next, react, server-only (nada novo)

**Storage**: cookie `kotta_session` (existente); conteúdo legal em arquivos TSX no repo

**Testing**: `node --test` via `pnpm test` (`lib/*.test.mjs`, `lib/api/*.test.mjs`); Playwright fica para a #9

**Target Platform**: navegadores modernos, celular (375px) e desktop

**Project Type**: web app (front Next.js de uma API Go separada)

**Performance Goals**: nenhuma meta nova; sem polling (revalidação só no foco da aba)

**Constraints**: API rejeita campos desconhecidos no cadastro; senha ≤ 72 bytes; reenvio 1×/60 s;
link vale 24 h; copy em pt-BR, código e mensagens de erro HTTP em inglês

**Scale/Scope**: ~7 telas (cadastrar, entrar, confirme-seu-email, confirmar-email, redefinir-senha,
termos, privacidade), 1 link no Perfil, ~4 módulos de `lib/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Como |
|-----------|--------|------|
| I. Simplicity First | ✅ | Sem dependências (TSX em vez de MDX, R8); sem flag para o envio dos termos (R1); `refreshToken` não guardado sem uso (R6); sem polling (R10); sem `sessionStorage` para a contagem (R4) |
| II. Clean Code | ✅ | Regras com nome (`validateRegistration`, `confirmationOutcome`, `fieldErrorFromApi`); constantes nomeadas (`RESEND_INTERVAL_SECONDS`, `TERMS_VERSION`); `logoutAction` com destino por lista fechada, não booleano |
| III. Organized Structure | ✅ | Regras em `lib/`, UI de acesso em `components/auth/`, legal em `content/legal/` + `app/(legal)/` |
| IV. Best Practices | ✅ | `"use client"` só em formulários, `PasswordField`, contagem e revalidação no foco; validação repetida na Server Action; `aria-invalid`/`aria-describedby`; tokens `kotta-*`; `next` sempre por `safeNextPath`; destino de logout por lista fechada |
| V. Testable by Default | ✅ | Testes para `confirmationOutcome`, `validateRegistration`/`fieldErrorFromApi`, `friendlyMessage`/`retryAfter`, notice `conta-criada` e URL pós-cadastro |
| Regra `VERSION` | ⚠️ | Arquivo não existe (TODO já registrado na constituição); nada a fazer aqui |

**Pós-design**: reavaliado após Phase 1 — sem violações. Nenhuma entrada em Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/017-signup-confirm-login/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/routes-and-actions.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
lib/
├── auth-validation.ts        # NOVO: validateRegistration, validateLogin, fieldErrorFromApi, isPasswordLengthOk
├── auth-validation.test.mjs  # NOVO
├── confirm-email.ts          # confirmationOutcome (puro); remove o fetch cliente
├── confirm-email.test.mjs    # reescrito para os novos estados
├── session-flow.ts           # notice "conta-criada", accountCreatedLoginUrl(email)
├── session-flow.test.mjs
├── legal.ts                  # NOVO: TERMS_VERSION, PRIVACY_VERSION
└── api/
    ├── errors.ts             # retryAfter em ApiError, novos códigos, rateLimitMessage
    ├── errors.test.mjs
    └── server.ts             # lê Retry-After; EMAIL_NOT_CONFIRMED com next

app/
├── actions/auth.ts           # register/login com fieldErrors; confirmEmailAction; checkConfirmationAction; resend com retryAfter; logout com destino
├── (acesso)/
│   ├── cadastrar/page.tsx    # copy sem app
│   ├── entrar/page.tsx       # copy sem app; lê ?email=
│   ├── confirme-seu-email/page.tsx  # next, dica de spam, Já confirmei, corrigir e-mail, revalidar no foco
│   ├── confirmar-email/page.tsx     # movido de confirm-email/
│   └── redefinir-senha/page.tsx     # movido de forget-password/
├── (legal)/
│   ├── layout.tsx            # NOVO: layout de leitura
│   ├── termos/page.tsx       # NOVO
│   └── privacidade/page.tsx  # NOVO
└── (conta)/perfil/page.tsx   # links legais

content/legal/
├── terms-2026-10.tsx         # NOVO (rascunho)
└── privacy-2026-10.tsx       # NOVO (rascunho)

components/
├── auth/
│   ├── field.tsx             # prop error → aria-invalid + mensagem
│   ├── password-field.tsx    # NOVO (client): mostrar/ocultar
│   ├── register-form.tsx     # validação cliente, requisito de senha, aceite, foco no 1º erro
│   ├── login-form.tsx        # defaultEmail, PasswordField, erros por campo
│   ├── resend-confirmation.tsx  # contagem regressiva
│   ├── confirmation-check.tsx   # NOVO (client): Já confirmei + refresh no foco
│   └── logout-button.tsx     # destino opcional
├── confirm-email/confirm-email-screen.tsx  # novos estados e ações, usa confirmEmailAction
├── forget-password/forget-password-screen.tsx  # copy sem app, CTA Entrar, link /esqueci-a-senha
├── legal/legal-document.tsx  # NOVO: índice + seções + rascunho
└── app/public-frame.tsx      # rodapé com Termos e Privacidade

next.config.ts                # redirects /confirm-email e /forget-password
```

**Structure Decision**: app Next.js único. Regras puras em `lib/` (testáveis por `node --test`),
fluxos em `app/actions/auth.ts`, telas em `app/(acesso)` e o novo grupo `app/(legal)`.

## Ordem sugerida

1. Base: `lib/auth-validation.ts`, `lib/api/errors.ts` (+ `retryAfter` em `server.ts`), `lib/legal.ts`, testes.
2. US1 + US2 (P1): `registerAction` (fieldErrors, aceite, fallback `conta-criada`), `RegisterForm`,
   `Field`/`PasswordField`, termos/privacidade + layout, rodapé, Perfil, confirmação via Server Action,
   rota `/confirmar-email` + redirects, copy sem app.
3. US3: "Já confirmei", contagem, dica de spam, corrigir e-mail, refresh no foco.
4. US4: `?email=`, `next` preservado, `Retry-After` no login.
5. US5: foco no primeiro erro, loading consistente, títulos coerentes.
6. Issues na api-kottagroups (contracts → Dependências externas).

## Complexity Tracking

Nenhuma violação a justificar.
