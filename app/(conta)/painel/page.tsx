import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/app/avatar";
import { ExpenseRow } from "@/components/app/expense-row";
import { ArrowRightIcon, PlusIcon } from "@/components/app/icons";
import { PageHeader, SectionLabel } from "@/components/app/page-header";
import { BalanceChip } from "@/components/landing/balance-chip";
import { MonthSpendBlock } from "@/components/landing/month-spend";
import { StatCard } from "@/components/landing/stat-card";
import {
  getMe,
  listCategories,
  listExpensesPage,
  listExpensesSince,
  listGroupDetails,
  listUnpaidNotifications,
} from "@/lib/api/kotta";
import { categoryLookup } from "@/lib/categories";
import { formatShortDate } from "@/lib/dates";
import {
  balanceTotals,
  localDay,
  monthSpend,
  netFor,
  previousMonthStartIso,
} from "@/lib/kotta-view";
import { formatBRL } from "@/lib/money";
import { displayName, firstName, peopleById } from "@/lib/people";

export const metadata: Metadata = {
  title: "Painel — Kotta Groups",
};

const RECENT_LIMIT = 6;

export default async function PainelPage() {
  const nowIso = new Date().toISOString();
  const [me, groups, pending, categories] = await Promise.all([
    getMe(),
    listGroupDetails(),
    listUnpaidNotifications(),
    listCategories(),
  ]);
  const since = previousMonthStartIso(nowIso);
  const [monthExpenses, firstPages] = await Promise.all([
    Promise.all(groups.map((g) => listExpensesSince(g.id, since))),
    Promise.all(groups.map((g) => listExpensesPage(g.id))),
  ]);

  const names = peopleById(groups);
  const category = categoryLookup(categories);
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const totals = balanceTotals(groups.map((g) => g.balances), me.id);
  const netPositive = totals.netCents >= 0;
  const spend = monthSpend(monthExpenses.flat(), nowIso);
  const recent = firstPages
    .flatMap((page) => page.items)
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, RECENT_LIMIT);

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName(me.name)}`}
        description="Veja quanto você tem a receber e a pagar em todos os grupos."
        actions={
          groups.length > 0 ? (
            <Link href="/despesas/nova" className="primary-action">
              <PlusIcon className="size-5" />
              Nova despesa
            </Link>
          ) : null
        }
      />

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <StatCard
          label="SEU SALDO"
          value={formatBRL(Math.abs(totals.netCents))}
          caption={netPositive ? "a receber no total" : "a pagar no total"}
          valueClassName={netPositive ? "text-kotta-primary" : "text-kotta-danger"}
        />
        <StatCard
          label="VOCÊ RECEBE"
          value={formatBRL(totals.receivesCents)}
          caption="em todos os grupos"
          valueClassName="text-kotta-primary"
        />
        <StatCard
          label="VOCÊ DEVE"
          value={formatBRL(totals.owesCents)}
          caption="em todos os grupos"
          valueClassName="text-kotta-danger"
        />
        <StatCard label="GRUPOS" value={String(groups.length)} caption="ativos com você" />
      </div>

      {groups.length === 0 ? (
        <section className="mt-10 rounded-card border border-dashed border-kotta-border bg-kotta-surface p-10 text-center">
          <h2 className="font-display text-2xl font-bold text-kotta-secondary">
            Crie seu primeiro grupo
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-kotta-muted">
            Um grupo reúne as pessoas com quem você divide gastos: a casa, uma viagem, o churrasco.
          </p>
          <Link href="/grupos/novo" className="primary-action mt-6">
            <PlusIcon className="size-5" />
            Novo grupo
          </Link>
        </section>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="flex min-w-0 flex-col gap-10">
            <MonthSpendBlock monthSpend={spend} className="" />

            <section aria-labelledby="atividade">
              <SectionLabel id="atividade">ATIVIDADE RECENTE</SectionLabel>
              {recent.length === 0 ? (
                <p className="rounded-card border border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
                  Nenhuma despesa ainda. Lance a primeira em um dos seus grupos.
                </p>
              ) : (
                <ul className="divide-y divide-kotta-border overflow-hidden rounded-card border border-kotta-border bg-kotta-surface">
                  {recent.map((expense) => (
                    <li key={expense.id}>
                      <Link
                        href={`/grupos/${expense.groupId}`}
                        className="block hover:bg-kotta-overlay focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-kotta-primary"
                      >
                        <ExpenseRow
                          description={expense.description}
                          amountCents={expense.amountCents}
                          category={category(expense.category)}
                          meta={`${displayName(names, expense.paidByUserId, me.id)} pagou · ${
                            groupById.get(expense.groupId)?.name ?? "Grupo"
                          } · ${formatShortDate(localDay(expense.createdAt))}`}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="flex flex-col gap-10">
            <section aria-labelledby="acertos-titulo" id="acertos" className="scroll-mt-24">
              <SectionLabel id="acertos-titulo">PARA ACERTAR</SectionLabel>
              {pending.length === 0 ? (
                <p className="rounded-card border border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
                  Tudo acertado. Nenhum pagamento pendente com você.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {pending.map((item) => {
                    const receiving = item.direction === "incoming";
                    const otherId = receiving ? item.from : item.to;
                    const otherName = names.get(otherId) ?? "Ex-membro";
                    return (
                      <li key={item.id}>
                        <Link
                          href={`/grupos/${item.group.id}?aba=saldos`}
                          className="flex items-center gap-3 rounded-card border border-kotta-border bg-kotta-surface p-4 hover:border-kotta-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
                        >
                          <Avatar person={{ id: otherId, name: otherName }} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm text-kotta-text">
                              {receiving ? (
                                <>
                                  <span className="font-bold">{firstName(otherName)}</span> te paga
                                </>
                              ) : (
                                <>
                                  Você paga <span className="font-bold">{firstName(otherName)}</span>
                                </>
                              )}
                            </span>
                            <span className="block truncate text-xs text-kotta-muted">
                              {item.group.name}
                            </span>
                          </span>
                          <span
                            className={`font-mono text-sm font-medium ${
                              receiving ? "text-kotta-primary" : "text-kotta-danger"
                            }`}
                          >
                            {formatBRL(item.amountCents)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section aria-labelledby="grupos">
              <div className="flex items-baseline justify-between">
                <SectionLabel id="grupos">SEUS GRUPOS</SectionLabel>
                <Link
                  href="/grupos"
                  className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-kotta-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
                >
                  Ver todos
                  <ArrowRightIcon className="size-4" />
                </Link>
              </div>
              <ul className="flex flex-col gap-3">
                {groups.map((group) => (
                  <li key={group.id}>
                    <Link
                      href={`/grupos/${group.id}`}
                      className="flex items-center gap-3 rounded-card border border-kotta-border bg-kotta-surface p-4 hover:border-kotta-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-11 shrink-0 items-center justify-center rounded-control bg-kotta-light-green text-xl"
                      >
                        {group.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-kotta-text">
                          {group.name}
                        </span>
                        <span className="block font-mono text-xs text-kotta-muted">
                          {group.members.length === 1 ? "1 membro" : `${group.members.length} membros`}
                        </span>
                      </span>
                      <BalanceChip netCents={netFor(group.balances, me.id)} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
