import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarStack } from "@/components/app/avatar";
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon, SettingsIcon } from "@/components/app/icons";
import { PageHeader, SectionLabel } from "@/components/app/page-header";
import {
  CURRENT_USER_ID,
  firstName,
  getCategory,
  getGroup,
  getMember,
  groupExpenses,
  groupNetBalances,
  groupTotalCents,
  groupTransfers,
  groups,
  myShareCents,
  type Expense,
} from "@/lib/demo-app";
import { formatLongDay, formatMonthYear } from "@/lib/dates";
import { formatBRL } from "@/lib/money";

type Tab = "despesas" | "saldos";

export function generateStaticParams() {
  return groups.map((group) => ({ id: group.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/grupos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const group = getGroup(id);
  return { title: group ? `${group.name} — Kotta Groups` : "Grupo — Kotta Groups" };
}

export default async function GrupoPage({
  params,
  searchParams,
}: PageProps<"/grupos/[id]">) {
  const { id } = await params;
  const { aba } = await searchParams;
  const group = getGroup(id);
  if (!group) notFound();

  const tab: Tab = aba === "saldos" ? "saldos" : "despesas";
  const list = groupExpenses(group.id);
  const net = groupNetBalances(group);
  const transfers = groupTransfers(group);
  const myNet = net[CURRENT_USER_ID] ?? 0;
  const memberList = group.memberIds.map(getMember);

  return (
    <>
      <Link
        href="/grupos"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-kotta-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
      >
        <ArrowLeftIcon className="size-4" />
        Grupos
      </Link>

      <PageHeader
        leading={
          <span
            aria-hidden="true"
            className="flex size-16 shrink-0 items-center justify-center rounded-card bg-kotta-light-green text-4xl sm:size-20 sm:text-5xl"
          >
            {group.emoji}
          </span>
        }
        title={group.name}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <AvatarStack members={memberList} />
            <span className="font-mono text-xs">
              {memberList.length} membros · {formatBRL(groupTotalCents(group.id))} gastos
            </span>
          </span>
        }
        actions={
          <>
            {/* TODO: abrir edição do grupo e gestão de membros. */}
            <button type="button" className="secondary-action" aria-label="Configurar grupo">
              <SettingsIcon className="size-5" />
              <span className="hidden sm:inline">Configurar</span>
            </button>
            {/* TODO: abrir o formulário de nova despesa neste grupo. */}
            <button type="button" className="primary-action">
              <PlusIcon className="size-5" />
              Nova despesa
            </button>
          </>
        }
      />

      <div
        role="tablist"
        aria-label="Seções do grupo"
        className="mt-8 grid grid-cols-2 rounded-control border border-kotta-border bg-kotta-surface p-1 lg:hidden"
      >
        <TabLink id={group.id} tab="despesas" current={tab}>
          Despesas
        </TabLink>
        <TabLink id={group.id} tab="saldos" current={tab}>
          Saldos
        </TabLink>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <section
          aria-labelledby="despesas"
          className={tab === "despesas" ? "min-w-0" : "hidden min-w-0 lg:block"}
        >
          <SectionLabel id="despesas">DESPESAS</SectionLabel>
          <ExpenseTimeline expenses={list} />
        </section>

        <aside
          aria-label="Saldos do grupo"
          className={`flex flex-col gap-8 lg:sticky lg:top-10 lg:self-start ${
            tab === "saldos" ? "" : "hidden lg:flex"
          }`}
        >
          <section
            aria-labelledby="seu-saldo"
            className={`rounded-card p-6 ${
              myNet > 0
                ? "bg-kotta-primary text-white"
                : "border border-kotta-border bg-kotta-surface"
            }`}
          >
            <h2
              id="seu-saldo"
              className={`font-mono text-[11px] font-medium tracking-wide ${
                myNet > 0 ? "text-white/75" : "text-kotta-muted"
              }`}
            >
              SEU SALDO NO GRUPO
            </h2>
            <p
              className={`mt-3 font-mono text-[32px] font-medium leading-none ${
                myNet > 0 ? "" : myNet < 0 ? "text-kotta-danger" : "text-kotta-text"
              }`}
            >
              {formatBRL(Math.abs(myNet))}
            </p>
            <p className={`mt-2 text-sm ${myNet > 0 ? "text-white/85" : "text-kotta-muted"}`}>
              {myNet > 0
                ? "Você tem a receber neste grupo."
                : myNet < 0
                  ? "Você tem a pagar neste grupo."
                  : "Você está quite neste grupo."}
            </p>
          </section>

          <section aria-labelledby="acertos">
            <SectionLabel id="acertos">PARA ACERTAR</SectionLabel>
            {transfers.length === 0 ? (
              <p className="rounded-card border border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
                Todos estão quites neste grupo.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {transfers.map((transfer) => {
                  const from = getMember(transfer.fromId);
                  const to = getMember(transfer.toId);
                  const involvesMe =
                    transfer.fromId === CURRENT_USER_ID || transfer.toId === CURRENT_USER_ID;
                  return (
                    <li
                      key={`${transfer.fromId}-${transfer.toId}`}
                      className={`rounded-card border bg-kotta-surface p-4 ${
                        involvesMe ? "border-kotta-accent" : "border-kotta-border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar member={from} size="sm" />
                        <ArrowRightIcon className="size-4 text-kotta-muted" />
                        <Avatar member={to} size="sm" />
                        <span className="ml-auto font-mono text-sm font-medium text-kotta-text">
                          {formatBRL(transfer.amountCents)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-kotta-text">
                        <span className="font-semibold">{displayName(from.id)}</span>{" "}
                        paga{" "}
                        <span className="font-semibold">{displayName(to.id, true)}</span>
                      </p>
                      {involvesMe ? (
                        // TODO: registrar quitação na api-kottagroups.
                        <button
                          type="button"
                          className="mt-3 text-sm font-semibold text-kotta-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
                        >
                          Marcar como pago
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="membros">
            <SectionLabel id="membros">MEMBROS</SectionLabel>
            <ul className="divide-y divide-kotta-border rounded-card border border-kotta-border bg-kotta-surface">
              {memberList.map((member) => {
                const value = net[member.id] ?? 0;
                return (
                  <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar member={member} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-kotta-text">
                      {member.id === CURRENT_USER_ID ? `${member.name} (você)` : member.name}
                    </span>
                    <span
                      className={`font-mono text-[13px] font-medium ${
                        value > 0
                          ? "text-kotta-primary"
                          : value < 0
                            ? "text-kotta-danger"
                            : "text-kotta-muted"
                      }`}
                    >
                      {value === 0
                        ? "quite"
                        : `${value > 0 ? "+" : "−"} ${formatBRL(Math.abs(value))}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}

function displayName(memberId: string, object = false): string {
  if (memberId === CURRENT_USER_ID) return object ? "você" : "Você";
  return firstName(getMember(memberId));
}

function TabLink({
  id,
  tab,
  current,
  children,
}: {
  id: string;
  tab: Tab;
  current: Tab;
  children: ReactNode;
}) {
  const active = tab === current;
  return (
    <Link
      href={tab === "despesas" ? `/grupos/${id}` : `/grupos/${id}?aba=${tab}`}
      role="tab"
      aria-selected={active}
      scroll={false}
      replace
      className={`flex min-h-11 items-center justify-center rounded-[9px] text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary ${
        active ? "bg-kotta-primary text-white" : "text-kotta-muted"
      }`}
    >
      {children}
    </Link>
  );
}

function ExpenseTimeline({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-kotta-border bg-kotta-surface p-8 text-center">
        <p className="font-semibold text-kotta-text">Nenhuma despesa ainda</p>
        <p className="mt-1 text-sm text-kotta-muted">
          Adicione a primeira despesa para começar a dividir.
        </p>
      </div>
    );
  }

  const months = new Map<string, Map<string, Expense[]>>();
  for (const expense of expenses) {
    const monthKey = expense.date.slice(0, 7);
    const days = months.get(monthKey) ?? new Map<string, Expense[]>();
    const day = days.get(expense.date) ?? [];
    day.push(expense);
    days.set(expense.date, day);
    months.set(monthKey, days);
  }

  return (
    <div className="flex flex-col gap-8">
      {[...months.entries()].map(([monthKey, days]) => (
        <div key={monthKey}>
          <h3 className="font-display text-xl font-semibold text-kotta-secondary first-letter:uppercase">
            {formatMonthYear(`${monthKey}-01`)}
          </h3>
          <div className="mt-4 flex flex-col gap-5">
            {[...days.entries()].map(([day, dayExpenses]) => (
              <div key={day}>
                <p className="mb-2 text-[13px] text-kotta-muted first-letter:uppercase">
                  {formatLongDay(day)}
                </p>
                <ul className="divide-y divide-kotta-border overflow-hidden rounded-card border border-kotta-border bg-kotta-surface">
                  {dayExpenses.map((expense) => (
                    <ExpenseRow key={expense.id} expense={expense} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  const category = getCategory(expense.categoryId);
  const iPaid = expense.paidById === CURRENT_USER_ID;
  const share = myShareCents(expense);
  const lent = iPaid ? expense.amountCents - share : 0;

  let impact: { text: string; className: string };
  if (iPaid) {
    impact = { text: `você emprestou ${formatBRL(lent)}`, className: "text-kotta-primary" };
  } else if (share > 0) {
    impact = { text: `você deve ${formatBRL(share)}`, className: "text-kotta-danger" };
  } else {
    impact = { text: "não envolve você", className: "text-kotta-muted" };
  }

  return (
    <li className="flex items-center gap-4 px-5 py-4 sm:px-6">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-control bg-kotta-light-green text-xl"
      >
        {category.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-kotta-text">{expense.description}</p>
        <p className="mt-0.5 truncate text-[13px] text-kotta-muted">
          {displayName(expense.paidById)} pagou · {category.label}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-medium text-kotta-text">
          {formatBRL(expense.amountCents)}
        </p>
        <p className={`font-mono text-[11px] ${impact.className}`}>{impact.text}</p>
      </div>
    </li>
  );
}
