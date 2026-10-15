import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { SignedOutBroadcast } from "@/components/auth/signed-out-broadcast";
import { safeNextPath } from "@/lib/safe-next";
import { loginNotice } from "@/lib/session-flow";

export const metadata: Metadata = {
  title: "Entrar — Kotta Groups",
};

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const { next, motivo, email } = await searchParams;
  const defaultEmail = Array.isArray(email) ? email[0] : email;
  const nextPath = safeNextPath(Array.isArray(next) ? next[0] : next);
  const motivoValue = Array.isArray(motivo) ? motivo[0] : motivo;
  const notice = loginNotice(motivoValue);

  return (
    <>
      {/* Chegou aqui deslogado: as outras abas também saem. "envio" é sessão expirada num envio. */}
      {motivoValue === "saiu" ? <SignedOutBroadcast motivo="saiu" /> : null}
      {motivoValue === "expirada" || motivoValue === "envio" ? <SignedOutBroadcast motivo="expirada" /> : null}
      <h1 className="text-[34px] font-bold leading-tight tracking-tight text-kotta-text">
        Entrar
      </h1>
      <p className="mt-3 mb-8 text-base text-kotta-muted">
        Entre para ver seus grupos e despesas.
      </p>
      <LoginForm next={nextPath} notice={notice} defaultEmail={defaultEmail} />
    </>
  );
}
