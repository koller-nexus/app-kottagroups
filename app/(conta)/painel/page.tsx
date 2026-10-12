import type { Metadata } from "next";
import { DashboardView, type DashboardSettlement } from "@/components/app/dashboard-view";
import { getMe, listExpensesSince, listGroupDetails, listSettlements } from "@/lib/api/kotta";
import { balanceTotals, monthSpend, netFor, previousMonthStartIso } from "@/lib/kotta-view";
import { peopleById } from "@/lib/people";

export const metadata: Metadata = {
  title: "Painel — Kotta Groups",
};

// Mesmo limite do DashboardViewModel do app.
const RECENT_LIMIT = 3;

export default async function PainelPage() {
  const nowIso = new Date().toISOString();
  const since = previousMonthStartIso(nowIso);
  const [me, groups] = await Promise.all([getMe(), listGroupDetails()]);
  const [monthExpenses, settlementsByGroup] = await Promise.all([
    Promise.all(groups.map((g) => listExpensesSince(g.id, since))),
    Promise.all(groups.map((g) => listSettlements(g.id))),
  ]);

  const names = peopleById(groups);
  const totals = balanceTotals(groups.map((g) => g.balances), me.id);
  const recent: DashboardSettlement[] = [];
  groups.forEach((group, index) => {
    for (const s of settlementsByGroup[index]) {
      if (recent.length >= RECENT_LIMIT) return;
      if (s.from !== me.id && s.to !== me.id) continue;
      const youReceive = s.to === me.id;
      recent.push({
        id: s.id,
        youReceive,
        otherName: names.get(youReceive ? s.from : s.to) ?? "Ex-membro",
        amountCents: s.amountCents,
        paid: s.paid,
        href: `/grupos/${group.id}?aba=saldos`,
      });
    }
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="sr-only">Painel</h1>
      <DashboardView
        receivesCents={totals.receivesCents}
        owesCents={totals.owesCents}
        monthSpend={monthSpend(monthExpenses.flat(), nowIso)}
        recent={recent}
        groups={groups.map((group) => ({
          id: group.id,
          name: group.name,
          emoji: group.emoji,
          memberCount: group.members.length,
          netCents: netFor(group.balances, me.id),
          href: `/grupos/${group.id}`,
        }))}
        empty={{
          text: "Você ainda não participa de nenhum grupo. Crie o primeiro.",
          actionLabel: "Criar grupo",
          actionHref: "/grupos/novo",
        }}
      />
    </div>
  );
}
