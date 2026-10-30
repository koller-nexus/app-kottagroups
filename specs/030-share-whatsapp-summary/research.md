# Phase 0 Research: Compartilhar cobrança e resumo via WhatsApp e Web Share

Sem `NEEDS CLARIFICATION` no Technical Context: a issue já fixa a abordagem técnica (navigator.share
+ wa.me + lib/share-text.ts), e o Contexto do spec resolveu o único ponto em aberto (link do
acerto → link do grupo). Esta pesquisa documenta as decisões de implementação tomadas a partir do
que já existe no repo, em vez de reinventar padrões.

## Decisão: como oferecer `navigator.share` + fallback

**Decision**: sempre renderizar o link `wa.me` e o botão "Copiar texto"; mostrar o botão
"Compartilhar" (nativo) só quando `typeof navigator.share === "function"`. Nenhuma lógica de
try/catch orquestrando "mostrar fallback só se falhar".

**Rationale**: é exatamente o padrão já usado em `components/invites/created-invite.tsx:16,55-59`
— `CopyTextButton` sempre visível, botão "Compartilhar" condicional a `canShare`. Cancelar o
compartilhamento nativo cai num `catch` vazio (linha 21) porque copiar/wa.me já estão na tela de
qualquer forma. Isso cobre FR-006 (oferecer alternativas quando `navigator.share` está indisponível
*ou falha/cancela*) sem precisar guardar estado de "share falhou".

**Alternatives considered**: mostrar wa.me/copiar só depois de um `catch` do `navigator.share` —
rejeitado por adicionar estado (`shared | failed`) sem benefício: como wa.me e copiar são links e
botões estáticos (sem custo de render ou rede até o toque), não há razão para escondê-los.

## Decisão: link do WhatsApp

**Decision**: `https://wa.me/?text=${encodeURIComponent(text)}` (sem número de telefone — a pessoa
escolhe o contato dentro do WhatsApp), montado por `buildWhatsAppShareUrl(text)` em
`lib/share-text.ts`.

**Rationale**: é o formato citado na própria issue; sem número, funciona tanto para "Cobrar" (vai
para o devedor específico, mas a pessoa escolhe o contato) quanto para "Compartilhar resumo" (não
há um único destinatário). `encodeURIComponent` é suficiente — nenhuma biblioteca de URL building é
necessária para uma única query string.

## Decisão: componente de UI compartilhado

**Decision**: um componente `ShareButton` em `components/app/` recebe `text`, `shareTitle` e
`label`, e renderiza: botão "Compartilhar" (se `canShare`), link `wa.me` e `CopyTextButton`.
Usado nos dois pontos (acerto e resumo do grupo) passando textos diferentes.

**Rationale**: os dois usos (US1 "Cobrar" e US2 "Compartilhar resumo") têm exatamente a mesma UI de
compartilhamento, só o texto muda — extrair um componente aqui não é abstração prematura (regra da
Constituição I: "extract only on the third real use" é sobre *helpers*, não sobre duplicar UI
idêntica em 2 lugares reais já conhecidos).

## Decisão: onde fica a regra de negócio do texto

**Decision**: `lib/share-text.ts` recebe dados já resolvidos (nomes via `displayName`/`peopleById`,
`amountCents`, `pixKey` opcional, `groupUrl`), não IDs ou tipos `Api*` brutos — mesmo padrão de
`lib/money.ts` (recebe `cents`, não um `ApiExpense`).

**Rationale**: mantém o módulo puro e fácil de testar (`lib/share-text.test.mjs` não precisa mockar
API nem `names` Map), e deixa a resolução de nomes/Pix onde já acontece hoje em
`app/(conta)/grupos/[id]/page.tsx`.

## Decisão: chave Pix no resumo do grupo (US2)

**Decision**: no "Compartilhar resumo", só incluir a chave Pix nos acertos em que a pessoa logada
é a credora (`settlement.to === me.id`, usando `me.pixKey`); para acertos de outras pessoas, a
linha de chave Pix fica de fora.

**Rationale**: `ApiGroupMember` (tipo de `group.members`, `lib/api/types.ts:24-28`) não tem campo
`pixKey` — só `ApiUser` (a pessoa logada) tem. O front não tem, hoje, como saber a chave Pix de
outro membro sem uma chamada de API nova, que está fora do escopo ("Só front... não depende de API
nova"). Descoberto ao desenhar `PendingSettlementLine` em `data-model.md`; `spec.md` (FR-004,
Assumptions) foi ajustado para refletir essa restrição real em vez de prometer algo que o front não
consegue cumprir.

**Alternatives considered**: buscar/expor a chave Pix de outros membros via API — rejeitado, exige
mudança de API fora do escopo da issue.

## Decisão: link do acerto no texto

**Decision**: usa a URL da própria página do grupo, montada no Server Component
(`app/(conta)/grupos/[id]/page.tsx`, já `async`) com `headers()` de `next/headers`:
`` `${(await headers()).get("x-forwarded-proto") ?? "https"}://${(await headers()).get("host")}/grupos/${group.id}` ``,
passada como prop `groupUrl` (string já resolvida) para `ChargeSettlementButton` e
`ShareGroupSummaryButton`. Nenhuma variável de ambiente nova, nenhuma chamada de rede.

**Rationale**: a primeira versão desta decisão propunha montar a URL no cliente com
`window.location.origin`, dentro do componente de botão. Isso quebra: Next.js renderiza Client
Components no servidor também (para o HTML inicial), e `window` não existe lá — o acesso direto
geraria `ReferenceError: window is not defined` na primeira renderização (SSR), não só um aviso de
hydration mismatch. `headers()` já é um padrão estabelecido no repo para dados da requisição
(`app/actions/auth.ts:4,40`, `lib/api/server.ts:2`), funciona igual em SSR e em runtime de Server
Component, e evita até variação por proxy (lê `x-forwarded-proto`/`host` da requisição real, em
vez de supor `https`). Com `groupUrl` já pronto, `ChargeSettlementButton` deixou de precisar de
`"use client"` — só compõe `<ShareButton>` (que é o único client component real da árvore).

**Alternatives considered**:
- `window.location.origin` no componente cliente — rejeitado por quebrar no SSR (ver acima).
- `NEXT_PUBLIC_APP_URL` fixo — rejeitado por exigir uma variável de ambiente nova para um valor que
  a própria requisição já informa via `headers()`, sem necessidade de configuração manual nem
  risco de ficar desatualizado entre ambientes (preview, produção, etc.).
