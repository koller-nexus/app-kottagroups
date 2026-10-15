"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { checkConfirmationAction, type ConfirmationCheckState } from "@/app/actions/auth";

const initialState: ConfirmationCheckState = {};

/** "Já confirmei", e revalidação ao voltar para a aba (a página segue sozinha se confirmou). */
export function ConfirmationCheck({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(checkConfirmationAction, initialState);
  const router = useRouter();

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <button type="submit" className="primary-action w-full" disabled={pending}>
        {pending ? "Verificando…" : "Já confirmei"}
      </button>
      {state.message ? (
        <p role="status" className="rounded-control bg-kotta-danger-bg px-4 py-3 text-sm text-kotta-danger">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
