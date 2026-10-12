"use client";

import { useActionState, useState } from "react";
import { deleteCategoryAction, type DeleteCategoryState } from "@/app/actions/categories";

interface DeleteCategoryButtonProps {
  id: string;
  label: string;
  /** Categorias que podem receber as despesas desta. */
  replacements: { id: string; label: string; emoji: string }[];
}

const initialState: DeleteCategoryState = {};

export function DeleteCategoryButton({ id, label, replacements }: DeleteCategoryButtonProps) {
  const [state, formAction, pending] = useActionState(deleteCategoryAction, initialState);
  // Cancelar esconde o seletor até a próxima resposta da API.
  const [dismissed, setDismissed] = useState<DeleteCategoryState | null>(null);
  const selectId = `replacement-${id}`;

  if (state.needsReplacement && dismissed !== state) {
    return (
      <form action={formAction} className="flex w-full flex-col gap-3 rounded-control bg-kotta-bg p-4">
        <input type="hidden" name="id" value={id} />
        <p role="alert" className="text-sm text-kotta-danger">
          {state.error}
        </p>
        <label htmlFor={selectId} className="text-sm font-semibold text-kotta-text">
          Mover as despesas de “{label}” para
        </label>
        <select
          id={selectId}
          name="replacementCategoryId"
          required
          className="min-h-12 rounded-control border border-kotta-border-strong bg-kotta-surface px-3 text-base text-kotta-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
        >
          {replacements.map((option) => (
            <option key={option.id} value={option.id}>
              {option.emoji} {option.label}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-kotta-danger px-5 font-semibold text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kotta-danger"
          >
            {pending ? "Excluindo…" : "Excluir e mover despesas"}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(state)}
            className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-kotta-text hover:bg-kotta-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Excluir “${label}”?`)) event.preventDefault();
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Excluir ${label}`}
        className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-kotta-danger hover:bg-kotta-danger-bg disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-danger"
      >
        {pending ? "Excluindo…" : "Excluir"}
      </button>
      {state.error ? (
        <p role="alert" className="text-[13px] text-kotta-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
