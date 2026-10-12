import { Price } from "@/components/app/price";

export function BalanceChip({ netCents }: { netCents: number }) {
  if (netCents === 0) {
    return (
      <span className="inline-flex shrink-0 flex-col items-end rounded-control bg-kotta-bg px-2.5 py-1.5 text-[11px] font-semibold text-kotta-muted">
        Quite
      </span>
    );
  }
  const receives = netCents > 0;
  return (
    <span
      className={`inline-flex shrink-0 flex-col items-end rounded-control px-2.5 py-1.5 ${
        receives ? "bg-kotta-success-bg text-kotta-primary" : "bg-kotta-danger-bg text-kotta-danger"
      }`}
    >
      <span className="text-[11px] font-semibold leading-tight">{receives ? "recebe" : "deve"}</span>
      <Price cents={netCents} size={15} />
    </span>
  );
}
