import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { ResendConfirmation } from "@/components/auth/resend-confirmation";
import { getMe } from "@/lib/api/kotta";

export const metadata: Metadata = {
  title: "Confirme seu e-mail — Kotta Groups",
};

export default async function ConfirmeSeuEmailPage() {
  const me = await getMe();
  if (me.emailConfirmed) redirect("/");

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
        <Link href="/" className="primary-action w-full">
          Já confirmei
        </Link>
        <ResendConfirmation />
      </div>
      <div className="mt-4 text-center">
        <LogoutButton
          label="Entrar com outra conta"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-kotta-muted hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary disabled:opacity-60"
        />
      </div>
    </>
  );
}
