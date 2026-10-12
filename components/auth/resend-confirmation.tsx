"use client";

import { useActionState } from "react";
import { resendConfirmationAction, type ResendState } from "@/app/actions/auth";

const initialState: ResendState = { status: "idle" };

export function ResendConfirmation() {
  const [state, formAction, pending] = useActionState(resendConfirmationAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <button type="submit" className="secondary-action w-full" disabled={pending}>
        {pending ? "Enviando…" : "Reenviar link de confirmação"}
      </button>
      <p
        aria-live="polite"
        className={`text-center text-sm ${state.status === "error" ? "text-kotta-danger" : "text-kotta-primary"}`}
      >
        {state.message}
      </p>
    </form>
  );
}
