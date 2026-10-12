"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { Field, FormError } from "@/components/auth/field";
import type { FormState } from "@/lib/form";

const initialState: FormState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <FormError message={state.error} />
      {state.ok ? (
        <p role="status" className="rounded-control bg-kotta-light-green px-4 py-3 text-sm text-kotta-primary">
          Se existir uma conta com este e-mail, enviamos as instruções para redefinir a senha.
        </p>
      ) : null}
      <Field
        id="email"
        name="email"
        type="email"
        label="E-mail"
        autoComplete="email"
        placeholder="voce@exemplo.com"
        required
        defaultValue={state.values?.email}
      />
      <button type="submit" className="primary-action mt-2 w-full" disabled={pending}>
        {pending ? "Enviando…" : state.ok ? "Enviar de novo" : "Enviar e-mail"}
      </button>
      <p className="text-center text-sm">
        <Link href="/entrar" className="font-semibold text-kotta-primary hover:underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
