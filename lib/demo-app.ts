import { computeNetBalances, simplifyDebts, type Transfer } from "@/lib/balances";

// TODO: substituir pelos dados da api-kottagroups (/api/v1) quando o login web existir.

export interface Member {
  id: string;
  name: string;
  email: string;
  pixKey?: string;
  colorIndex: number;
}

export type CategoryId =
  | "mercado"
  | "contas"
  | "aluguel"
  | "transporte"
  | "hospedagem"
  | "restaurante"
  | "lazer";

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  categoryId: CategoryId;
  paidById: string;
  amountCents: number;
  /** Data local no formato AAAA-MM-DD. */
  date: string;
  splitAmong: string[];
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  memberIds: string[];
  createdAt: string;
}

export const CURRENT_USER_ID = "lucas";

export const members: Member[] = [
  {
    id: "lucas",
    name: "Lucas Andrade",
    email: "lucas.andrade@exemplo.com.br",
    pixKey: "lucas.andrade@exemplo.com.br",
    colorIndex: 0,
  },
  { id: "marina", name: "Marina Costa", email: "marina@exemplo.com.br", colorIndex: 1 },
  { id: "diego", name: "Diego Alves", email: "diego@exemplo.com.br", colorIndex: 2 },
  { id: "ana", name: "Ana Ribeiro", email: "ana@exemplo.com.br", colorIndex: 3 },
  { id: "rafa", name: "Rafael Souza", email: "rafa@exemplo.com.br", colorIndex: 4 },
  { id: "bia", name: "Beatriz Lima", email: "bia@exemplo.com.br", colorIndex: 5 },
];

export const categories: Category[] = [
  { id: "mercado", label: "Mercado", emoji: "🛒" },
  { id: "contas", label: "Contas da casa", emoji: "💡" },
  { id: "aluguel", label: "Aluguel", emoji: "🔑" },
  { id: "transporte", label: "Transporte", emoji: "🚗" },
  { id: "hospedagem", label: "Hospedagem", emoji: "🛏️" },
  { id: "restaurante", label: "Restaurante", emoji: "🍽️" },
  { id: "lazer", label: "Lazer", emoji: "🎟️" },
];

export const groups: Group[] = [
  {
    id: "apartamento",
    name: "Apartamento",
    emoji: "🏠",
    memberIds: ["lucas", "marina", "diego"],
    createdAt: "2026-03-02",
  },
  {
    id: "viagem-praia",
    name: "Viagem pra Praia",
    emoji: "🏖️",
    memberIds: ["lucas", "marina", "ana", "rafa"],
    createdAt: "2026-08-20",
  },
  {
    id: "churrasco",
    name: "Churrasco de Domingo",
    emoji: "🍖",
    memberIds: ["lucas", "diego", "ana", "bia"],
    createdAt: "2026-09-27",
  },
];

const apto = ["lucas", "marina", "diego"];
const praia = ["lucas", "marina", "ana", "rafa"];
const churras = ["lucas", "diego", "ana", "bia"];

export const expenses: Expense[] = [
  // Apartamento
  { id: "e1", groupId: "apartamento", description: "Aluguel de outubro", categoryId: "aluguel", paidById: "lucas", amountCents: 240000, date: "2026-10-05", splitAmong: apto },
  { id: "e2", groupId: "apartamento", description: "Conta de luz", categoryId: "contas", paidById: "marina", amountCents: 21870, date: "2026-10-08", splitAmong: apto },
  { id: "e3", groupId: "apartamento", description: "Internet", categoryId: "contas", paidById: "diego", amountCents: 11990, date: "2026-10-09", splitAmong: apto },
  { id: "e4", groupId: "apartamento", description: "Compra do mês", categoryId: "mercado", paidById: "diego", amountCents: 64320, date: "2026-10-11", splitAmong: apto },
  { id: "e5", groupId: "apartamento", description: "Aluguel de setembro", categoryId: "aluguel", paidById: "marina", amountCents: 240000, date: "2026-09-05", splitAmong: apto },
  { id: "e6", groupId: "apartamento", description: "Produtos de limpeza", categoryId: "mercado", paidById: "lucas", amountCents: 8740, date: "2026-09-18", splitAmong: apto },
  // Viagem pra Praia
  { id: "e7", groupId: "viagem-praia", description: "Casa em Ubatuba (3 diárias)", categoryId: "hospedagem", paidById: "lucas", amountCents: 186000, date: "2026-09-12", splitAmong: praia },
  { id: "e8", groupId: "viagem-praia", description: "Gasolina e pedágio", categoryId: "transporte", paidById: "rafa", amountCents: 38460, date: "2026-09-12", splitAmong: praia },
  { id: "e9", groupId: "viagem-praia", description: "Peixe no quiosque", categoryId: "restaurante", paidById: "marina", amountCents: 27350, date: "2026-09-13", splitAmong: praia },
  { id: "e10", groupId: "viagem-praia", description: "Passeio de barco", categoryId: "lazer", paidById: "ana", amountCents: 32000, date: "2026-09-14", splitAmong: praia },
  // Churrasco de Domingo
  { id: "e11", groupId: "churrasco", description: "Carnes no açougue", categoryId: "mercado", paidById: "diego", amountCents: 31280, date: "2026-10-04", splitAmong: churras },
  { id: "e12", groupId: "churrasco", description: "Bebidas e gelo", categoryId: "mercado", paidById: "ana", amountCents: 14760, date: "2026-10-04", splitAmong: churras },
  { id: "e13", groupId: "churrasco", description: "Carvão e acendedor", categoryId: "mercado", paidById: "bia", amountCents: 4920, date: "2026-10-04", splitAmong: churras },
];

