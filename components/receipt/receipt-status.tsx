"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/app/spinner";
import type { ApiInvoiceStatus } from "@/lib/api/types";
import { isInvoicePending } from "@/lib/invoices";
import {
  MATCHING_MESSAGE,
  nextPollDelay,
  READING_LEAVE_HINT,
  readingJustFinished,
  readingMessage,
  RECEIPT_POLL_TIMEOUT_MS,
} from "@/lib/receipt";

const READ_CONFIRMATION_MS = 4000;

/**
 * Mostra o andamento da nota e, enquanto ela é lida e cruzada com a lista, recarrega os dados
 * do servidor com intervalo crescente; quando termina, a lista volta já pintada e com os checks.
 */
export function ReceiptStatus({ status, awaitingMatches }: { status: ApiInvoiceStatus; awaitingMatches: boolean }) {
  const router = useRouter();
  const reading = isInvoicePending(status);
  const pending = reading || awaitingMatches;
  // Cada "Verificar de novo" começa uma nova rodada de consultas.
  const [round, setRound] = useState(0);
  const [timedOutRound, setTimedOutRound] = useState<number | null>(null);
  const timedOut = pending && timedOutRound === round;
  // "Nota lida" só aparece para quem viu a leitura em andamento terminar.
  const [seenPending, setSeenPending] = useState(pending);
  const [confirmationHidden, setConfirmationHidden] = useState(false);
  if (pending && !seenPending) setSeenPending(true);
  const justFinished = readingJustFinished(seenPending, status) && !awaitingMatches && !confirmationHidden;

  useEffect(() => {
    if (!justFinished) return;
    const timer = window.setTimeout(() => setConfirmationHidden(true), READ_CONFIRMATION_MS);
    return () => window.clearTimeout(timer);
  }, [justFinished]);

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

  // Se o cruzamento passar do limite, some em silêncio: a nota já foi lida.
  if (awaitingMatches && timedOut) return null;
  const message = justFinished
    ? "Nota lida"
    : awaitingMatches
      ? MATCHING_MESSAGE
      : (readingMessage(status, timedOut) ?? (status === "needs_review" ? "Confira alguns itens" : null));
  if (!message) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-kotta-border bg-kotta-surface p-4">
      <div role="status" className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-kotta-text">
          {pending && !timedOut ? <Spinner label={message} /> : message}
        </p>
        {pending && !timedOut ? <p className="text-[13px] text-kotta-muted">{READING_LEAVE_HINT}</p> : null}
      </div>
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
