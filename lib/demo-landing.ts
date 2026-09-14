export type SettlementDirection = "receive" | "pay";
export type SettlementStatus = "pending" | "paid";
export type StoreKind = "app-store" | "play-store";

export interface BalanceSnapshot {
  netCents: number;
  receivesCents: number;
  owesCents: number;
  groupCount: number;
}

export interface MonthSpend {
  previousMonthCents: number;
  currentMonthCents: number;
}

export interface Settlement {
  id: string;
  counterpartName: string;
  amountCents: number;
  direction: SettlementDirection;
  status: SettlementStatus;
}

export interface DemoGroup {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  netCents: number;
}

export interface StoreBadgeConfig {
  store: StoreKind;
  label: string;
}

export interface LandingSnapshot {
  tagline: string;
  balances: BalanceSnapshot;
  monthSpend: MonthSpend;
  settlements: Settlement[];
  groups: DemoGroup[];
  storeBadges: StoreBadgeConfig[];
}

export const landingSnapshot: LandingSnapshot = {
  tagline: "Dividir gastos com amigos nunca foi tão fácil.",
  balances: {
    netCents: 14300,
    receivesCents: 18500,
    owesCents: 4200,
    groupCount: 3,
  },
  monthSpend: {
    previousMonthCents: 273450,
    currentMonthCents: 42040,
  },
  settlements: [
    {
      id: "s1",
      counterpartName: "Marina",
      amountCents: 8500,
      direction: "receive",
      status: "pending",
    },
    {
      id: "s2",
      counterpartName: "Diego",
      amountCents: 4200,
      direction: "pay",
      status: "pending",
    },
    {
      id: "s3",
      counterpartName: "Ana",
      amountCents: 10000,
      direction: "receive",
      status: "paid",
    },
  ],
  groups: [
    {
      id: "g1",
      name: "Apartamento",
      emoji: "🏠",
      memberCount: 3,
      netCents: 7200,
    },
    {
      id: "g2",
      name: "Viagem pra Praia",
      emoji: "🏖️",
      memberCount: 4,
      netCents: 7100,
    },
    {
      id: "g3",
      name: "Churrasco de Domingo",
      emoji: "🍖",
      memberCount: 4,
      netCents: 0,
    },
  ],
  storeBadges: [
    { store: "app-store", label: "Em breve" },
    { store: "play-store", label: "Em breve" },
  ],
};
