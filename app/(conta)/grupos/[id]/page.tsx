import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { markSettlementPaidAction } from "@/app/actions/kotta";
import { Avatar, AvatarStack } from "@/components/app/avatar";
import { ExpenseRow } from "@/components/app/expense-row";
import { GardenField } from "@/components/app/garden-field";
import { Price } from "@/components/app/price";
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon } from "@/components/app/icons";
import { PageHeader, SectionLabel } from "@/components/app/page-header";
import { getGroup, getMe, listCategories, listExpensesPage, listSettlements } from "@/lib/api/kotta";
import { ApiError } from "@/lib/api/errors";
import type { ApiGroupDetail } from "@/lib/api/types";
import { categoryLookup } from "@/lib/categories";
import { formatLongDay, formatMonthYear } from "@/lib/dates";
import { groupByMonthAndDay, netFor } from "@/lib/kotta-view";
import { displayName, peopleById } from "@/lib/people";

type Tab = "despesas" | "saldos";

async function loadGroup(id: string): Promise<ApiGroupDetail> {
  try {
    return await getGroup(id);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/grupos/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const group = await getGroup(id);
    return { title: `${group.name} — Kotta Groups` };
  } catch {
    return { title: "Grupo — Kotta Groups" };
  }
}

export default async function GrupoPage({ params, searchParams }: PageProps<"/grupos/[id]">) {
  const { id } = await params;
  const { aba } = await searchParams;
  const tab: Tab = aba === "saldos" ? "saldos" : "despesas";

  const [me, group, expensePage, settlements, categories] = await Promise.all([
    getMe(),
    loadGroup(id),
    listExpensesPage(id),
    listSettlements(id),
    listCategories(),
  ]);

  const names = peopleById([group]);
  const category = categoryLookup(categories);
  const myNet = netFor(group.balances, me.id);
  const open = settlements.filter((s) => !s.paid);
  const done = settlements.filter((s) => s.paid);
  const timeline = groupByMonthAndDay(expensePage.items);

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
            <AvatarStack people={group.members} />
            <span className="text-[13px]">
              {group.members.length} {group.members.length === 1 ? "pessoa" : "pessoas"}
              {group.archived ? " · arquivado" : ""}
            </span>
          </span>
        }
        actions={
          group.archived ? null : (
            <Link href={`/despesas/nova?grupo=${group.id}`} className="primary-action">
              <PlusIcon className="size-5" />
              Nova despesa
            </Link>
          )
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
          <SectionLabel id="despesas">Despesas</SectionLabel>
          {timeline.length === 0 ? (
            <div className="rounded-card border border-dashed border-kotta-border bg-kotta-surface p-8 text-center">
              <p className="font-semibold text-kotta-text">Nenhuma despesa ainda</p>
              <p className="mt-1 text-sm text-kotta-muted">
                Lance a primeira despesa para começar a dividir.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {timeline.map(({ month, days }) => (
                <div key={month}>
                  <h3 className="text-[17px] font-bold text-kotta-text first-letter:uppercase">
                    {formatMonthYear(`${month}-01`)}
                  </h3>
                  <div className="mt-4 flex flex-col gap-5">
                    {days.map(({ day, items }) => (
                      <div key={day}>
                        <p className="mb-2 text-[13px] text-kotta-muted first-letter:uppercase">
                          {formatLongDay(day)}
                        </p>
                        <ul className="divide-y divide-kotta-border overflow-hidden rounded-card border border-kotta-border bg-kotta-surface">
                          {items.map((expense) => {
                            const cat = category(expense.category);
                            return (
                              <li key={expense.id}>
                                <ExpenseRow
                                  description={expense.description}
                                  amountCents={expense.amountCents}
                                  category={cat}
                                  meta={`${displayName(names, expense.paidByUserId, me.id)} pagou · ${cat.label}`}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {expensePage.hasMore ? (
                <p className="text-center text-sm text-kotta-muted">
                  Mostrando as {expensePage.items.length} despesas mais recentes.
                </p>
              ) : null}
            </div>
          )}
        </section>

        <aside
          aria-label="Saldos do grupo"
          className={`flex flex-col gap-8 lg:sticky lg:top-10 lg:self-start ${
            tab === "saldos" ? "" : "hidden lg:flex"
          }`}
        >
          <GardenField>
            <h2 id="seu-saldo" className="text-[13px] font-semibold text-kotta-on-field-muted">
              Seu saldo no grupo · {myNet > 0 ? "a receber" : myNet < 0 ? "a pagar" : "quite"}
            </h2>
            <Price
              cents={myNet}
              size={44}
              className={myNet < 0 ? "text-kotta-on-field-owes" : "text-white"}
            />
          </GardenField>

          <section aria-labelledby="acertos">
            <SectionLabel id="acertos">Para acertar</SectionLabel>
            {open.length === 0 ? (
              <p className="rounded-card border border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
                Todos estão quites neste grupo.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {open.map((settlement) => {
                  const involvesMe = settlement.from === me.id || settlement.to === me.id;
                  return (
                    <li
                      key={settlement.id}
                      className={`rounded-card border bg-kotta-surface p-4 ${
                        involvesMe ? "border-kotta-accent" : "border-kotta-border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar
                          person={{ id: settlement.from, name: names.get(settlement.from) ?? "?" }}
                          size="sm"
                        />
                        <ArrowRightIcon className="size-4 text-kotta-muted" />
                        <Avatar
                          person={{ id: settlement.to, name: names.get(settlement.to) ?? "?" }}
                          size="sm"
                        />
                        <Price cents={settlement.amountCents} size={18} className="ml-auto text-kotta-text" />
                      </div>
                      <p className="mt-2 text-sm text-kotta-text">
                        <span className="font-semibold">{displayName(names, settlement.from, me.id)}</span>{" "}
                        paga{" "}
                        <span className="font-semibold">
                          {displayName(names, settlement.to, me.id, { object: true })}
                        </span>
                      </p>
                      {involvesMe ? (
                        <form action={markSettlementPaidAction} className="mt-3">
                          <input type="hidden" name="settlementId" value={settlement.id} />
                          <button
                            type="submit"
                            className="text-sm font-semibold text-kotta-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
                          >
                            Marcar como pago
                          </button>
                        </form>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {done.length > 0 ? (
            <section aria-labelledby="quitados">
              <SectionLabel id="quitados">Já acertados</SectionLabel>
              <ul className="divide-y divide-kotta-border rounded-card border border-kotta-border bg-kotta-surface">
                {done.map((settlement) => (
                  <li key={settlement.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="min-w-0 flex-1 truncate text-kotta-text">
                      {displayName(names, settlement.from, me.id)} pagou{" "}
                      {displayName(names, settlement.to, me.id, { object: true })}
                    </span>
                    <Price cents={settlement.amountCents} size={15} settled />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="membros">
            <SectionLabel id="membros">Membros</SectionLabel>
            <ul className="divide-y divide-kotta-border rounded-card border border-kotta-border bg-kotta-surface">
              {group.members.map((member) => {
                const value = netFor(group.balances, member.id);
                return (
                  <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar person={member} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-kotta-text">
                      {member.id === me.id ? `${member.name} (você)` : member.name}
                      {member.role === "owner" ? (
                        <span className="ml-2 text-xs text-kotta-muted">dono</span>
                      ) : member.role === "admin" ? (
                        <span className="ml-2 text-xs text-kotta-muted">admin</span>
                      ) : null}
                    </span>
                    {value === 0 ? (
                      <span className="text-[13px] font-semibold text-kotta-muted">quite</span>
                    ) : (
                      <Price
                        cents={value}
                        size={15}
                        sign={value > 0 ? "+" : "−"}
                        className={value > 0 ? "text-kotta-primary" : "text-kotta-danger"}
                      />
                    )}
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

function TabLink({ id, tab, current, children }: { id: string; tab: Tab; current: Tab; children: ReactNode }) {
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
