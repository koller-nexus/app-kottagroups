# Research: Rever fluxo de criar conta, confirmação de e-mail e login

Fontes: código deste repo (`app/actions/auth.ts`, `lib/api/*`, `lib/confirm-email.ts`,
`components/auth/*`, `proxy.ts`) e da api-kottagroups em `619f3f9`
(`internal/http/auth_handler.go`, `internal/service/auth*.go`, `internal/service/pix.go`,
`internal/apperror/catalog.go`), mais `node_modules/next/dist/docs/`.

## R1. A API recusa campos desconhecidos no cadastro

- **Fato**: `decodeJSON` usa `DisallowUnknownFields()`. Enviar `termsVersion`/`privacyVersion` hoje
  devolve `400 VALIDATION_FAILED "Invalid request body"` e **quebra o cadastro**.
- **Decision**: implementado na api-kottagroups (spec 066, branch `feature/066-terms-acceptance`,
  versão 0.6.0): `termsVersion`/`privacyVersion` opcionais (os dois ou nenhum, formato `YYYY-MM`),
  gravados em `terms_acceptances` com data/hora, IP e navegador, na mesma transação da conta. O
  front envia `TERMS_VERSION`/`PRIVACY_VERSION` de `lib/legal.ts`. **Ordem de deploy: API antes do
  front.**
- **Rationale**: a premissa da spec ("a API pode ignorar") é falsa; enviar agora derruba o cadastro.
- **Alternatives**: flag de ambiente para ligar o envio — rejeitado (configuração para algo que muda
  uma vez; Constitution I).

## R2. Expirado, usado e inválido são indistinguíveis na API

- **Fato**: `ConfirmEmail` devolve `VALIDATION_FAILED "Confirmation is invalid or expired"` para
  token inexistente, expirado ou já usado (a linha é apagada depois do uso). Token vazio →
  `"Token is required"`. `isExpiredConfirmationError` hoje dá `true` para **toda** falha, porque a
  mensagem contém "expired".
- **Decision**: estados exibidos — `success`, `already-confirmed`, `missing`, `invalid-or-expired`,
  `unexpected-error`. "Já confirmado" é detectado perguntando `GET /users/me` quando a confirmação
  falha e há sessão válida: se `emailConfirmed`, mostra sucesso. Expirado e inválido viram uma só tela
  "Link inválido ou expirado", com reenvio. Issue na API para códigos distintos
  (`CONFIRMATION_EXPIRED`, `CONFIRMATION_USED`); quando existirem, separar é um `case` a mais.
- **Rationale**: não dá para mostrar "expirado" com certeza sem dado da API; uma tela honesta com a
  mesma ação (reenviar) cumpre o objetivo do usuário.
- **Alternatives**: decodificar data do token no front — impossível (token opaco, só o hash no banco).

## R3. Confirmação passa a rodar numa Server Action

- **Decision**: `confirmEmailAction(token)` em `app/actions/auth.ts` chama `POST /auth/confirm-email`
  (sem sessão), e em falha verifica `/users/me` se houver cookie não vencido. Devolve
  `{ state, signedIn }`. Em sucesso com sessão, `revalidatePath("/", "layout")` atualiza o
  `emailConfirmed` do layout. A escolha do estado fica numa função pura
  `confirmationOutcome()` em `lib/confirm-email.ts`; o `fetch` cliente atual (`confirmEmail`) é
  removido.
- **Rationale**: a tela precisa saber se há sessão e se o e-mail já estava confirmado; o cookie é
  `httpOnly`, então só o servidor sabe. Revalidar no servidor dispensa `router.refresh()`.
- **Alternatives**: manter o fetch pelo rewrite `/api/v1` e criar um Route Handler só para "tenho
  sessão?" — duas idas em vez de uma.

## R4. Limites de envio e `Retry-After`

- **Fato**: reenvio cedo (< 60 s) → `429 RATE_LIMITED` **sem** `Retry-After`. Limites do
  middleware (login etc.) mandam `Retry-After` em segundos.
- **Decision**: `ApiError` ganha `retryAfter?: number`, lido do cabeçalho em `apiRequest`. Login usa o
  valor na mensagem ("Tente de novo em 2 min"); reenvio usa `retryAfter ?? 60` para a contagem.
  A contagem começa quando o reenvio dá certo ou volta `RATE_LIMITED`. Não persiste entre recargas
  (o próximo clique recebe `RATE_LIMITED` e reinicia a contagem).
- **Alternatives**: guardar o horário do último envio no `sessionStorage` — estado extra para um
  caso raro; o servidor já protege.

## R5. Validação por campo

