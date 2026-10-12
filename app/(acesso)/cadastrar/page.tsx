import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Criar conta — Kotta Groups",
};

export default function CadastrarPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-semibold leading-tight text-kotta-secondary">
        Criar conta
      </h1>
      <p className="mt-3 mb-8 text-base text-kotta-muted">
        Com a conta você divide gastos com seus grupos no site e no app.
      </p>
      <RegisterForm />
    </>
  );
}
