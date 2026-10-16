import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConfirmationCheck } from "@/components/auth/confirmation-check";
import { LogoutButton } from "@/components/auth/logout-button";
import { ResendConfirmation } from "@/components/auth/resend-confirmation";
import { getMe } from "@/lib/api/kotta";
import { safeNextPath } from "@/lib/safe-next";

export const metadata: Metadata = {
  title: "Confirme seu e-mail — Kotta Groups",
};

const TEXT_LINK_CLASS =
  "inline-flex min-h-11 items-center text-sm font-semibold text-kotta-muted hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary disabled:opacity-60";

export default async function ConfirmeSeuEmailPage({ searchParams }: PageProps<"/confirme-seu-email">) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(Array.isArray(next) ? next[0] : next);
  const me = await getMe();
  if (me.emailConfirmed) redirect(nextPath);

  return (
    <>
      <h1 className="text-[34px] font-bold leading-tight tracking-tight text-kotta-text">
        Confirme seu e-mail
      </h1>
      <p className="mt-4 text-base leading-7 text-kotta-muted">
        Enviamos um link para <span className="font-semibold text-kotta-text">{me.email}</span>.
        Abra o link para liberar seus grupos e despesas.
      </p>
      <p className="mt-3 text-sm leading-6 text-kotta-muted">
        Não chegou? Confira a caixa de spam ou lixo eletrônico. O link vale 24 horas.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <ConfirmationCheck next={nextPath} />
        <ResendConfirmation />
      </div>
      <div className="mt-4 flex flex-col items-center gap-1 text-center">
        {/* div, não p: o LogoutButton é um <form>, que não pode ficar dentro de <p>. */}
        <div className="flex flex-wrap items-center justify-center gap-x-1 text-sm text-kotta-muted">
          Digitou o e-mail errado?
          <LogoutButton label="Corrigir e-mail" destination="cadastrar" className={TEXT_LINK_CLASS} />
        </div>
        <LogoutButton label="Entrar com outra conta" className={TEXT_LINK_CLASS} />
      </div>
    </>
  );
}
