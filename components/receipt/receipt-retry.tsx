"use client";

import { useActionState } from "react";
import { retryReceiptAction } from "@/app/actions/shopping";
import { FormError } from "@/components/auth/field";
import type { FormState } from "@/lib/form";
import { retriesLeftLabel } from "@/lib/receipt";

const initialState: FormState = {};

/** Pede nova leitura da mesma nota; depois do aceite a página mostra "na fila" e o acompanhamento segue. */
export function ReceiptRetry({ listId, remaining }: { listId: string; remaining: number }) {
  const [state, formAction, pending] = useActionState(retryReceiptAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-kotta-border bg-kotta-surface p-4"
    >
      <input type="hidden" name="listId" value={listId} />
      <p className="text-sm text-kotta-muted">{retriesLeftLabel(remaining)}</p>
      <button type="submit" className="primary-action" disabled={pending}>
        Tentar de novo
      </button>
      <div className="w-full">
        <FormError message={state.error} />
      </div>
    </form>
  );
}
