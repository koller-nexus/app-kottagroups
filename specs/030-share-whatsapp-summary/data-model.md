# Data Model: Compartilhar cobrança e resumo via WhatsApp e Web Share

Nenhuma entidade nova é persistida — esta feature só transforma dados já existentes (acertos,
nomes, chave Pix) em uma string. Os "modelos" abaixo são as formas de entrada/saída das funções
puras de `lib/share-text.ts`.

## `SettlementShareInput` (entrada de `buildSettlementShareText`)

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `groupName` | `string` | sim | `group.name` (`page.tsx`) |
| `groupUrl` | `string` | sim | montado em `page.tsx` com `headers()` (`next/headers`): `{proto}://{host}/grupos/{id}` |
| `payerName` | `string` | sim | `displayName(names, settlement.from, me.id)` |
| `payeeName` | `string` | sim | `displayName(names, settlement.to, me.id)` |
| `amountCents` | `number` | sim | `settlement.amountCents` |
| `payeePixKey` | `string \| null \| undefined` | não | `me.pixKey` (quem recebe é sempre a pessoa logada, ver FR-001) |

**Validação**: nenhuma campo pode ser string vazia exceto `payeePixKey` (ausente = omite a linha
no texto). `amountCents` deve ser um inteiro ≥ 0 (mesma regra já aplicada a `ApiSettlement`).

**Saída**: `string` — texto PT-BR pronto para `navigator.share`/`wa.me`/clipboard.

## `GroupSummaryShareInput` (entrada de `buildGroupSummaryShareText`)

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `groupName` | `string` | sim | `group.name` |
| `groupUrl` | `string` | sim | igual acima |
| `pendingSettlements` | `PendingSettlementLine[]` | sim (pode ser `[]`) | `settlements.filter(s => !s.paid)` já resolvidos |

### `PendingSettlementLine`

| Campo | Tipo | Obrigatório |
|---|---|---|
| `payerName` | `string` | sim |
| `payeeName` | `string` | sim |
| `amountCents` | `number` | sim |
| `payeePixKey` | `string \| null \| undefined` | não |

**Restrição conhecida**: `ApiGroupMember` (membros do grupo) não traz `pixKey` — só `ApiUser` (a
pessoa logada, `me.pixKey`) tem essa informação no front hoje. Por isso, ao montar
`pendingSettlements` em `page.tsx`, `payeePixKey` só é preenchido quando `settlement.to ===
me.id`; para acertos em que a credora é outro membro, `payeePixKey` MUST ir como `undefined` (sem
chave Pix no resumo desse acerto). Buscar a chave de outros membros exigiria mudar a API, fora do
escopo (ver Assumptions do spec).

**Validação**: `pendingSettlements` vazio é um estado válido (grupo quite) — o texto de saída MUST
dizer isso em vez de ficar com uma lista vazia (FR-004).

**Saída**: `string`.

## `buildWhatsAppShareUrl(text: string): string`

Entrada: a string já montada por uma das duas funções acima. Saída: URL completa
`https://wa.me/?text=<text codificado com encodeURIComponent>`. Sem validação adicional — qualquer
string é válida.

## Relação com os tipos existentes

Nenhum tipo em `lib/api/types.ts` é alterado. O componente de página (`page.tsx`, já Server
Component) continua resolvendo `ApiSettlement`, `ApiBalance`, `ApiUser.pixKey` e `names` como faz
hoje; só passa os campos já resolvidos (nomes, valor, chave Pix) para o novo componente de UI e
para `lib/share-text.ts`, que não conhecem `ApiSettlement` nem IDs de usuário.
