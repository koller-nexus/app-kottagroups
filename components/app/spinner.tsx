/** Anel de progresso; o texto vai ao lado e quem usa coloca o `role="status"`. */
export function Spinner({ label, size = "md" }: { label?: string; size?: "sm" | "md" }) {
  const dimension = size === "sm" ? "size-3.5 border-2" : "size-5 border-[3px]";
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`${dimension} shrink-0 rounded-pill border-kotta-border border-t-kotta-primary motion-safe:animate-spin`}
      />
      {label}
    </span>
  );
}
