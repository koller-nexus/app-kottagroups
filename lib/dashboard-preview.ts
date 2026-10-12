// Dados de exemplo da dashboard sem login — cópia de
// mobile-kottagroups/src/data/mock.ts (getDashboardPreview) e do cálculo de
// src/data/balances.ts, para a web mostrar exatamente os mesmos números.

interface PreviewUser {
  id: string;
  name: string;
}

interface PreviewGroup {
  id: string;
  name: string;
  emoji: string;
  memberIds: string[];
}

interface PreviewExpense {
  groupId: string;
  amountCents: number;
  paidByUserId: string;
  splitType: "equal" | "custom";
  customSplit?: Record<string, number>;
  createdAt: string;
}

export interface Settlement {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

const PREVIEW_USER_ID = "u1";

const users: PreviewUser[] = [
  { id: "u1", name: "Você" },
  { id: "u2", name: "Marina" },
  { id: "u3", name: "Diego" },
  { id: "u4", name: "Ana" },
  { id: "u5", name: "Bruno" },
  { id: "u6", name: "Carol" },
];

const groups: PreviewGroup[] = [
  { id: "g1", name: "Apartamento", emoji: "🏠", memberIds: ["u1", "u2", "u3"] },
  { id: "g2", name: "Viagem pra Praia", emoji: "🏖️", memberIds: ["u1", "u2", "u4", "u5"] },
  { id: "g3", name: "Churrasco de Domingo", emoji: "🍖", memberIds: ["u1", "u3", "u5", "u6"] },
];

const expenses: PreviewExpense[] = [
  { groupId: "g1", amountCents: 32050, paidByUserId: "u1", splitType: "equal", createdAt: "2026-09-10T10:00:00Z" },
  { groupId: "g1", amountCents: 9990, paidByUserId: "u2", splitType: "equal", createdAt: "2026-09-08T09:00:00Z" },
  { groupId: "g2", amountCents: 240000, paidByUserId: "u4", splitType: "equal", createdAt: "2026-08-10T08:00:00Z" },
  { groupId: "g2", amountCents: 18450, paidByUserId: "u1", splitType: "equal", createdAt: "2026-08-11T21:00:00Z" },
  {
    groupId: "g2",
    amountCents: 15000,
    paidByUserId: "u2",
    splitType: "custom",
    customSplit: { u1: 3000, u2: 0, u4: 6000, u5: 6000 },
    createdAt: "2026-08-12T09:00:00Z",
  },
];

function splitShare(expense: PreviewExpense, memberIds: string[]): Record<string, number> {
  const total = expense.amountCents;
  if (expense.splitType === "custom" && expense.customSplit) {
    const split = expense.customSplit;
    const assigned = memberIds.reduce((acc, id) => acc + (split[id] ?? 0), 0);
    if (assigned === total) {
      return Object.fromEntries(memberIds.map((id) => [id, split[id] ?? 0]));
    }
  }
  const n = memberIds.length;
  const base = Math.floor(total / n);
  const remainder = total - base * n;
  return Object.fromEntries(memberIds.map((id, index) => [id, index < remainder ? base + 1 : base]));
}

export function groupBalances(groupExpenses: PreviewExpense[], memberIds: string[]): Map<string, number> {
  const net = new Map<string, number>(memberIds.map((id) => [id, 0]));
  for (const expense of groupExpenses) {
    const shares = splitShare(expense, memberIds);
    for (const id of memberIds) {
      const paid = expense.paidByUserId === id ? expense.amountCents : 0;
      net.set(id, (net.get(id) ?? 0) + paid - (shares[id] ?? 0));
    }
  }
  return net;
}

export function settlementsFor(net: Map<string, number>): Settlement[] {
  const balances = [...net.entries()]
    .map(([userId, netCents]) => ({ userId, netCents }))
    .filter((b) => b.netCents !== 0)
    .sort((a, b) => a.netCents - b.netCents);
  const debtors = balances.filter((b) => b.netCents < 0);
  const creditors = balances.filter((b) => b.netCents > 0).sort((a, b) => b.netCents - a.netCents);

  const out: Settlement[] = [];
  let d = 0;
  let c = 0;
  while (d < debtors.length && c < creditors.length) {
    const amount = Math.min(-debtors[d].netCents, creditors[c].netCents);
    if (amount > 0) out.push({ fromUserId: debtors[d].userId, toUserId: creditors[c].userId, amountCents: amount });
    debtors[d].netCents += amount;
    creditors[c].netCents -= amount;
    if (debtors[d].netCents === 0) d += 1;
    if (creditors[c].netCents === 0) c += 1;
  }
  return out;
}

export interface PreviewDashboard {
  receivesCents: number;
  owesCents: number;
  expenses: { amountCents: number; createdAt: string }[];
  recent: { id: string; youReceive: boolean; otherName: string; amountCents: number; paid: boolean }[];
  groups: { id: string; name: string; emoji: string; memberCount: number; netCents: number }[];
}

/** Mesma lógica do DashboardViewModel do app no modo sem login. */
export function buildPreviewDashboard(): PreviewDashboard {
  const nameById = new Map(users.map((u) => [u.id, u.name]));
  let receivesCents = 0;
  let owesCents = 0;
  const recent: PreviewDashboard["recent"] = [];

  const rows = groups.map((group) => {
    // Mesma ordem de membros do app: a ordem da lista de usuários.
    const memberIds = users.filter((u) => group.memberIds.includes(u.id)).map((u) => u.id);
    const groupExpenses = expenses.filter((e) => e.groupId === group.id);
    const net = groupBalances(groupExpenses, memberIds);
    const mine = net.get(PREVIEW_USER_ID) ?? 0;
    if (mine > 0) receivesCents += mine;
    if (mine < 0) owesCents += -mine;
    for (const s of settlementsFor(net)) {
      if (s.fromUserId !== PREVIEW_USER_ID && s.toUserId !== PREVIEW_USER_ID) continue;
      if (recent.length < 3) {
        const youReceive = s.toUserId === PREVIEW_USER_ID;
        recent.push({
          id: `${group.id}:${s.fromUserId}:${s.toUserId}`,
          youReceive,
          otherName: nameById.get(youReceive ? s.fromUserId : s.toUserId) ?? "",
          amountCents: s.amountCents,
          paid: false,
        });
      }
    }
    return {
      id: group.id,
      name: group.name,
      emoji: group.emoji,
      memberCount: memberIds.length,
      netCents: mine,
    };
  });

  return {
    receivesCents,
    owesCents,
    expenses: expenses.map(({ amountCents, createdAt }) => ({ amountCents, createdAt })),
    recent,
    groups: rows,
  };
}
