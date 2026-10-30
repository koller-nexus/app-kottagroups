import { formatBRL } from "./money.ts";

export interface PendingSettlementLine {
  payerName: string;
  payeeName: string;
  amountCents: number;
  payeePixKey?: string | null;
}

function settlementLine({ payerName, payeeName, amountCents, payeePixKey }: PendingSettlementLine): string {
  const line = `${payerName} paga ${formatBRL(amountCents)} para ${payeeName}`;
  return payeePixKey ? `${line} (Pix: ${payeePixKey})` : line;
}

export function buildSettlementShareText(input: {
  groupName: string;
  groupUrl: string;
  payerName: string;
  payeeName: string;
  amountCents: number;
  payeePixKey?: string | null;
}): string {
  const { groupName, groupUrl, ...line } = input;
  return `Cobrança do grupo ${groupName}: ${settlementLine(line)}.\n${groupUrl}`;
}

export function buildGroupSummaryShareText(input: {
  groupName: string;
  groupUrl: string;
  pendingSettlements: PendingSettlementLine[];
}): string {
  const { groupName, groupUrl, pendingSettlements } = input;
  const body =
    pendingSettlements.length === 0
      ? "Todos estão quites."
      : pendingSettlements.map(settlementLine).join("\n");
  return `Resumo do grupo ${groupName}:\n${body}\n${groupUrl}`;
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
