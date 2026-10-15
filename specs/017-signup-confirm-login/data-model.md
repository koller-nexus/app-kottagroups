# Data Model: Rever fluxo de criar conta, confirmação de e-mail e login

Nada é persistido por este front além do cookie de sessão já existente. Os modelos abaixo são
formas em memória e conteúdo versionado no repo.

## LegalDocument (`content/legal/*.tsx`, constantes em `lib/legal.ts`)

| Campo | Tipo | Regra |
|-------|------|-------|
| `version` | string `YYYY-MM` | Igual a `TERMS_VERSION` / `PRIVACY_VERSION` em `lib/legal.ts` |
| `updatedAt` | string ISO `YYYY-MM-DD` | Exibido como "Última atualização: 15 de outubro de 2026" |
| `draft` | boolean | `true` até revisão jurídica → aviso "Rascunho" no topo |
| `sections` | `{ id: string; title: string; body: ReactNode }[]` | `id` vira âncora do índice; único por documento |

Nova versão = novo arquivo + atualização da constante. Versões antigas ficam no histórico do git.

## TermsAcceptance (enviado no cadastro; gravado pela API em `terms_acceptances`)

| Campo | Origem |
|-------|--------|
| `termsVersion` | `TERMS_VERSION` |
| `privacyVersion` | `PRIVACY_VERSION` |
| data/hora, IP | registrados pela API |

Re-aceite futuro: comparar a versão aceita (vinda de `/users/me`, quando a API expuser) com as
constantes. Fora de escopo agora.

## RegistrationInput / FieldErrors (`lib/auth-validation.ts`)

```text
RegistrationInput = { name, email, password, pixKey, acceptTerms: boolean }
FieldErrors       = Partial<Record<"name" | "email" | "password" | "pixKey" | "acceptTerms", string>>
```

| Campo | Regra (cliente e servidor) | Mensagem |
|-------|-----------------------------|----------|
| name | não vazio após `trim` | "Informe seu nome." |
| email | `^[^\s@]+@[^\s@]+\.[^\s@]+$` | "Informe um e-mail válido." |
| password | ≥ 8 caracteres e ≤ 72 bytes UTF-8 | "A senha precisa ter de 8 a 72 caracteres." |
| pixKey | opcional; ≤ 140; formato e-mail, UUID, 11/14 dígitos ou telefone 10–13 dígitos | "Use CPF, CNPJ, e-mail, celular ou chave aleatória." |
| acceptTerms | marcado | "Para criar a conta, aceite os Termos de Uso e a Política de Privacidade." |

Login: `email` válido e `password` não vazia.

Mapa API → campo (`fieldErrorFromApi`), pelo prefixo da mensagem: `Name` → name, `Email` → email,
`Password` → password, `Pix key` → pixKey (`too long` / `invalid` com textos próprios).

## AuthFormState (estado das Server Actions de login/cadastro)

```text
{ error?: string; fieldErrors?: FieldErrors; fields?: { name?, email?, pixKey? } }
```

`error` = erro geral no topo; `fieldErrors` = erros por campo. A senha nunca volta no estado.

## ConfirmationOutcome (`lib/confirm-email.ts`)

```text
state: "success" | "already-confirmed" | "missing" | "invalid-or-expired" | "unexpected-error"
signedIn: boolean
```

`confirmationOutcome({ token, response, sessionUser })`:

| Entrada | Estado |
|---------|--------|
| token vazio | `missing` |
| resposta 2xx | `success` |
| 4xx e `sessionUser?.emailConfirmed` | `already-confirmed` |
| 4xx | `invalid-or-expired` |
| 5xx / rede | `unexpected-error` |

Ações por estado:

| Estado | Com sessão | Sem sessão |
|--------|------------|------------|
| success / already-confirmed | "Continuar" → `/` | "Entrar" → `/entrar?next=/` |
| missing / invalid-or-expired | "Reenviar link" → `/confirme-seu-email`; "Ir para o início" → `/` | "Reenviar link" → `/entrar?next=/confirme-seu-email`; "Ir para o início" |
| unexpected-error | "Tentar novamente" | "Tentar novamente" |

## ResendState

```text
{ status: "idle" | "sent" | "error"; message?: string; retryAfter?: number /* segundos */ }
```

`retryAfter` = `60` após envio, ou o `Retry-After` / `60` após `RATE_LIMITED`. O cliente conta até 0.

## Notices de `/entrar` (`lib/session-flow.ts`)

Novo `motivo=conta-criada` → "Conta criada! Entre para continuar." Novo parâmetro `email` preenche o
campo.
