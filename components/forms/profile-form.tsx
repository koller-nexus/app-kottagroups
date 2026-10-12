"use client";

import { useActionState } from "react";
import { updateProfileAction, type FormState } from "@/app/actions/kotta";
import { Field, FormError } from "@/components/auth/field";

export function ProfileForm({ name, pixKey }: { name: string; pixKey: string }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, {
    values: { name, pixKey },
  } satisfies FormState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <FormError message={state.error} />
      <Field
        id="name"
        name="name"
        label="Nome"
        autoComplete="name"
        required
        defaultValue={state.values?.name}
      />
      <Field
        id="pixKey"
        name="pixKey"
        label="Chave Pix"
        hint="Os membros dos seus grupos usam esta chave para te pagar."
        defaultValue={state.values?.pixKey}
      />
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="primary-action" disabled={pending}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
        <p aria-live="polite" className="text-sm text-kotta-primary">
          {state.ok && !pending ? "Alterações salvas." : ""}
        </p>
      </div>
    </form>
  );
}