- **Fato**: mensagens da API para cadastro: `Name is required`, `Email is required`,
  `Email is invalid`, `Password must be at least 8 characters`, `Password must be at most 72 bytes`,
  `Pix key is too long` (> 140), `Pix key is invalid` (CPF/CNPJ com dígito, e-mail, telefone BR,
  chave aleatória).
- **Decision**: módulo isomórfico `lib/auth-validation.ts` com
  `validateRegistration(values) → FieldErrors`, `validateLogin(values)` e
  `fieldErrorFromApi(message) → { field, message } | undefined` (mapeia pelo prefixo da mensagem
  para pt-BR). Usado no `onSubmit` do formulário (bloqueia o envio) e na Server Action (fronteira de
  confiança). Senha: mínimo 8 caracteres, máximo 72 **bytes** UTF-8 (`TextEncoder`), igual à API.
  Pix no cliente: só formato (e-mail, UUID, 11/14 dígitos, telefone 10–13 dígitos) e tamanho; o
  dígito verificador fica com a API, cujo erro vai para o campo via `fieldErrorFromApi`.
- **Alternatives**: validação nativa do navegador (`required`, `type=email`) com mensagens do
  browser — inconsistentes entre navegadores, em inglês em alguns, e sem o estilo do Kotta.

## R6. Renovação de sessão (#159 já entrou na API)

- **Fato**: login devolve `accessToken`, `refreshToken`, e `token` (legado, espelho de
  `accessToken`).
- **Decision**: `signIn` lê `accessToken ?? token`. O `refreshToken` **não** é guardado agora:
  ninguém o usaria. Guardar e renovar fica para a feature "Continuar logado".
- **Rationale**: cumpre FR-025 (aceita o payload novo, continua com o legado) sem estado morto.

## R7. Rotas em português

- **Decision**: `/confirm-email` → `/confirmar-email` e `/forget-password` → `/redefinir-senha`
  (mover as pastas), com `redirects()` em `next.config.ts` (`permanent: false`). Os redirects do Next
  repassam a query (`?token=…`), confirmado em
  `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md`.
  Issue na API para trocar `"/confirm-email?token="` e o link de recuperação.
- **Alternatives**: manter EN — a issue pede padronizar.

## R8. Termos e Privacidade sem nova dependência

- **Decision**: conteúdo em TSX versionado: `content/legal/terms-2026-10.tsx` e
  `privacy-2026-10.tsx`, cada um exportando `{ version, updatedAt, draft, sections: { id, title,
  body }[] }`. Uma página por documento (`app/(legal)/termos`, `app/(legal)/privacidade`) renderiza
  índice (âncoras) e seções. Nova versão = novo arquivo; o git guarda o histórico.
- **Rationale**: MDX exigiria `@next/mdx` + `@mdx-js/*` (3 dependências) para dois documentos;
  Constitution I proíbe.
- **Layout**: grupo `(legal)` com layout de leitura largo (logo, `max-w-prose`), porque o cartão
  `PublicFrame` (`max-w-lg`) é estreito para texto longo. Rotas fora de `PROTECTED`/`GUEST_ONLY`.

## R9. Destino preservado quando falta confirmar

- **Decision**: `loginAction` redireciona para `/confirme-seu-email?next=…` (só se `next !== "/"`).
  A página lê `next` (via `safeNextPath`) e usa no redirect de "já confirmado", no "Já confirmei" e
  ao revalidar no foco. `apiRequest`, ao receber `EMAIL_NOT_CONFIRMED`, também passa o caminho atual
  como `next`.

## R10. "Já confirmei" e avanço automático

- **Decision**: "Já confirmei" vira `checkConfirmationAction(next)`: lê `/users/me`; confirmado →
  `redirect(next)`; senão devolve o aviso. Avanço automático: componente cliente pequeno que chama
  `router.refresh()` em `visibilitychange` (aba visível); a página servidor já redireciona quando
  `emailConfirmed`. Sem polling.

## R11. Corrigir e-mail digitado errado

- **Decision**: `logoutAction` aceita um destino vindo de um campo oculto, restrito a
  `/entrar?motivo=saiu` (padrão) e `/cadastrar` (lista fechada, nunca URL livre). Em "Confirme seu
  e-mail": "Digitou o e-mail errado? Corrigir e-mail" → sai e abre `/cadastrar`.

## R12. Copy com "app"

`rg -i "app kotta|no app|do app"` acha 10 arquivos. Do fluxo: `entrar/page.tsx`,
`cadastrar/page.tsx`, `confirm-email-screen.tsx`, `forget-password-screen.tsx`. Os outros
(`app/page.tsx`, `dashboard*.tsx`, `price.tsx`, `category-form.tsx`, `globals.css`) são revisados na
implementação: comentários de código sobre o mobile ficam, copy visível sai.
