import { formatBRL } from "@/lib/money";

interface BalanceChipProps {
  netCents: number;
}

export function BalanceChip({ netCents }: BalanceChipProps) {
  if (netCents === 0) {
    return (
      <span className="inline-flex shrink-0 items-center self-start rounded-pill border border-kotta-border bg-kotta-neutral-bg px-3 py-1.5 font-mono text-[13px] font-medium leading-none text-kotta-muted">
        Quite
      </span>
    );
  }

  const receives = netCents > 0;
  const amount = formatBRL(Math.abs(netCents));

  return (
    <span
      className={`inline-flex shrink-0 flex-col items-end justify-center gap-0.5 self-start rounded-pill border border-kotta-border px-3 py-1.5 font-mono text-[13px] font-medium leading-tight ${
        receives
          ? "bg-kotta-light-green text-kotta-primary"
          : "bg-kotta-danger-bg text-kotta-danger"
      }`}
    >
      <span className="leading-none">{receives ? "Recebe" : "Deve"}</span>
      <span className="whitespace-nowrap leading-none">
        {receives ? `+ ${amount}` : `− ${amount}`}
      </span>
    </span>
  );
}
