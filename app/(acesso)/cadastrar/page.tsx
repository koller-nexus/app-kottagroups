import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { safeNextPath } from "@/lib/safe-next";

export const metadata: Metadata = {
  title: "Criar conta — Kotta Groups",
};

export default async function CadastrarPage({ searchParams }: PageProps<"/cadastrar">) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(Array.isArray(next) ? next[0] : next);
  return (
    <>
      <h1 className="text-[34px] font-bold leading-tight tracking-tight text-kotta-text">
        Criar conta
      </h1>
      <p className="mt-3 mb-8 text-base text-kotta-muted">
        Com a conta você divide gastos com seus grupos.
      </p>
      <RegisterForm next={nextPath} />
    </>
  );
}
