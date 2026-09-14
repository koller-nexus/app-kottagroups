import { formatBRL } from "@/lib/money";
import type { MonthSpend } from "@/lib/demo-landing";

interface MonthSpendBlockProps {
  monthSpend: MonthSpend;
}

export function MonthSpendBlock({ monthSpend }: MonthSpendBlockProps) {
  const max = Math.max(
    monthSpend.previousMonthCents,
    monthSpend.currentMonthCents,
    1,
  );
  const previousWidth = (monthSpend.previousMonthCents / max) * 100;
  const currentWidth = (monthSpend.currentMonthCents / max) * 100;

  return (
    <section className="mt-8 flex flex-col gap-5 rounded-card border border-kotta-border bg-kotta-surface p-6 sm:mt-10 sm:p-8">
      <h2 className="font-mono text-xs font-medium tracking-widest text-kotta-muted">
        GASTOS DOS GRUPOS
      </h2>
      <div className="flex gap-6">
        <MonthBar
          amount={monthSpend.previousMonthCents}
          widthPercent={previousWidth}
          caption="mês passado"
          fillClassName="bg-kotta-muted"
        />
        <MonthBar
          amount={monthSpend.currentMonthCents}
          widthPercent={currentWidth}
          caption="este mês"
          fillClassName="bg-kotta-primary"
        />
      </div>
    </section>
  );
}

function MonthBar({
  amount,
  widthPercent,
  caption,
  fillClassName,
}: {
  amount: number;
  widthPercent: number;
  caption: string;
  fillClassName: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <p className="font-mono text-sm font-medium text-kotta-text">{formatBRL(amount)}</p>
      <div className="h-2 overflow-hidden rounded-pill bg-kotta-neutral-bg">
        <div
          className={`h-full rounded-pill ${fillClassName}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <p className="font-mono text-[10px] text-kotta-muted">{caption}</p>
    </div>
  );
}
