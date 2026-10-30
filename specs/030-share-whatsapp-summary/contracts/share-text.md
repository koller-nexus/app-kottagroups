# Contrato: `lib/share-text.ts`

Interface interna entre a lógica pura (testada por `node --test`) e os componentes de UI
(`components/app/share-button.tsx` e `app/(conta)/grupos/[id]/page.tsx`). Não é uma API pública
nem exposta fora do app.

```ts
export interface PendingSettlementLine {
  payerName: string;
  payeeName: string;
  amountCents: number;
  payeePixKey?: string | null;
}

/** Texto de cobrança de um único acerto pendente (US1 — botão "Cobrar"). */
export function buildSettlementShareText(input: {
  groupName: string;
  groupUrl: string;
  payerName: string;
  payeeName: string;
  amountCents: number;
  payeePixKey?: string | null;
}): string;

/** Texto de resumo de todos os acertos pendentes do grupo (US2 — "Compartilhar resumo"). */
export function buildGroupSummaryShareText(input: {
  groupName: string;
  groupUrl: string;
  pendingSettlements: PendingSettlementLine[];
}): string;

/** Monta o link `wa.me` com o texto já codificado. */
export function buildWhatsAppShareUrl(text: string): string;
```

## Garantias

- Funções puras: mesma entrada → mesma saída, sem acesso a `window`/`navigator`/rede/relógio.
- `payeePixKey` ausente, `null` ou string vazia MUST omitir a linha de chave Pix no texto (sem
  lançar erro, sem placeholder tipo "sem chave").
- `pendingSettlements: []` em `buildGroupSummaryShareText` MUST retornar um texto que diz que o
  grupo está quite, não uma lista vazia.
- `buildWhatsAppShareUrl` MUST sempre `encodeURIComponent` o texto recebido.

## Consumidores

| Consumidor | Usa |
|---|---|
| `components/app/share-button.tsx` | `buildWhatsAppShareUrl` (para o `href` do link) |
| `app/(conta)/grupos/[id]/page.tsx` | `buildSettlementShareText` (no acerto onde `settlement.to === me.id`) e `buildGroupSummaryShareText` (uma vez, para o botão "Compartilhar resumo") |

## Cobertura de teste exigida (`lib/share-text.test.mjs`)

1. `buildSettlementShareText` com `payeePixKey` presente → texto contém a chave.
2. `buildSettlementShareText` sem `payeePixKey` (undefined/null) → texto não contém linha de Pix.
3. `buildGroupSummaryShareText` com 2+ acertos → cada par devedor/credora aparece no texto.
4. `buildGroupSummaryShareText` com `pendingSettlements: []` → texto indica grupo quite.
5. `buildWhatsAppShareUrl` → resultado começa com `https://wa.me/?text=` e o texto está
   percent-encoded (ex. espaço vira `%20`, não `+`).
