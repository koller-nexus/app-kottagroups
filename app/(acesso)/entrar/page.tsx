import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/safe-next";

export const metadata: Metadata = {
  title: "Entrar — Kotta Groups",
};

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const { next, motivo } = await searchParams;
  const nextPath = safeNextPath(Array.isArray(next) ? next[0] : next);
  const notice =
    motivo === "expirada" ? "Sua sessão expirou. Entre de novo para continuar." : undefined;

  return (
    <>
      <h1 className="text-[34px] font-bold leading-tight tracking-tight text-kotta-text">
        Entrar
      </h1>
      <p className="mt-3 mb-8 text-base text-kotta-muted">
        Use o mesmo e-mail e senha do app Kotta Groups.
      </p>
      <LoginForm next={nextPath} notice={notice} />
    </>
  );
}
