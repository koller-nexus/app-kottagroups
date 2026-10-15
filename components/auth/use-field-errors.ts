"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { firstErrorField, hasErrors, type FieldErrors } from "@/lib/auth-validation";

interface ServerState {
  error?: string;
  fieldErrors?: FieldErrors;
}

/**
 * Erros por campo de um formulário com Server Action: valida no envio (bloqueando-o se houver
 * erro), assume os erros devolvidos pelo servidor, apaga o erro do campo que a pessoa edita e
 * leva o foco ao primeiro erro.
 */
export function useFieldErrors<S extends ServerState>(state: S, validate: (form: HTMLFormElement) => FieldErrors) {
  const formRef = useRef<HTMLFormElement>(null);
  const formErrorRef = useRef<HTMLParagraphElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [seenState, setSeenState] = useState(state);

  // Nova resposta do servidor: os erros dela substituem os locais.
  if (state !== seenState) {
    setSeenState(state);
    setErrors(state.fieldErrors ?? {});
  }

  useEffect(() => {
    if (hasErrors(state.fieldErrors)) focusField(formRef.current, firstErrorField(state.fieldErrors));
    else if (state.error) formErrorRef.current?.focus();
  }, [state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const found = validate(event.currentTarget);
    if (!hasErrors(found)) return;
    event.preventDefault();
    setErrors(found);
    focusField(event.currentTarget, firstErrorField(found));
  }

  function onChange(event: FormEvent<HTMLFormElement>) {
    const name = (event.target as HTMLInputElement).name as keyof FieldErrors;
    if (!errors[name]) return;
    setErrors((current) => {
      const rest = { ...current };
      delete rest[name];
      return rest;
    });
  }

  return { formRef, formErrorRef, errors, onSubmit, onChange };
}

function focusField(form: HTMLFormElement | null, name: string | undefined) {
  if (!form || !name) return;
  const field = form.elements.namedItem(name);
  if (field instanceof HTMLElement) field.focus();
}

export function formText(form: HTMLFormElement, name: string): string {
  const value = new FormData(form).get(name);
  return typeof value === "string" ? value : "";
}
