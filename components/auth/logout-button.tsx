"use client";

import { useFormStatus } from "react-dom";
import { logoutAction } from "@/app/actions/auth";

const DEFAULT_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center rounded-control border border-kotta-danger/40 px-5 font-semibold text-kotta-danger hover:bg-kotta-danger-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-danger disabled:opacity-60";

export function LogoutButton({
  label = "Sair",
  className = DEFAULT_CLASS,
  destination,
}: {
  label?: string;
  className?: string;
  /** Para onde ir depois de sair; o padrão é a tela de entrar. */
  destination?: "cadastrar";
}) {
  return (
    <form action={logoutAction}>
      {destination ? <input type="hidden" name="destino" value={destination} /> : null}
      <SubmitButton label={label} className={className} />
    </form>
  );
}

// useFormStatus só enxerga o formulário pai, por isso o botão é um componente à parte.
function SubmitButton({ label, className }: { label: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "Saindo…" : label}
    </button>
  );
}
