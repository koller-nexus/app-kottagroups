# Implementation Plan: Pedir a senha atual para trocar a chave Pix no perfil

**Branch**: `feature/027-pix-key-password` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/027-pix-key-password/spec.md`

## Summary

A API (api#251, PR api#254) passou a exigir `currentPassword` para definir, trocar ou apagar a chave
Pix em `PATCH /users/me`. O front muda em três pontos:

- `updateProfileAction` manda `pixKey` só quando ela difere da chave salva, e junto vai a senha.
- `ProfileForm` mostra o campo "Senha atual" enquanto a chave digitada for diferente da salva, ou
  quando o servidor pediu a senha.
- Os erros `CURRENT_PASSWORD_REQUIRED`, `CURRENT_PASSWORD_INVALID` e `RATE_LIMITED` aparecem no
  campo de senha, sem perder nome e chave.

Uma função pura em `lib/profile-update.ts` monta o corpo do PATCH e traduz esses erros. O e2e de
`/perfil` cobre os quatro casos da issue; a senha errada vem do mock, para não gastar o limite de 5
tentativas por conta.

## Technical Context

**Language/Version**: TypeScript 5 (strict), Node 20+

**Primary Dependencies**: Next.js 16.4.2 (Server Actions, `useActionState`), React 19. Nenhuma
dependência nova.

**Storage**: N/A

**Testing**:

- `pnpm test` (node:test, `lib/*.test.mjs`)
- `pnpm test:e2e` (Playwright, API real atrás de `e2e/mock-api-proxy.ts`, `workers: 1`)

**Target Platform**: Vercel; e2e em `next start` local contra a API de teste

**Project Type**: web app Next.js (BFF da `api-kottagroups`)

**Performance Goals**: nenhuma chamada extra à API; o salvamento continua sendo um único PATCH

**Constraints**:

- A senha nunca volta ao navegador (FR-009).
- Editar só o nome não manda a chave (FR-001).
- Senha errada não encerra a sessão (FR-006): a API responde 403 sem `EMAIL_NOT_CONFIRMED`, e o
  `apiRequest` já só redireciona nesses casos.

**Scale/Scope**:

- 1 módulo novo com teste.
- 2 arquivos alterados: a action e o formulário.
- O mock do e2e ganha resposta por método e código.
- 3 testes e2e novos.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Situação |
|-----------|----------|
| I. Simplicity First | ✅ Reusa `Field`, `rateLimitMessage`, `friendlyMessage`, `failure` e o padrão `values` do `FormState`. A chave salva vai num campo oculto, sem buscar `/users/me` de novo (R1). Sem dependência nova. |
| II. Clean Code | ✅ Nomes em inglês (`profileUpdateBody`, `passwordErrorMessage`). Códigos de erro como constantes. Sem flag booleana alternando comportamento. Todo erro da API tratado de forma explícita. |
| III. Organized Structure | ✅ A regra do perfil fica em `lib/profile-update.ts`; action e formulário continuam onde estão. |
| IV. Best Practices | ✅ A action valida antes de chamar a API. A senha não entra no `FormState` (R4). O `"use client"` já existe só no formulário. Campo com rótulo visível e `autocomplete="current-password"`. Foco no erro (R5). Usa os tokens do design. |
| V. Testable by Default | ✅ `lib/profile-update.test.mjs` cobre a tabela do `data-model.md`; `e2e/profile.spec.ts` cobre FR-012. |
| Workflow | ✅ Branch `feature/027-pix-key-password` criada a partir de `main`. Lint, test, e2e e build no PR. Sem arquivo `VERSION` (follow-up da constituição). |

Sem violações; Complexity Tracking vazio. Re-check pós-design: mantido.

## Project Structure

### Documentation (this feature)

```text
specs/027-pix-key-password/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── profile-update.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
lib/
├── profile-update.ts        # NOVO, puro:
│                            #   isPixKeyChange(typed, saved)
│                            #   profileUpdateBody({ name, pixKey, savedPixKey, currentPassword })
│                            #   passwordErrorMessage(code, retryAfter) -> string | undefined
└── profile-update.test.mjs  # NOVO
app/actions/kotta.ts         # updateProfileAction:
                             #   lê savedPixKey e currentPassword
                             #   usa profileUpdateBody
                             #   erro de senha -> { passwordError, values }
components/forms/profile-form.tsx
                             # campo oculto savedPixKey
                             # mostra "Senha atual" quando a chave muda ou há passwordError
                             # foco no erro do campo
e2e/
├── mock-api-proxy.ts        # PUT /__mock/fail aceita method e code opcionais
└── profile.spec.ts          # 3 testes novos (R6)
```

**Structure Decision**:

- `FormState` (em `lib/form.ts`) é compartilhado. A action do perfil devolve
  `ProfileFormState = FormState & { passwordError?: string }`, declarado em `app/actions/kotta.ts`.
  Assim os outros formulários não mudam.
- `useFieldErrors` é tipado para os campos de autenticação, por isso não serve aqui. O formulário
  foca o campo de senha com um `useEffect` de 3 linhas.

## Riscos

- **Entre o deploy da API e este**: trocar a chave pelo app mostra o erro genérico, porque o código
  `CURRENT_PASSWORD_REQUIRED` ainda não está mapeado. Editar o nome funciona. Este PR fecha essa
  lacuna.
- **Limite de tentativas no e2e**: 5 checagens de senha por conta a cada 15 min. O e2e faz uma
  checagem real por execução, só a de senha certa; a de senha errada vem do mock (R6).
- **Chave do usuário de teste muda a cada execução**: ela é definida como `e2e-<runId>@example.com`
  e não é restaurada (R6). Nenhum outro e2e depende do valor exato. A API manda um e-mail de aviso
  por execução para a conta de teste.

## Complexity Tracking

Vazio.
