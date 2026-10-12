import type { Metadata } from "next";
import Link from "next/link";
import { AvatarStack } from "@/components/app/avatar";
import { PlusIcon } from "@/components/app/icons";
import { PageHeader } from "@/components/app/page-header";
import { BalanceChip } from "@/components/landing/balance-chip";
import { getMember, groupSummaries } from "@/lib/demo-app";
import { formatShortDate } from "@/lib/dates";
import { formatBRL } from "@/lib/money";

export const metadata: Metadata = {
  title: "Grupos — Kotta Groups",
};

export default function GruposPage() {
  const summaries = groupSummaries();

  return (
    <>
      <PageHeader
        title="Grupos"
        description={`${summaries.length} grupos com você`}
        actions={
          // TODO: abrir o formulário de novo grupo.
          <button type="button" className="primary-action">
            <PlusIcon className="size-5" />
            Novo grupo
          </button>
        }
      />

      <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
        {summaries.map(({ group, netCents, totalCents, lastExpenseDate }) => (
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
                  <p className="truncate text-lg font-semibold text-kotta-text">
                    {group.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-kotta-muted">
                    {group.memberIds.length} membros
                  </p>
                </div>
                <BalanceChip netCents={netCents} />
              </div>

              <div className="mt-auto flex items-end justify-between gap-4 border-t border-kotta-border pt-5">
                <div>
                  <p className="font-mono text-[11px] text-kotta-muted">total gasto</p>
                  <p className="mt-0.5 font-mono text-base font-medium text-kotta-text">
                    {formatBRL(totalCents)}
                  </p>
                  {lastExpenseDate ? (
                    <p className="mt-1 text-xs text-kotta-muted">
                      Última despesa em {formatShortDate(lastExpenseDate)}
                    </p>
                  ) : null}
                </div>
                <AvatarStack members={group.memberIds.map(getMember)} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
