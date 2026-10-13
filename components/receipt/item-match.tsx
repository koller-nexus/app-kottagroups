"use client";

import { useActionState } from "react";
import { decideMatchAction } from "@/app/actions/shopping";
import type { ApiReceiptItem } from "@/lib/api/types";
import type { FormState } from "@/lib/form";
import { invoiceLineLabel, type ItemMatchState } from "@/lib/receipt";

const initialState: FormState = {};
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary";

const LABELS: Record<Exclude<ItemMatchState, "none">, { word: string; tone: string; path: string }> = {
  found: { word: "Encontrado", tone: "text-kotta-primary", path: "M5 12.5l4.5 4.5L19 7.5" },
  review: {
    word: "Confere?",
    tone: "text-kotta-review",
    path: "M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14 M12 17.5v.01",
  },
  missing: { word: "Não encontrado", tone: "text-kotta-muted", path: "M7 12h10" },
};

/** Ícone + palavra + o que veio na nota: a cor da linha nunca é o único sinal. */
export function ItemMatchLine({ state, invoiceItem }: { state: ItemMatchState; invoiceItem?: ApiReceiptItem | null }) {
  if (state === "none") return null;
  const { word, tone, path } = LABELS[state];
  const showLine = state !== "missing" && invoiceItem;
  return (
    <p className={`flex min-w-0 items-center gap-1.5 text-[13px] ${tone}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden="true"
        className="size-4 shrink-0"
      >
        <path d={path} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="shrink-0 font-semibold">{word}</span>
      {showLine ? <span className="truncate text-kotta-muted">· {invoiceLineLabel(invoiceItem)}</span> : null}
    </p>
  );
}

/** Sim confirma, Não rejeita; um toque e a página revalida. */
export function MatchDecision({ matchId, itemName }: { matchId: string; itemName: string }) {
  const [state, formAction, pending] = useActionState(decideMatchAction, initialState);
  const button = `inline-flex min-h-11 min-w-11 items-center justify-center rounded-control px-3 text-sm font-semibold disabled:opacity-60 ${focus}`;
  return (
    <form action={formAction} className="mt-1 flex flex-col items-start gap-1">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="flex gap-2">
        <button
          type="submit"
          name="status"
          value="confirmed"
          disabled={pending}
          aria-label={`Sim, ${itemName} veio na nota`}
          className={`${button} border border-kotta-border bg-kotta-surface text-kotta-primary`}
        >
          Sim
        </button>
        <button
          type="submit"
          name="status"
          value="rejected"
          disabled={pending}
          aria-label={`Não, ${itemName} não veio na nota`}
          className={`${button} border border-kotta-review/40 text-kotta-review`}
        >
          Não
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="text-[13px] text-kotta-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
