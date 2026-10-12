import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Esqueci a senha — Kotta Groups",
};

export default function EsqueciASenhaPage() {
  return (
    <>
      <h1 className="text-[34px] font-bold leading-tight tracking-tight text-kotta-text">
        Esqueci a senha
      </h1>
      <p className="mt-3 mb-8 text-base text-kotta-muted">
        Informe seu e-mail. Se existir uma conta, enviaremos as instruções para redefinir a senha.
      </p>
      <ForgotPasswordForm />
    </>
  );
}
