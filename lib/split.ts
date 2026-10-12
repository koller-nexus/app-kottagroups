import { parseAmountToCents } from "./kotta-view.ts";

/**
 * Lê a divisão personalizada digitada (userId → "12,50"). Campo vazio ou "0"
 * conta como zero. A soma tem que fechar com o total; a API recusa o contrário.
 */
export function parseCustomSplit(
  entries: Record<string, string>,
  totalCents: number,
): { split: Record<string, number> } | { error: string } {
  const split: Record<string, number> = {};
  let sum = 0;
  for (const [userId, raw] of Object.entries(entries)) {
    const value = raw.trim();
    if (value === "" || /^0+([,.]0+)?$/.test(value)) continue;
    const cents = parseAmountToCents(value);
    if (cents === null) return { error: "Confira os valores de cada pessoa." };
    split[userId] = cents;
    sum += cents;
  }
  if (sum !== totalCents) {
    const diff = totalCents - sum;
    const abs = (Math.abs(diff) / 100).toFixed(2).replace(".", ",");
    return { error: diff > 0 ? `Faltam R$ ${abs} na divisão.` : `Sobram R$ ${abs} na divisão.` };
  }
  return { split };
}
