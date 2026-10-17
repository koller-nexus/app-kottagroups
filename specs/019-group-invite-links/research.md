# Research: Convidar para o grupo por link e por e-mail

Todas as decisões abaixo partem do código atual (`lib/api/server.ts`, `app/actions/*`, `proxy.ts`,
`app/layout.tsx`) e do contrato da API em `api-kottagroups/specs/071-group-invite-links/contracts/invites.md`
(resumido em [contracts/api-consumed.md](./contracts/api-consumed.md)).

## R1. Como gerar o QR code

- **Decision**: adicionar `uqr@0.1.3` (zero dependências, ESM, ~79 KB descompactado, só o
  `encode()` entra no bundle). Um componente cliente `QrCode` chama `encode(url)` e desenha a matriz
  como **um único `<path>`** dentro de um `<svg>` com `role="img"` e `aria-label`. O caminho é
  montado por uma função pura `qrSvgPath(matrix)` em `lib/invites.ts`, testada.
- **Rationale**: o projeto só tem `jsqr`, que lê QR e não gera. Um codificador QR (Reed-Solomon,
  máscaras, versões) passa de longe as ~20 linhas da regra de dependências da constituição.
  O componente fica no modal, que só existe para dono/admin; nada entra no bundle da página pública.
  Desenhar a matriz no React evita `dangerouslySetInnerHTML`.
- **Alternatives considered**: `qrcode@1.5.4` (maior, inclui canvas/PNG/terminal que não usamos);
  renderizar o SVG no servidor dentro da Server Action e devolver a string (exigiria injetar HTML);
  serviço externo de QR (vazaria o segredo do link para terceiros — rejeitado).

## R2. Onde ficam o modal e a lista

- **Decision**: o botão "Convidar" + modal (`InviteDialog`, cliente) aparece em dois lugares: nas
  ações do cabeçalho da página do grupo e na página de Membros. A lista de convites (`InviteList`,
  Server Component) fica só em Membros (`/grupos/[id]/membros`), abaixo da lista de membros.
  Grupo arquivado não mostra "Convidar" (como já acontece com "Nova despesa").
- **Rationale**: SC-003 pede gerar e copiar em até 3 toques a partir do grupo (Convidar → Gerar →
  Copiar). A gestão (revogar, histórico) é tarefa de administração e combina com Membros, que já é a
  tela de gerenciar pessoas. Um componente, dois pontos de montagem: sem duplicação.
- **Alternatives considered**: rota própria `/grupos/[id]/convites` (mais uma tela sem ganho);
  lista dentro da página do grupo (pesa uma página já densa e faz uma chamada extra para todo mundo).

## R3. Permissão para convidar

- **Decision**: nova constante em `lib/permissions.ts`: `export const canInviteMembers = canDeleteGroup;`
  (dono ou admin), seguindo o padrão de `canPromoteMember`.
- **Rationale**: a API (spec 071, FR-001) aceita dono e admin. `canManageGroup` é só dono e não
  serve. Reusa a regra existente em vez de duplicá-la.

## R4. Chamadas à API: privadas e pública

- **Decision**: tudo passa por `apiRequest` (`server-only`). Funções novas em `lib/api/kotta.ts`:
  `previewInvite(token)` com `{ method: "POST", auth: false }` e `listGroupInvites(groupId)`
  (primeira página, `limit=50`). Criar, revogar e aceitar ficam em `app/actions/invites.ts`.
- **Rationale**: o token nunca vai para o navegador como credencial; o cliente só fala com Server
  Actions. `apiRequest` já desembrulha `{data}`, mapeia erros para `ApiError`, trata 401 (sessão
  expirada → `/sair` com `next`) e 403 `EMAIL_NOT_CONFIRMED` (→ `/confirme-seu-email?next=` usando o
  caminho atual gravado pelo `proxy.ts`). Isso entrega FR-007 sem código novo.
- **Alternatives considered**: Route Handlers dedicados (mais superfície, sem ganho sobre Server
  Actions); chamar a API direto do navegador (exporia o token de sessão — proibido).

## R5. Retorno ao convite pelo cadastro, confirmação e login

- **Decision**: o link "Criar conta" vai para `/cadastrar?next=/convite/<token>` e "Já tenho
  conta" para `/entrar?next=/convite/<token>`. Mudanças mínimas:
  1. `app/(acesso)/cadastrar/page.tsx` lê `next` (via `safeNextPath`) e passa para `RegisterForm`.
  2. `RegisterForm` envia `next` num `<input type="hidden">` e o link "Já tenho conta" dele mantém o
     `next` (o "Criar conta" do login também).
  3. **Correção na implementação**: `registerAction` *não* lia `next` (ia sempre para
     `/confirme-seu-email`). Passou a ler e redirecionar para `confirmEmailUrl(next)`; quando o
     login automático falha, `accountCreatedLoginUrl(email, next)` também preserva o destino.
  3. `/entrar` e `loginAction` já respeitam `next`; `/confirme-seu-email` já redireciona para `next`
     quando o e-mail é confirmado (`ConfirmationCheck`).
  O caminho é montado por `inviteReturnPath(token)` em `lib/invites.ts` (com `encodeURIComponent`).
- **Rationale**: reusa todo o encadeamento de `next` das specs 016/017; o único elo faltando é o
  cadastro.
- **Limite conhecido**: o link de confirmação que chega por e-mail abre `/confirmar-email` em outra
  aba, sem `next`. A pessoa continua levada ao convite pela aba original (`ConfirmationCheck` vê a
  confirmação). Levar `next` dentro do e-mail exigiria mudar a API: fora de escopo.

## R6. Trocar de conta (e-mail diferente)