/** Data de referência dos dados de demonstração. */
export const DEMO_TODAY = "2026-10-12";

const memberById = new Map(members.map((m) => [m.id, m]));
const categoryById = new Map(categories.map((c) => [c.id, c]));
const groupById = new Map(groups.map((g) => [g.id, g]));

export function getMember(id: string): Member {
  const member = memberById.get(id);
  if (!member) throw new Error(`Membro desconhecido: ${id}`);
  return member;
}

export function getCategory(id: CategoryId): Category {
  return categoryById.get(id) ?? categories[0];
}

export function getGroup(id: string): Group | undefined {
  return groupById.get(id);
}

export function firstName(member: Member): string {
  return member.name.split(" ")[0];
}

export function groupExpenses(groupId: string): Expense[] {
  return expenses
    .filter((e) => e.groupId === groupId)
    .toSorted((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export function groupNetBalances(group: Group): Record<string, number> {
  return computeNetBalances(group.memberIds, groupExpenses(group.id));
}

export function groupTransfers(group: Group): Transfer[] {
  return simplifyDebts(groupNetBalances(group));
}

export function groupTotalCents(groupId: string): number {
  return groupExpenses(groupId).reduce((sum, e) => sum + e.amountCents, 0);
}

export interface GroupSummary {
  group: Group;
  netCents: number;
  totalCents: number;
  lastExpenseDate?: string;
}

export function groupSummaries(): GroupSummary[] {
  return groups.map((group) => {
    const list = groupExpenses(group.id);
    return {
      group,
      netCents: groupNetBalances(group)[CURRENT_USER_ID] ?? 0,
      totalCents: list.reduce((sum, e) => sum + e.amountCents, 0),
      lastExpenseDate: list[0]?.date,
    };
  });
}

export interface PendingTransfer extends Transfer {
  groupId: string;
}

/** Transferências em que o usuário atual paga ou recebe. */
export function myPendingTransfers(): PendingTransfer[] {
  return groups.flatMap((group) =>
    groupTransfers(group)
      .filter((t) => t.fromId === CURRENT_USER_ID || t.toId === CURRENT_USER_ID)
      .map((t) => ({ ...t, groupId: group.id })),
  );
}

export function dashboardTotals() {
  let receivesCents = 0;
  let owesCents = 0;
  for (const summary of groupSummaries()) {
    if (summary.netCents > 0) receivesCents += summary.netCents;
    else owesCents += -summary.netCents;
  }
  return {
    receivesCents,
    owesCents,
    netCents: receivesCents - owesCents,
    groupCount: groups.length,
  };
}

/** Gasto total dos grupos no mês de referência e no anterior. */
export function monthSpend() {
  const current = DEMO_TODAY.slice(0, 7);
  const [year, month] = current.split("-").map(Number);
  const previousDate = new Date(Date.UTC(year, month - 2, 1));
  const previous = previousDate.toISOString().slice(0, 7);

  let currentMonthCents = 0;
  let previousMonthCents = 0;
  for (const e of expenses) {
    if (e.date.startsWith(current)) currentMonthCents += e.amountCents;
    else if (e.date.startsWith(previous)) previousMonthCents += e.amountCents;
  }
  return { currentMonthCents, previousMonthCents };
}

export function recentExpenses(limit: number): Expense[] {
  return expenses
    .toSorted((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, limit);
}

/** Parte do usuário atual numa despesa (0 se não participa). */
export function myShareCents(expense: Expense): number {
  const index = expense.splitAmong.indexOf(CURRENT_USER_ID);
  if (index === -1) return 0;
  const count = expense.splitAmong.length;
  const base = Math.floor(expense.amountCents / count);
  return index < expense.amountCents - base * count ? base + 1 : base;
}
