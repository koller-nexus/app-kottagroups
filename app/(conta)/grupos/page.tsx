import type { Metadata } from "next";
import Link from "next/link";
import { AvatarStack } from "@/components/app/avatar";
import { PlusIcon } from "@/components/app/icons";
import { PageHeader } from "@/components/app/page-header";
import { BalanceChip } from "@/components/landing/balance-chip";
import { getMe, listExpensesPage, listGroupDetails } from "@/lib/api/kotta";
import { formatShortDate } from "@/lib/dates";
import { localDay, netFor } from "@/lib/kotta-view";

export const metadata: Metadata = {
  title: "Grupos — Kotta Groups",
};

export default async function GruposPage() {
  const [me, groups] = await Promise.all([getMe(), listGroupDetails()]);
  const lastExpenses = await Promise.all(groups.map((g) => listExpensesPage(g.id, 1)));

  return (
    <>
      <PageHeader
        title="Grupos"
        description={
          groups.length === 1 ? "1 grupo com você" : `${groups.length} grupos com você`
        }
        actions={
          <Link href="/grupos/novo" className="primary-action">
            <PlusIcon className="size-5" />
            Novo grupo
          </Link>
        }
      />

      {groups.length === 0 ? (
        <p className="mt-8 rounded-card border border-dashed border-kotta-border bg-kotta-surface p-10 text-center text-sm text-kotta-muted">
          Você ainda não participa de nenhum grupo. Crie um para começar a dividir gastos.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6 xl:grid-cols-3">
          {groups.map((group, index) => {
            const last = lastExpenses[index].items[0];
            return (
              <li key={group.id}>
                <Link
                  href={`/grupos/${group.id}`}
                  className="flex h-full flex-col gap-6 rounded-card border border-kotta-border bg-kotta-surface p-6 transition-colors hover:border-kotta-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
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
                      <p className="mt-0.5 font-mono text-xs text-kotta-muted">
                        {group.members.length === 1 ? "1 membro" : `${group.members.length} membros`}
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
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
