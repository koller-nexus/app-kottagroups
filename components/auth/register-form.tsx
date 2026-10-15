"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerAction, type AuthFormState } from "@/app/actions/auth";
import { Field, FormError } from "@/components/auth/field";
import { PasswordField } from "@/components/auth/password-field";
import { formText, useFieldErrors } from "@/components/auth/use-field-errors";
import { isPasswordLengthOk, validateRegistration } from "@/lib/auth-validation";

const initialState: AuthFormState = {};

const LINK_CLASS = "font-semibold text-kotta-primary underline underline-offset-2";

function validate(form: HTMLFormElement) {
  return validateRegistration({
    name: formText(form, "name"),
    email: formText(form, "email"),
    password: formText(form, "password"),
    pixKey: formText(form, "pixKey"),
    acceptTerms: new FormData(form).get("acceptTerms") === "on",
  });
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const { formRef, formErrorRef, errors, onSubmit, onChange } = useFieldErrors(state, validate);
  const [password, setPassword] = useState("");
  const [seenState, setSeenState] = useState(state);
  // O formulário é limpo após cada envio; o indicador de senha acompanha.
  if (state !== seenState) {
    setSeenState(state);
    setPassword("");
  }
  const passwordOk = isPasswordLengthOk(password);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      onChange={onChange}
      className="flex flex-col gap-5"
      noValidate
    >
      <FormError ref={formErrorRef} message={state.error} />
      <Field
        id="name"
        name="name"
        label="Nome"
        autoComplete="name"
        required
        defaultValue={state.fields?.name}
        error={errors.name}
      />
      <Field
        id="email"
        name="email"
        type="email"
        label="E-mail"
        autoComplete="email"
        required
        defaultValue={state.fields?.email}
        error={errors.email}
      />
      <PasswordField
        id="password"
        name="password"
        label="Senha"
        autoComplete="new-password"
        required
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
        hint={
          <span className={passwordOk ? "text-kotta-primary" : undefined}>
            <span aria-hidden="true">{passwordOk ? "✓ " : ""}</span>
            De 8 a 72 caracteres
            {passwordOk ? <span className="sr-only"> (atendido)</span> : null}
          </span>
        }
      />
      <Field
        id="pixKey"
        name="pixKey"
        label="Chave Pix (opcional)"
        hint="Os membros dos seus grupos usam esta chave para te pagar."
        defaultValue={state.fields?.pixKey}
        error={errors.pixKey}
      />
      <div>
        <label htmlFor="acceptTerms" className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-kotta-text">
          <input
            id="acceptTerms"
            name="acceptTerms"
            type="checkbox"
            defaultChecked={state.fields?.acceptTerms ?? false}
            aria-invalid={errors.acceptTerms ? true : undefined}
            aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined}
            className="mt-0.5 size-5 shrink-0 accent-kotta-primary"
          />
          <span>
            Li e aceito os{" "}
            <Link href="/termos" target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
              Política de Privacidade
            </Link>
          </span>
        </label>
        {errors.acceptTerms ? (
          <p id="acceptTerms-error" className="mt-1.5 text-[13px] text-kotta-danger">
            {errors.acceptTerms}
          </p>
        ) : null}
      </div>
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
