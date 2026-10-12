import type { InputHTMLAttributes, Ref } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Field({ id, label, hint, className = "", ...input }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-kotta-text">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hintId}
        className="mt-2 block min-h-12 w-full rounded-control border border-kotta-border bg-kotta-surface px-4 text-base text-kotta-text outline-none transition-colors placeholder:text-kotta-muted focus:border-kotta-primary focus:ring-2 focus:ring-kotta-primary/20"
        {...input}
      />
      {hint ? (
        <p id={hintId} className="mt-1.5 text-[13px] text-kotta-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-control border border-kotta-danger/30 bg-kotta-danger-bg px-4 py-3 text-sm text-kotta-danger"
    >
      {message}
    </p>
  );
}
