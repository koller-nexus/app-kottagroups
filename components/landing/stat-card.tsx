interface StatCardProps {
  label: string;
  value: string;
  caption: string;
  valueClassName?: string;
}

export function StatCard({ label, value, caption, valueClassName }: StatCardProps) {
  return (
    <article className="flex min-h-[132px] min-w-0 flex-col gap-2 rounded-card border border-kotta-border bg-kotta-surface p-5 sm:p-6">
      <p className="font-mono text-[11px] font-medium tracking-wide text-kotta-muted">
        {label}
      </p>
      <p
        className={`font-mono text-[22px] font-medium text-kotta-text ${valueClassName ?? ""}`}
      >
        {value}
      </p>
      <p className="text-xs text-kotta-muted">{caption}</p>
    </article>
  );
}
