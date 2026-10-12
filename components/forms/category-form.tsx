"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveCategoryAction } from "@/app/actions/categories";
import { Field, FormError } from "@/components/auth/field";
import type { FormState } from "@/lib/form";

// Mesma grade do app (CategoryEditViewModel).
const EMOJIS = ["🍽️", "🚗", "🏠", "🎉", "🛒", "📦", "💊", "🐾", "🎓", "💼", "🎁", "🏋️"];

interface CategoryFormProps {
  category?: { id: string; label: string; emoji: string };
}

export function CategoryForm({ category }: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(saveCategoryAction, {
    values: { label: category?.label ?? "", emoji: category?.emoji ?? "📦" },
  } satisfies FormState);
  const [emoji, setEmoji] = useState(state.values?.emoji ?? "📦");

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormError message={state.error} />
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <Field
        id="label"
        name="label"
        label="Nome"
        placeholder="Ex.: Saúde"
        maxLength={64}
        required
        defaultValue={state.values?.label}
      />
      <fieldset>
        <legend className="text-sm font-semibold text-kotta-text">Emoji</legend>
        <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-12">
          {EMOJIS.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`Usar ${option}`}
              aria-pressed={emoji === option}
              onClick={() => setEmoji(option)}
              className={`flex aspect-square min-h-11 items-center justify-center rounded-control border text-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary ${
                emoji === option
                  ? "border-kotta-primary bg-kotta-light-green"
                  : "border-kotta-border bg-kotta-surface hover:bg-kotta-overlay"
              }`}
            >
              <span aria-hidden="true">{option}</span>
            </button>
          ))}
        </div>
        <Field
          id="emoji"
          name="emoji"
          label="Ou digite outro emoji"
          className="mt-4 max-w-40"
          maxLength={16}
          required
          value={emoji}
          onChange={(event) => setEmoji(event.target.value)}
        />
      </fieldset>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/perfil/categorias" className="secondary-action">
          Cancelar
        </Link>
        <button type="submit" className="primary-action" disabled={pending}>
          {pending ? "Salvando…" : "Salvar categoria"}
        </button>
      </div>
    </form>
  );
}
