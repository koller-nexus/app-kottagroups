import type { DemoGroup } from "@/lib/demo-landing";
import { BalanceChip } from "@/components/landing/balance-chip";

interface GroupRowProps {
  group: DemoGroup;
}

export function GroupRow({ group }: GroupRowProps) {
  const memberLabel =
    group.memberCount === 1
      ? "1 membro"
      : `${group.memberCount} membros`;

  return (
    <div className="flex h-full items-start gap-3 rounded-card border border-kotta-border bg-kotta-surface p-5 sm:gap-4 sm:p-6">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-control bg-kotta-light-green text-2xl">
        <span aria-hidden="true">{group.emoji}</span>
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="truncate text-base font-semibold leading-snug text-kotta-text">
          {group.name}
        </p>
        <p className="mt-0.5 font-mono text-xs text-kotta-muted">{memberLabel}</p>
      </div>
      <BalanceChip netCents={group.netCents} />
    </div>
  );
}
