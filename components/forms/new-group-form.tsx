"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createGroupAction, type FormState } from "@/app/actions/kotta";
import { Field, FormError } from "@/components/auth/field";

const EMOJIS = ["🏠", "🏖️", "🍖", "✈️", "🎉", "🛒", "🚗", "⚽", "🎓", "💼", "🍕", "👥"];
const initialState: FormState = {};

export function NewGroupForm() {
  const [state, formAction, pending] = useActionState(createGroupAction, initialState);
  const [emoji, setEmoji] = useState(state.values?.emoji ?? EMOJIS[0]);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormError message={state.error} />
      <Field
        id="name"
        name="name"
        label="Nome do grupo"
        placeholder="Ex.: Apartamento, Viagem pra Praia"
        maxLength={80}
        required
        defaultValue={state.values?.name}
      />
      <fieldset>
        <legend className="text-sm font-semibold text-kotta-text">Ícone</legend>
        <input type="hidden" name="emoji" value={emoji} />
        <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-12">
          {EMOJIS.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`Usar ${option}`}
              aria-pressed={emoji === option}
              onClick={() => setEmoji(option)}
              className={`flex aspect-square items-center justify-center rounded-control border text-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary ${
                emoji === option
                  ? "border-kotta-primary bg-kotta-light-green"
                  : "border-kotta-border bg-kotta-surface hover:bg-kotta-overlay"
              }`}
            >
              <span aria-hidden="true">{option}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/grupos" className="secondary-action">
          Cancelar
        </Link>
        <button type="submit" className="primary-action" disabled={pending}>
          {pending ? "Criando…" : "Criar grupo"}
        </button>
      </div>
    </form>
  );
}
