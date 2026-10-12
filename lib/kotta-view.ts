// Funções puras sobre as respostas da api-kottagroups (sem I/O).

export const APP_TIME_ZONE = "America/Sao_Paulo";

interface WithCreatedAt {
  createdAt: string;
}

interface Balance {
  userId: string;
  netCents: number;
}

/** "2026-10-12" no fuso de Brasília. */
export function localDay(iso: string, timeZone = APP_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** "2026-10" no fuso de Brasília. */
export function localMonth(iso: string, timeZone = APP_TIME_ZONE): string {
  return localDay(iso, timeZone).slice(0, 7);
}

export function previousMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
}

/**
 * Instante seguro para buscar despesas desde o início do mês anterior:
 * dia 1 às 00:00 UTC, que é antes da meia-noite de Brasília.
 */
export function previousMonthStartIso(nowIso: string): string {
  return `${previousMonth(localMonth(nowIso))}-01T00:00:00.000Z`;
}

export function monthSpend(
  expenses: (WithCreatedAt & { amountCents: number })[],
  nowIso: string,
): { currentMonthCents: number; previousMonthCents: number } {
  const current = localMonth(nowIso);
  const previous = previousMonth(current);
  let currentMonthCents = 0;
  let previousMonthCents = 0;
  for (const expense of expenses) {
    const key = localMonth(expense.createdAt);
    if (key === current) currentMonthCents += expense.amountCents;
    else if (key === previous) previousMonthCents += expense.amountCents;
  }
  return { currentMonthCents, previousMonthCents };
}

export function netFor(balances: Balance[], userId: string): number {
  return balances.find((b) => b.userId === userId)?.netCents ?? 0;
}

export function balanceTotals(groupBalances: Balance[][], userId: string) {
  let receivesCents = 0;
  let owesCents = 0;
  for (const balances of groupBalances) {
    const net = netFor(balances, userId);
    if (net > 0) receivesCents += net;
    else owesCents += -net;
  }
  return { receivesCents, owesCents, netCents: receivesCents - owesCents };
}

/** Agrupa (já ordenado do mais novo) por mês e dia locais. */
export function groupByMonthAndDay<T extends WithCreatedAt>(
  items: T[],
): { month: string; days: { day: string; items: T[] }[] }[] {
  const months: { month: string; days: { day: string; items: T[] }[] }[] = [];
  for (const item of items) {
    const day = localDay(item.createdAt);
    const month = day.slice(0, 7);
    let monthEntry = months[months.length - 1];
    if (!monthEntry || monthEntry.month !== month) {
      monthEntry = { month, days: [] };
      months.push(monthEntry);
    }
    let dayEntry = monthEntry.days[monthEntry.days.length - 1];
    if (!dayEntry || dayEntry.day !== day) {
      dayEntry = { day, items: [] };
      monthEntry.days.push(dayEntry);
    }
    dayEntry.items.push(item);
  }
  return months;
}

/** Índice estável de cor a partir do id do usuário. */
export function colorIndexFor(id: string, paletteSize: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % paletteSize;
}

/**
 * Converte o que a pessoa digitou ("1.234,56", "12,5", "R$ 30") em centavos.
 * Devolve null se não for um valor positivo válido.
 */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.replace(/R\$\s?/i, "").replace(/\s/g, "");
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$|^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }
  let normalized: string;
  if (cleaned.includes(",")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, "");
  } else {
    normalized = cleaned;
  }
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
