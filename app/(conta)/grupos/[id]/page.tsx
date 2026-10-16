import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { deleteGroupAction } from "@/app/actions/groups";
import { markSettlementPaidAction, undoSettlementPaidAction } from "@/app/actions/kotta";
import { FormError } from "@/components/auth/field";
import { Avatar, AvatarStack } from "@/components/app/avatar";
import { CategoryBars } from "@/components/app/category-bars";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { CopyTextButton } from "@/components/app/copy-text-button";
import { ExpenseRow } from "@/components/app/expense-row";
import { GardenField } from "@/components/app/garden-field";
import { GroupInvoicesCard } from "@/components/app/group-invoices-card";
import { GroupMenu } from "@/components/app/group-menu";
import { ShoppingListsCard } from "@/components/app/shopping-lists-card";
import { Price } from "@/components/app/price";
import { ArrowRightIcon, PlusIcon } from "@/components/app/icons";
import { Page, SectionLabel } from "@/components/app/page-header";
import {
  getGroup,
  getGroupBalances,
  getMe,
  listCategories,
  listExpensesPage,
  listSettlements,
} from "@/lib/api/kotta";
import { ApiError, friendlyMessage } from "@/lib/api/errors";
import { categoryLookup } from "@/lib/categories";
import { formatLongDay, formatMonthYear } from "@/lib/dates";
import { groupByMonthAndDay, netFor } from "@/lib/kotta-view";
import { canDeleteGroup, canSettle } from "@/lib/permissions";
import { displayName, peopleById } from "@/lib/people";

type Tab = "despesas" | "saldos";

const param = (value: string | string[] | undefined) => (typeof value === "string" && value ? value : undefined);

