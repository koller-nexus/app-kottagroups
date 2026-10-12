import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { ResendConfirmation } from "@/components/auth/resend-confirmation";
import { getMe } from "@/lib/api/kotta";

export const metadata: Metadata = {
  title: "Confirme seu e-mail — Kotta Groups",
};

export default async function ConfirmeSeuEmailPage() {
  const me = await getMe();
  if (me.emailConfirmed) redirect("/painel");

  return (
    <>
      <h1 className="text-[34px] font-bold leading-tight tracking-tight text-kotta-text">
        Confirme seu e-mail
      </h1>
      <p className="mt-4 text-base leading-7 text-kotta-muted">
        Enviamos um link para <span className="font-semibold text-kotta-text">{me.email}</span>.
        Abra o link para liberar seus grupos e despesas.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/painel" className="primary-action w-full">
          Já confirmei
        </Link>
        <ResendConfirmation />
      </div>
      <form action={logoutAction} className="mt-4 text-center">
        <button type="submit" className="text-sm font-semibold text-kotta-muted hover:underline">
          Entrar com outra conta
        </button>
      </form>
    </>
  );
}
