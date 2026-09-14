import { formatBRL } from "@/lib/money";
import type { Settlement } from "@/lib/demo-landing";

interface SettlementRowProps {
  settlement: Settlement;
}

export function SettlementRow({ settlement }: SettlementRowProps) {
  const isPaid = settlement.status === "paid";
  const amount = (
    <span className="font-mono font-medium text-kotta-primary">
      {formatBRL(settlement.amountCents)}
    </span>
  );
  const name = <span className="font-bold">{settlement.counterpartName}</span>;

  return (
    <div className="flex h-full items-center justify-between gap-3 rounded-card border border-kotta-border bg-kotta-surface p-5 sm:p-6">
      <p className="flex-1 text-sm text-kotta-text">
        {settlement.direction === "receive" ? (
          <>
            {name} te paga {amount}
          </>
        ) : (
          <>
            Você paga {amount} pra {name}
          </>
        )}
      </p>
      <span
        className={`font-mono text-[11px] font-medium ${
          isPaid ? "text-kotta-primary" : "text-kotta-danger"
        }`}
      >
        {isPaid ? "pago" : "pendente"}
      </span>
    </div>
  );
}