- **Decision**: `logoutAction` passa a aceitar um campo opcional `next` (passado por
  `safeNextPath`) e redireciona para `/entrar?motivo=saiu&next=<next>`; sem o campo, o comportamento
  atual não muda. A página do convite usa esse formulário em "Sair e entrar com outra conta".
- **Rationale**: uma linha de mudança em vez de rota nova.

## R7. Aceite explícito e destino

- **Decision**: `acceptInviteAction(formData{token})` → `POST /invites/accept`. Sucesso:
  `revalidatePath("/", "layout")` (menu do shell lista os grupos) e redirect para
  `/grupos/<groupId>?aviso=entrou` ou `?aviso=ja-membro` (de `joined`). Erros `ApiError`
  (`INVITE_INVALID`, `INVITE_EMAIL_MISMATCH`, `RATE_LIMITED`, outros) voltam para
  `/convite/<token>?erro=<CODE>`, no mesmo padrão `?erro=` de `app/actions/groups.ts`.
  A página do grupo mostra o aviso num `role="status"`.
- **Rationale**: Server Component simples, sem estado de cliente na página pública; o botão usa
  `useFormStatus` para indicar envio (componente cliente mínimo `SubmitButton`, se já não houver
  um equivalente reutilizável).

## R8. Segredo na URL: indexação, Referer e analytics

- **Decision**:
  - `generateMetadata` da página do convite define `robots: { index: false, follow: false }` e
    `referrer: "no-referrer"`.
  - A página não carrega recurso externo (sem imagens remotas; emoji é texto).
  - `<Analytics beforeSend>` e `<SpeedInsights beforeSend>` em `app/layout.tsx` trocam
    `/convite/<qualquer coisa>` por `/convite/[token]` antes de enviar, via `redactInviteUrl(url)`
    pura em `lib/invites.ts` (testada).
  - Erros/logs do servidor já registram só o caminho da API (`/invites/accept`), nunca o corpo.
- **Rationale**: FR-009. Sem o `beforeSend`, o Vercel Analytics gravaria cada token no painel.
- **Alternatives considered**: token no fragmento (`#token`): exigiria mudar a API, que monta o link.

## R9. Validação do token na URL

- **Decision**: `isInviteTokenShape(token)`: string de 16 a 256 caracteres do alfabeto base64url
  (`A–Z a–z 0–9 - _`). Fora disso, a página mostra o estado inválido sem chamar a API.
- **Rationale**: evita chamadas inúteis com lixo na URL (edge case da spec), sem amarrar a web ao
  tamanho exato que a API escolheu; a API continua sendo a autoridade (qualquer token que passe e
  seja ruim volta `INVITE_INVALID`). **Confirmado** em `internal/service/group_invite.go` da API:
  32 bytes em base64url, exatamente 43 caracteres (`inviteTokenLen = 43`); cabe no padrão.

## R10. Lista: status, nomes e paginação

- **Decision**: a API já devolve `status` (`active|expired|revoked|exhausted`). `splitInvites(invites)`
  separa `active` em "Pendentes" e o resto em "Encerrados" com rótulo (`exhausted` → "Usado",
  `expired` → "Expirado", `revoked` → "Revogado"). O nome do criador vem dos membros do grupo já
  carregados pela página (`createdBy` é id); se a pessoa saiu do grupo, "Ex-membro". Mostra só a
  primeira página (50); com `hasMore`, uma linha "Mostrando os 50 convites mais recentes".
- **Rationale**: sem "carregar mais" enquanto não houver grupo com dezenas de convites (YAGNI).
  A lista vem dentro de `<Suspense>` com esqueleto, e uma falha da API vira um aviso local com
  "Tentar de novo" (link para a mesma página), sem derrubar Membros.

## R11. Criar convite e feedback

- **Decision**: `createInviteAction(prev, formData)` com `useActionState`. Valida no servidor com
  `parseInviteForm` (e-mail opcional, `maxUses` 1–100 inteiro, `expiresInHours` de uma lista fixa de
  opções, e-mail ⇒ `maxUses = 1`) antes de chamar a API; devolve `{ invite: { url, emailSent,
  email, maxUses, expiresAt } }` ou `{ error, fieldErrors, values }`. Revalida
  `/grupos/<id>/membros` para o novo convite aparecer na lista (FR-023). O token puro não volta:
  só a `url`, que já o contém e é o que a pessoa precisa copiar.
- Opções de validade (P3): 1 hora, 1 dia, 7 dias (padrão), 30 dias.
- Mensagens de erro: `friendlyMessage` ganha `INVITE_INVALID` ("Este convite não vale mais. Peça
  um novo link a quem convidou.") e `INVITE_EMAIL_MISMATCH` ("Este convite foi enviado para outro
  e-mail."). `RATE_LIMITED` já usa `rateLimitMessage(retryAfter)`.
- **Rationale**: o padrão `FormState`/`failure()` de `lib/form.ts` já existe; a validação dupla
  (cliente com atributos nativos `type="email"`, `min`, `max`; servidor com `parseInviteForm`) segue
  a constituição IV.

## R12. Modal

- **Decision**: `<dialog>` nativo com `showModal()` (mesmo padrão de `components/receipt/qr-scanner.tsx`):
  foco preso e Esc de graça; ao fechar, o foco volta ao botão "Convidar" (ref). Copiar reusa
  `CopyTextButton` (ganha um texto de falha configurável, hoje fixo em "Sua chave"). "Compartilhar"
  só renderiza após montar e se `navigator.share` existir. O link fica num `<input readonly>` que
  rola na horizontal dentro do campo (375px sem rolagem da página).
- **Rationale**: nenhuma biblioteca de modal; reuso dos componentes atuais.
