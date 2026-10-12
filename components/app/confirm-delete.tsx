import Link from "next/link";
import type { ReactNode } from "react";

interface ConfirmDeleteProps {
  title: string;
  children: ReactNode;
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  confirmLabel: string;
  cancelHref: string;
}

/** Passo de confirmação de exclusão, aberto por `?confirmar=excluir`. */
export function ConfirmDelete({ title, children, action, fields, confirmLabel, cancelHref }: ConfirmDeleteProps) {
  return (
    <section
      aria-labelledby="confirmar-exclusao"
      className="mt-8 rounded-card border border-kotta-danger/30 bg-kotta-danger-bg p-6"
    >
      <h2 id="confirmar-exclusao" className="text-lg font-bold text-kotta-danger">
        {title}
      </h2>
      <div className="mt-2 text-sm text-kotta-text">{children}</div>
      <form action={action} className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <Link href={cancelHref} replace className="secondary-action">
          Cancelar
        </Link>
        <button
          type="submit"
          className="inline-flex min-h-13 items-center justify-center rounded-control bg-kotta-danger px-6 font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kotta-danger"
        >
          {confirmLabel}
        </button>
      </form>
    </section>
  );
}
