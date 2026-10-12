import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/app/avatar";
import { ArrowRightIcon, PlusIcon } from "@/components/app/icons";
import { NotificationsButton } from "@/components/app/notifications-button";
import { PageHeader, SectionLabel } from "@/components/app/page-header";
import { BalanceChip } from "@/components/landing/balance-chip";
import { MonthSpendBlock } from "@/components/landing/month-spend";
import { StatCard } from "@/components/landing/stat-card";
import {
  CURRENT_USER_ID,
  dashboardTotals,
  firstName,
  getCategory,
  getGroup,
  getMember,
  groupSummaries,
  monthSpend,
  myPendingTransfers,
  myShareCents,
  recentExpenses,
} from "@/lib/demo-app";
import { formatShortDate } from "@/lib/dates";
import { formatBRL } from "@/lib/money";

export const metadata: Metadata = {
  title: "Painel — Kotta Groups",
};

export default function PainelPage() {
  const me = getMember(CURRENT_USER_ID);
  const totals = dashboardTotals();
  const netPositive = totals.netCents >= 0;
  const pending = myPendingTransfers();
  const summaries = groupSummaries();
  const recent = recentExpenses(6);

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName(me)}`}
        description="Veja quanto você tem a receber e a pagar em todos os grupos."
        actions={
          <>
            <span className="hidden lg:block">
              <NotificationsButton />
            </span>
            {/* TODO: abrir o formulário de nova despesa. */}
            <button type="button" className="primary-action">
              <PlusIcon className="size-5" />
              Nova despesa
            </button>
          </>
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
        <StatCard
          label="GRUPOS"
          value={String(totals.groupCount)}
          caption="ativos com você"
        />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-10">
          <MonthSpendBlock monthSpend={monthSpend()} className="" />

          <section aria-labelledby="atividade">
            <SectionLabel id="atividade">ATIVIDADE RECENTE</SectionLabel>
            <ul className="divide-y divide-kotta-border overflow-hidden rounded-card border border-kotta-border bg-kotta-surface">
              {recent.map((expense) => {
                const group = getGroup(expense.groupId);
                const payer = getMember(expense.paidById);
                const category = getCategory(expense.categoryId);
                const share = myShareCents(expense);
                const iPaid = expense.paidById === CURRENT_USER_ID;
                return (
                  <li key={expense.id}>
                    <Link
                      href={`/grupos/${expense.groupId}`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-kotta-overlay focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-kotta-primary sm:px-6"
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-11 shrink-0 items-center justify-center rounded-control bg-kotta-light-green text-xl"
                      >
                        {category.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-kotta-text">
                          {expense.description}
                        </span>
                        <span className="mt-0.5 block truncate text-[13px] text-kotta-muted">
                          {iPaid ? "Você pagou" : `${firstName(payer)} pagou`} ·{" "}
                          {group?.name} · {formatShortDate(expense.date)}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-mono text-sm font-medium text-kotta-text">
                          {formatBRL(expense.amountCents)}
                        </span>
                        <span
                          className={`block font-mono text-[11px] ${
                            iPaid ? "text-kotta-primary" : "text-kotta-danger"
                          }`}
                        >
                          {iPaid
                            ? `recebe ${formatBRL(expense.amountCents - share)}`
                            : `sua parte ${formatBRL(share)}`}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-10">
          <section aria-labelledby="acertos">
            <SectionLabel id="acertos">PARA ACERTAR</SectionLabel>
            {pending.length === 0 ? (
              <p className="rounded-card border border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
                Tudo acertado. Nenhum pagamento pendente com você.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {pending.map((transfer) => {
                  const receiving = transfer.toId === CURRENT_USER_ID;
                  const other = getMember(receiving ? transfer.fromId : transfer.toId);
                  const group = getGroup(transfer.groupId);
                  return (
                    <li
                      key={`${transfer.groupId}-${transfer.fromId}-${transfer.toId}`}
                      className="flex items-center gap-3 rounded-card border border-kotta-border bg-kotta-surface p-4"
                    >
                      <Avatar member={other} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-kotta-text">
                          {receiving ? (
                            <>
                              <span className="font-bold">{firstName(other)}</span> te paga
                            </>
                          ) : (
                            <>
                              Você paga <span className="font-bold">{firstName(other)}</span>
                            </>
                          )}
                        </p>
                        <p className="truncate text-xs text-kotta-muted">{group?.name}</p>
                      </div>
                      <span
                        className={`font-mono text-sm font-medium ${
                          receiving ? "text-kotta-primary" : "text-kotta-danger"
                        }`}
                      >
                        {formatBRL(transfer.amountCents)}
                      </span>
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
              {summaries.map(({ group, netCents }) => (
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
                        {group.memberIds.length} membros
                      </span>
                    </span>
                    <BalanceChip netCents={netCents} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
