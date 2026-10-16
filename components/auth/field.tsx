import type { InputHTMLAttributes, ReactNode, Ref } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  ref?: Ref<HTMLInputElement>;
  /** Controle ao lado do campo (ex.: mostrar senha). */
  addon?: ReactNode;
}

export function Field({ id, label, hint, error, addon, className = "", ...input }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-kotta-text">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={`block min-h-12 w-full rounded-control border bg-kotta-surface px-4 text-base text-kotta-text outline-none transition-colors placeholder:text-kotta-muted focus:border-kotta-primary focus:ring-2 focus:ring-kotta-primary/20 ${
            error ? "border-kotta-danger" : "border-kotta-border"
          } ${addon ? "pr-24" : ""}`}
          {...input}
        />
        {addon ? <div className="absolute inset-y-0 right-1 flex items-center">{addon}</div> : null}
      </div>
      {hint ? (
        <div id={hintId} className="mt-1.5 text-[13px] text-kotta-muted">
          {hint}
        </div>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-[13px] text-kotta-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormError({ message, ref }: { message?: string; ref?: Ref<HTMLParagraphElement> }) {
  if (!message) return null;
  return (
    <p
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-control border border-kotta-danger/30 bg-kotta-danger-bg px-4 py-3 text-sm text-kotta-danger outline-none"
    >
      {message}
    </p>
  );
}
