import { DashboardView } from "@/components/app/dashboard-view";
import {
  getMe,
  listExpensesSince,
  listGroupDetails,
  listNotificationsPage,
} from "@/lib/api/kotta";
import { balanceTotals, monthSpend, netFor, previousMonthStartIso } from "@/lib/kotta-view";
import { firstName, peopleById } from "@/lib/people";

// Mesmo limite do DashboardViewModel do app.
const RECENT_LIMIT = 3;

export async function Dashboard() {
  const nowIso = new Date().toISOString();
  const since = previousMonthStartIso(nowIso);
  const [me, groups, notifications] = await Promise.all([
    getMe(),
    listGroupDetails(),
    listNotificationsPage("all", RECENT_LIMIT),
  ]);
  const monthExpenses = await Promise.all(groups.map((g) => listExpensesSince(g.id, since)));

  const names = peopleById(groups);
  const totals = balanceTotals(groups.map((g) => g.balances), me.id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[28px] font-bold leading-tight text-kotta-text">
        Olá, {firstName(me.name)}
      </h1>
      <DashboardView
        receivesCents={totals.receivesCents}
        owesCents={totals.owesCents}
        monthSpend={monthSpend(monthExpenses.flat(), nowIso)}
        // A API já devolve só as quitações que envolvem você, mais recentes primeiro.
        recent={notifications.items.map((item) => {
          const youReceive = item.direction === "incoming";
          return {
            id: item.id,
            youReceive,
            otherName: names.get(youReceive ? item.from : item.to) ?? "Ex-membro",
            amountCents: item.amountCents,
            paid: item.paid,
            groupName: item.group.name,
            href: `/grupos/${item.group.id}?aba=saldos`,
          };
        })}
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
