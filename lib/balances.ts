export interface SplitExpense {
  paidById: string;
  amountCents: number;
  splitAmong: string[];
}

export interface Transfer {
  fromId: string;
  toId: string;
  amountCents: number;
}

/**
 * Divide o valor em partes iguais, em centavos. O resto vai para os primeiros
 * participantes, então a soma das partes é sempre igual ao total.
 */
export function splitEvenly(amountCents: number, count: number): number[] {
  if (count <= 0) {
    return [];
  }
  const base = Math.floor(amountCents / count);
  const remainder = amountCents - base * count;
  return Array.from({ length: count }, (_, index) =>
    index < remainder ? base + 1 : base,
  );
}

/** Saldo líquido por membro: positivo recebe, negativo deve. */
export function computeNetBalances(
  memberIds: string[],
  expenses: SplitExpense[],
): Record<string, number> {
  const net: Record<string, number> = {};
  for (const id of memberIds) {
    net[id] = 0;
  }

  for (const expense of expenses) {
    net[expense.paidById] = (net[expense.paidById] ?? 0) + expense.amountCents;
    const shares = splitEvenly(expense.amountCents, expense.splitAmong.length);
    expense.splitAmong.forEach((memberId, index) => {
      net[memberId] = (net[memberId] ?? 0) - shares[index];
    });
  }

  return net;
}

/** Menor conjunto de transferências que zera os saldos (guloso). */
export function simplifyDebts(net: Record<string, number>): Transfer[] {
  const debtors = Object.entries(net)
    .filter(([, cents]) => cents < 0)
    .map(([id, cents]) => ({ id, cents: -cents }))
    .sort((a, b) => b.cents - a.cents || a.id.localeCompare(b.id));
  const creditors = Object.entries(net)
    .filter(([, cents]) => cents > 0)
    .map(([id, cents]) => ({ id, cents }))
    .sort((a, b) => b.cents - a.cents || a.id.localeCompare(b.id));

  const transfers: Transfer[] = [];
  let d = 0;
  let c = 0;
  while (d < debtors.length && c < creditors.length) {
    const amount = Math.min(debtors[d].cents, creditors[c].cents);
    if (amount > 0) {
      transfers.push({
        fromId: debtors[d].id,
        toId: creditors[c].id,
        amountCents: amount,
      });
    }
    debtors[d].cents -= amount;
    creditors[c].cents -= amount;
    if (debtors[d].cents === 0) d += 1;
    if (creditors[c].cents === 0) c += 1;
  }

  return transfers;
}
