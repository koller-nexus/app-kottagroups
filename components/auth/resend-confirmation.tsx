"use client";

import { useActionState, useEffect, useState } from "react";
import { resendConfirmationAction, type ResendState } from "@/app/actions/auth";

const initialState: ResendState = { status: "idle" };

export function ResendConfirmation() {
  const [state, formAction, pending] = useActionState(resendConfirmationAction, initialState);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    setSecondsLeft(state.retryAfter ?? 0);
  }

  const counting = secondsLeft > 0;
  useEffect(() => {
    if (!counting) return;
    const timer = setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [counting]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <button type="submit" className="secondary-action w-full" disabled={pending || counting}>
        {pending ? "Enviando…" : counting ? `Reenviar em ${secondsLeft} s` : "Reenviar link de confirmação"}
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
