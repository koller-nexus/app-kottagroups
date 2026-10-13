"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ApiInvoiceStatus } from "@/lib/api/types";
import { isInvoicePending } from "@/lib/invoices";
import { nextPollDelay, RECEIPT_POLL_TIMEOUT_MS } from "@/lib/receipt";

const MESSAGES: Partial<Record<ApiInvoiceStatus, string>> = {
  queued: "Lendo sua nota…",
  processing: "Lendo sua nota…",
  needs_review: "Confira alguns itens",
};

/**
 * Mostra o andamento da nota e, enquanto ela é lida, recarrega os dados do servidor
 * com intervalo crescente; quando a leitura termina, a lista volta já pintada.
 */
export function ReceiptStatus({ status }: { status: ApiInvoiceStatus }) {
  const router = useRouter();
  const pending = isInvoicePending(status);
  // Cada "Verificar de novo" começa uma nova rodada de consultas.
  const [round, setRound] = useState(0);
  const [timedOutRound, setTimedOutRound] = useState<number | null>(null);
  const timedOut = pending && timedOutRound === round;

  useEffect(() => {
    if (!pending) return;
    const startedAt = Date.now();
    let attempt = 0;
    let timer: number | undefined;
    function schedule() {
      timer = window.setTimeout(() => {
        if (Date.now() - startedAt >= RECEIPT_POLL_TIMEOUT_MS) {
          setTimedOutRound(round);
          return;
        }
        router.refresh();
        attempt += 1;
        schedule();
      }, nextPollDelay(attempt));
    }
    schedule();
    return () => window.clearTimeout(timer);
  }, [pending, round, router]);

  const message = timedOut ? "Ainda estamos lendo sua nota." : MESSAGES[status];
  if (!message) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-kotta-border bg-kotta-surface p-4">
      <p role="status" className="flex items-center gap-2 text-sm font-semibold text-kotta-text">
        {pending && !timedOut ? (
          <span aria-hidden="true" className="size-2.5 rounded-pill bg-kotta-primary motion-safe:animate-pulse" />
        ) : null}
        {message}
      </p>
      {timedOut ? (
        <button
          type="button"
          className="secondary-action"
          onClick={() => {
            router.refresh();
            setRound((current) => current + 1);
          }}
        >
          Verificar de novo
        </button>
      ) : null}
    </div>
  );
}
