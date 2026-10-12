import Link from "next/link";
import { BalanceChip } from "@/components/app/balance-chip";
import { GardenField } from "@/components/app/garden-field";
import { Price } from "@/components/app/price";
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
  const spend = monthSpend(monthExpenses.flat(), nowIso);
  const monthMax = Math.max(spend.currentMonthCents, spend.previousMonthCents);
  // A API já devolve só as quitações que envolvem você, mais recentes primeiro.
  const recent = notifications.items;

  const bars = [
    { key: "prev", label: "Mês passado", value: spend.previousMonthCents, fill: "bg-kotta-border-strong" },
    { key: "this", label: "Este mês", value: spend.currentMonthCents, fill: "bg-kotta-primary" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[28px] font-bold leading-tight text-kotta-text">
        Olá, {firstName(me.name)}
      </h1>
      <p className="mt-1 max-w-80 text-base leading-[23px] text-kotta-muted">
        Dividir os gastos da viagem sem fazer conta de cabeça.
      </p>

      <GardenField className="mt-6">
        <p className="text-[13px] font-semibold text-kotta-on-field-muted">
          Seu saldo · {totals.netCents >= 0 ? "a receber" : "a pagar"}
        </p>
        <Price
          cents={totals.netCents}
          size={44}
          className={totals.netCents >= 0 ? "text-white" : "text-kotta-on-field-owes"}
        />
        <div className="mt-5 grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-[13px] font-semibold text-kotta-on-field-muted">Você recebe</p>
            <Price cents={totals.receivesCents} size={22} className="text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[13px] font-semibold text-kotta-on-field-muted">Você deve</p>
            <Price cents={totals.owesCents} size={22} className="text-white" />
          </div>
        </div>
      </GardenField>

      <section aria-labelledby="gastos" className="mt-8 flex flex-col gap-3 rounded-card bg-kotta-surface p-5">
        <h2 id="gastos" className="mb-1 text-[17px] font-bold text-kotta-text">
          Gastos dos grupos
        </h2>
        {bars.map((bar) => (
          <div key={bar.key} className="flex items-center gap-3">
            <p className="w-[88px] shrink-0 text-[13px] font-semibold text-kotta-muted">{bar.label}</p>
            <div className="h-2 flex-1 overflow-hidden rounded-pill bg-kotta-border">
              <div
                className={`h-full rounded-pill ${bar.fill}`}
                style={{ width: `${monthMax > 0 ? (bar.value / monthMax) * 100 : 0}%` }}
              />
            </div>
            <div className="min-w-[92px] text-right">
              <Price cents={bar.value} size={15} className="text-kotta-text" />
            </div>
          </div>
        ))}
      </section>

      <section aria-labelledby="quitacoes" id="acertos" className="scroll-mt-24">
        <h2 id="quitacoes" className="mt-8 mb-3 text-xl font-bold text-kotta-text">
          Últimas quitações
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-kotta-muted">Nenhuma quitação pendente por aqui.</p>
        ) : (
          <ul className="divide-y divide-kotta-border rounded-card bg-kotta-surface px-4">
            {recent.map((item) => {
              const youReceive = item.direction === "incoming";
              const otherName = names.get(youReceive ? item.from : item.to) ?? "Ex-membro";
              return (
                <li key={item.id}>
                  <Link
                    href={`/grupos/${item.group.id}?aba=saldos`}
                    className="flex min-h-[68px] items-center gap-3 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-base font-semibold text-kotta-text">
                        {youReceive ? `${otherName} te paga` : `Você paga pra ${otherName}`}
                      </span>
                      <span className="text-[13px] text-kotta-muted">
                        {item.group.name} ·{" "}
                        <span className={`font-semibold ${item.paid ? "text-kotta-primary" : ""}`}>
                          {item.paid ? "Pago" : "Pendente"}
                        </span>
                      </span>
                    </span>
                    <Price
                      cents={item.amountCents}
                      size={18}
                      sign={youReceive ? "+" : "−"}
                      className={youReceive ? "text-kotta-primary" : "text-kotta-danger"}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="grupos">
        <h2 id="grupos" className="mt-8 mb-3 text-xl font-bold text-kotta-text">
          Seus grupos{groups.length > 0 ? ` · ${groups.length}` : ""}
        </h2>
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-card bg-kotta-surface p-5 text-center">
            <p className="text-[15px] leading-[22px] text-kotta-muted">
              Você ainda não participa de nenhum grupo. Crie o primeiro.
            </p>
            <Link href="/grupos/novo" className="primary-action px-8">
              Criar grupo
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-kotta-border rounded-card bg-kotta-surface px-4">
            {groups.map((group) => (
              <li key={group.id}>
                <Link
                  href={`/grupos/${group.id}`}
                  className="flex min-h-[68px] items-center gap-3 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-control bg-kotta-bg text-[22px]"
                  >
                    {group.emoji}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-base font-semibold text-kotta-text">{group.name}</span>
                    <span className="text-[13px] text-kotta-muted">
                      {group.members.length} {group.members.length === 1 ? "pessoa" : "pessoas"}
                    </span>
                  </span>
                  <BalanceChip netCents={netFor(group.balances, me.id)} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
