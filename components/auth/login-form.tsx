"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/app/actions/auth";
import { Field, FormError } from "@/components/auth/field";

const initialState: AuthFormState = {};

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {notice && !state.error ? (
        <p className="rounded-control bg-kotta-light-green px-4 py-3 text-sm text-kotta-primary">
          {notice}
        </p>
      ) : null}
      <FormError message={state.error} />
      <input type="hidden" name="next" value={next ?? ""} />
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
        autoComplete="current-password"
        required
      />
      <Link
        href="/esqueci-a-senha"
        className="-mt-2 inline-flex min-h-11 items-center self-end text-sm font-semibold text-kotta-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
      >
        Esqueci a senha
      </Link>
      <button type="submit" className="primary-action mt-2 w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-center text-sm text-kotta-muted">
        Ainda não tem conta?{" "}
        <Link href="/cadastrar" className="font-semibold text-kotta-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
