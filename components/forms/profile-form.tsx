"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateProfileAction, type ProfileFormState } from "@/app/actions/kotta";
import { Field, FormError } from "@/components/auth/field";
import { isPixKeyChange } from "@/lib/profile-update";

/** `pixKey` é a chave salva: trocar, cadastrar ou apagar a chave pede a senha atual. */
export function ProfileForm({ name, pixKey }: { name: string; pixKey: string }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, {
    values: { name, pixKey },
  } satisfies ProfileFormState);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [typedPixKey, setTypedPixKey] = useState(state.values?.pixKey ?? pixKey);
  const [passwordError, setPasswordError] = useState(state.passwordError);
  const [seenState, setSeenState] = useState(state);

  // Nova resposta do servidor: o formulário volta com os valores e o erro dela.
  if (state !== seenState) {
    setSeenState(state);
    setTypedPixKey(state.values?.pixKey ?? pixKey);
    setPasswordError(state.passwordError);
  }

  useEffect(() => {
    if (state.passwordError) passwordRef.current?.focus();
  }, [state]);

  // Sem JavaScript, o campo só aparece quando o servidor pede a senha.
  const askPassword = isPixKeyChange(typedPixKey, pixKey) || Boolean(passwordError);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <FormError message={state.error} />
      <input type="hidden" name="savedPixKey" value={pixKey} />
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
        onChange={(event) => {
          setTypedPixKey(event.target.value);
          setPasswordError(undefined);
        }}
      />
      {askPassword ? (
        <Field
          ref={passwordRef}
          id="currentPassword"
          name="currentPassword"
          type="password"
          label="Senha atual"
          hint="Para trocar a chave Pix, confirme a senha da sua conta."
          autoComplete="current-password"
          error={passwordError}
        />
      ) : null}
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