const settleButtonClass =
  "min-h-11 text-sm font-semibold text-kotta-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary";

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
  const query = await searchParams;
  const tab: Tab = query.aba === "saldos" ? "saldos" : "despesas";
  const categoria = param(query.categoria);
  const cursor = param(query.cursor);
  const erro = param(query.erro);

  const [me, group, recent, filtered, settlements, categories, groupBalances] = await Promise.all([
    getMe(),
    getGroup(id),
    listExpensesPage(id),
    categoria || cursor ? listExpensesPage(id, undefined, cursor, categoria) : null,
    listSettlements(id),
    listCategories(),
    // Saldos frescos de GET /groups/:id/balances; se falhar, fica o que veio no detalhe.
    getGroupBalances(id).catch((error) => {
      if (error instanceof ApiError) return null;
      throw error;
    }),
    // Qualquer chamada do grupo pode responder 404/403 primeiro; todas viram a 404 do app.
  ]).catch((error) => {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
    throw error;
  });
  const expensePage = filtered ?? recent;
  const balances = groupBalances ?? group.balances;

  const names = peopleById([group]);
  const category = categoryLookup(categories);
  const role = group.members.find((m) => m.id === me.id)?.role;
  const confirmingDelete = param(query.confirmar) === "excluir" && canDeleteGroup(role);

  // ponytail: "Por categoria" e os filtros saem das 100 despesas mais recentes,
  // não do histórico todo; um endpoint de totais resolveria se fizer falta.
  const totalsBySlug = new Map<string, number>();
  for (const expense of recent.items) {
    totalsBySlug.set(expense.category, (totalsBySlug.get(expense.category) ?? 0) + expense.amountCents);
  }
  const categoryTotals = [...totalsBySlug]
    .map(([slug, cents]) => ({ slug, cents }))
    .sort((a, b) => b.cents - a.cents);
  const chipSlugs = categoryTotals.map((t) => t.slug);
  if (categoria && !chipSlugs.includes(categoria)) chipSlugs.push(categoria);

  const listHref = (params: { categoria?: string; cursor?: string }) => {
    const search = new URLSearchParams();
    if (params.categoria) search.set("categoria", params.categoria);
    if (params.cursor) search.set("cursor", params.cursor);
    const qs = search.toString();
    return qs ? `/grupos/${group.id}?${qs}` : `/grupos/${group.id}`;
  };
  const myNet = netFor(balances, me.id);
  const open = settlements.filter((s) => !s.paid);
  const done = settlements.filter((s) => s.paid);
  const timeline = groupByMonthAndDay(expensePage.items);

  return (
    <Page
      back={{ href: "/grupos", label: "Grupos" }}
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
        <>
          {group.archived ? null : (
            <Link href={`/despesas/nova?grupo=${group.id}`} className="primary-action">
              <PlusIcon className="size-5" />
              Nova despesa
            </Link>
          )}
          <GroupMenu group={group} role={role} />
        </>
      }
    >
      {erro ? (
        <div>
          <FormError message={friendlyMessage(erro)} />
        </div>
      ) : null}

      {confirmingDelete ? (
        <ConfirmDelete
          title={`Excluir ${group.name}?`}
          action={deleteGroupAction}
          fields={{ groupId: group.id }}
          confirmLabel="Excluir grupo"
          cancelHref={`/grupos/${group.id}`}
        >
          O grupo, as despesas e os saldos somem para todos os membros. Não dá para desfazer.
        </ConfirmDelete>
      ) : null}

      <div
        role="tablist"
        aria-label="Seções do grupo"
        className="grid grid-cols-2 rounded-control border border-kotta-border bg-kotta-surface p-1 lg:hidden"
      >
        <TabLink id={group.id} tab="despesas" current={tab}>
          Despesas
        </TabLink>
        <TabLink id={group.id} tab="saldos" current={tab}>
          Saldos
        </TabLink>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <section
          aria-labelledby="despesas"
          className={tab === "despesas" ? "min-w-0" : "hidden min-w-0 lg:block"}
        >
          {categoryTotals.length > 0 ? (
            <div className="mb-8">
              <SectionLabel>Por categoria</SectionLabel>
              <CategoryBars totals={categoryTotals} category={category} />
            </div>
          ) : null}

          <div className="mb-8">
            <ShoppingListsCard groupId={group.id} archived={group.archived} />
          </div>

          <div className="mb-8">
            <GroupInvoicesCard groupId={group.id} archived={group.archived} />
          </div>

          <SectionLabel id="despesas">Despesas</SectionLabel>
          {chipSlugs.length > 1 || categoria ? (
            <nav aria-label="Filtrar por categoria" className="-mx-1 mb-5 overflow-x-auto px-1 py-1">
              <ul className="flex gap-2">
                {[undefined, ...chipSlugs].map((slug) => {
                  const active = slug === categoria;
                  const cat = slug ? category(slug) : null;
                  return (
                    <li key={slug ?? "todas"} className="shrink-0">
                      <Link
                        href={listHref({ categoria: slug })}
                        aria-current={active ? "page" : undefined}
                        scroll={false}
                        replace
                        className={`inline-flex min-h-11 items-center gap-1.5 rounded-control border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary ${
                          active
                            ? "border-kotta-primary bg-kotta-primary text-white"
                            : "border-kotta-border bg-kotta-surface text-kotta-text hover:bg-kotta-light-green"
                        }`}
                      >
                        {cat ? <span aria-hidden="true">{cat.emoji}</span> : null}
                        {cat ? cat.label : "Todas"}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
          {timeline.length === 0 ? (
            <div className="rounded-card border border-dashed border-kotta-border bg-kotta-surface p-8 text-center">
              {categoria ? (
                <>
                  <p className="font-semibold text-kotta-text">Sem despesas nessa categoria</p>
                  <p className="mt-1 text-sm text-kotta-muted">Escolha outra categoria para ver mais despesas.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-kotta-text">Nenhuma despesa ainda</p>
                  <p className="mt-1 text-sm text-kotta-muted">
                    Lance a primeira despesa para começar a dividir.
                  </p>
                </>
              )}
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
                                <Link
                                  href={`/despesas/${expense.id}`}
                                  className="block hover:bg-kotta-overlay focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-kotta-primary"
                                >
                                  <ExpenseRow
                                    description={expense.description}
                                    amountCents={expense.amountCents}
                                    category={cat}
                                    meta={`${displayName(names, expense.paidByUserId, me.id)} pagou · ${cat.label}`}
                                  />
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {expensePage.hasMore || cursor ? (
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  {cursor ? (
                    <Link href={listHref({ categoria })} className="secondary-action">
                      Voltar às mais recentes
                    </Link>
                  ) : null}
                  {expensePage.hasMore && expensePage.nextCursor ? (
                    <Link
                      href={listHref({ categoria, cursor: expensePage.nextCursor })}
                      className="secondary-action"
                    >
                      Carregar mais
                    </Link>
                  ) : null}
                </div>
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
                  const involvesMe = canSettle(me.id, settlement);
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
                        <form action={markSettlementPaidAction} className="mt-1">
                          <input type="hidden" name="settlementId" value={settlement.id} />
                          <button type="submit" className={settleButtonClass}>
                            Marcar como pago
                          </button>
                        </form>
                      ) : null}
                      {settlement.to === me.id && me.pixKey ? (
                        <div className="mt-2">
                          <CopyTextButton
                            text={me.pixKey}
                            label="Copiar minha chave Pix"
                            copiedLabel="Chave Pix copiada"
                          />
                        </div>
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
                    {canSettle(me.id, settlement) ? (
                      <form action={undoSettlementPaidAction}>
                        <input type="hidden" name="settlementId" value={settlement.id} />
                        <button type="submit" className={settleButtonClass}>
                          Desfazer
                        </button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="membros">
            <SectionLabel id="membros">Membros</SectionLabel>
            <ul className="divide-y divide-kotta-border rounded-card border border-kotta-border bg-kotta-surface">
              {group.members.map((member) => {
                const value = netFor(balances, member.id);
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
    </Page>
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
