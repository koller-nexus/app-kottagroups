import type { ReactNode } from "react";
import type { CategoryView } from "@/lib/categories";
import { formatBRL } from "@/lib/money";

interface ExpenseRowProps {
  description: string;
  amountCents: number;
  category: CategoryView;
  meta: ReactNode;
}

export function ExpenseRow({ description, amountCents, category, meta }: ExpenseRowProps) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-control bg-kotta-light-green text-xl"
      >
        {category.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-kotta-text">{description}</p>
        <p className="mt-0.5 truncate text-[13px] text-kotta-muted">{meta}</p>
      </div>
      <p className="shrink-0 font-mono text-sm font-medium text-kotta-text">
        {formatBRL(amountCents)}
      </p>
    </div>
  );
}
