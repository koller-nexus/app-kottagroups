import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { unarchiveGroupAction } from "@/app/actions/groups";
import { AvatarStack } from "@/components/app/avatar";
import { PlusIcon } from "@/components/app/icons";
import { Page } from "@/components/app/page-header";
import { BalanceChip } from "@/components/app/balance-chip";
import { getGroup, getMe, listExpensesPage, listGroupDetails, listGroups } from "@/lib/api/kotta";
import { formatShortDate } from "@/lib/dates";
import { localDay, netFor } from "@/lib/kotta-view";
import { canManageGroup } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Grupos — Kotta Groups",
};

/** Minúsculas e sem acento, para a busca por nome. */
const fold = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");

export default async function GruposPage({ searchParams }: PageProps<"/grupos">) {
  const { arquivados, q } = await searchParams;
  const archived = arquivados === "1";
  const query = typeof q === "string" ? q.trim() : "";

  const [me, all] = await Promise.all([
    getMe(),
    archived
      ? listGroups(true).then((list) => Promise.all(list.map((g) => getGroup(g.id))))
      : listGroupDetails(),
  ]);
  const groups = query ? all.filter((g) => fold(g.name).includes(fold(query))) : all;
  const lastExpenses = await Promise.all(groups.map((g) => listExpensesPage(g.id, 1)));

  const empty = query
    ? `Nenhum grupo com “${query}” no nome.`
    : archived
      ? "Você não tem grupos arquivados."
      : "Você ainda não participa de nenhum grupo. Crie um para começar a dividir gastos.";

  return (
    <Page
      title="Grupos"
      description={
        archived
          ? all.length === 1
            ? "1 grupo arquivado"
            : `${all.length} grupos arquivados`
          : all.length === 1
            ? "1 grupo com você"
            : `${all.length} grupos com você`
      }
      actions={
        <Link href="/grupos/novo" className="primary-action">
          <PlusIcon className="size-5" />
          Novo grupo
        </Link>
      }
    >
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            role="tablist"
            aria-label="Situação dos grupos"
            className="grid grid-cols-2 rounded-control border border-kotta-border bg-kotta-surface p-1 sm:w-72"
          >
            <ToggleLink href="/grupos" active={!archived}>
              Ativos
            </ToggleLink>
            <ToggleLink href="/grupos?arquivados=1" active={archived}>
              Arquivados
            </ToggleLink>
          </div>
          <form action="/grupos" role="search" className="flex flex-1 gap-2 sm:max-w-md">
            {archived ? <input type="hidden" name="arquivados" value="1" /> : null}
            <label htmlFor="q" className="sr-only">
              Buscar grupo pelo nome
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Buscar pelo nome"
              className="block min-h-12 w-full rounded-control border border-kotta-border bg-kotta-surface px-4 text-base text-kotta-text outline-none placeholder:text-kotta-muted focus:border-kotta-primary focus:ring-2 focus:ring-kotta-primary/20"
            />
            <button type="submit" className="secondary-action">
              Buscar
            </button>
          </form>
        </div>

        {groups.length === 0 ? (
          <p className="mt-6 rounded-card border border-dashed border-kotta-border bg-kotta-surface p-10 text-center text-sm text-kotta-muted">
            {empty}
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6 xl:grid-cols-3">
            {groups.map((group, index) => {
              const last = lastExpenses[index].items[0];
              const role = group.members.find((m) => m.id === me.id)?.role;
              return (
                <li key={group.id} className="flex flex-col gap-2">
                  <Link
                    href={`/grupos/${group.id}`}
                    className="flex flex-1 flex-col gap-6 rounded-card border border-kotta-border bg-kotta-surface p-6 transition-colors hover:border-kotta-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
                  >
                    <div className="flex items-start gap-4">
                      <span
                        aria-hidden="true"
                        className="flex size-14 shrink-0 items-center justify-center rounded-control bg-kotta-light-green text-3xl"
                      >
                        {group.emoji}
                      </span>
                      <div className="min-w-0 flex-1 pt-1">
                        <p className="truncate text-lg font-semibold text-kotta-text">{group.name}</p>
                        <p className="mt-1 text-[13px] text-kotta-muted">
                          {group.members.length} {group.members.length === 1 ? "pessoa" : "pessoas"}
                        </p>
                      </div>
                      <BalanceChip netCents={netFor(group.balances, me.id)} />
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-4 border-t border-kotta-border pt-5">
                      <p className="text-xs text-kotta-muted">
                        {last
                          ? `Última despesa em ${formatShortDate(localDay(last.createdAt))}`
                          : "Nenhuma despesa ainda"}
                      </p>
                      <AvatarStack people={group.members} />
                    </div>
                  </Link>
                  {group.archived && canManageGroup(role) ? (
                    <form action={unarchiveGroupAction}>
                      <input type="hidden" name="groupId" value={group.id} />
                      <button
                        type="submit"
                        aria-label={`Restaurar ${group.name}`}
                        className="secondary-action w-full"
                      >
                        Restaurar
                      </button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Page>
  );
}

function ToggleLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      replace
      className={`flex min-h-11 items-center justify-center rounded-[9px] text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary ${
        active ? "bg-kotta-primary text-white" : "text-kotta-muted"
      }`}
    >
      {children}
    </Link>
  );
}
