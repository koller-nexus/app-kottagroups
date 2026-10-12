"use client";

import { useSearchParams } from "next/navigation";
import { SUBMIT_LOST_PARAM, SUBMIT_LOST_VALUE } from "@/lib/session-flow";

/** Aviso depois de entrar de novo quando a sessão expirou no meio de um envio. */
export function SubmitLostNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get(SUBMIT_LOST_PARAM) !== SUBMIT_LOST_VALUE) return null;

  return (
    <p
      role="status"
      className="mb-6 rounded-control border border-kotta-danger/30 bg-kotta-danger-bg px-4 py-3 text-sm text-kotta-danger"
    >
      A sessão expirou e o envio não foi salvo. Preencha de novo.
    </p>
  );
}
