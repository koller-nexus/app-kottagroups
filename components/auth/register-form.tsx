"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthFormState } from "@/app/actions/auth";
import { Field, FormError } from "@/components/auth/field";

const initialState: AuthFormState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <FormError message={state.error} />
      <Field
        id="name"
        name="name"
        label="Nome"
        autoComplete="name"
        required
        defaultValue={state.fields?.name}
      />
      <Field
        id="email"
        name="email"
        type="email"
        label="E-mail"
        autoComplete="email"
        required
        defaultValue={state.fields?.email}
      />
      <Field
        id="password"
        name="password"
        type="password"
        label="Senha"
        autoComplete="new-password"
        hint="De 8 a 72 caracteres."
        minLength={8}
        maxLength={72}
        required
      />
      <Field
        id="pixKey"
        name="pixKey"
        label="Chave Pix (opcional)"
        hint="Os membros dos seus grupos usam esta chave para te pagar."
        defaultValue={state.fields?.pixKey}
      />
      <button type="submit" className="primary-action mt-2 w-full" disabled={pending}>
        {pending ? "Criando conta…" : "Criar conta"}
      </button>
      <p className="text-center text-sm text-kotta-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-kotta-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
