"use client";

import { catchError, type ErrorInfo } from "next/error";

/** Erro de uma seção da página: só ela mostra o aviso e tenta de novo; o resto continua. */
function SectionError({ message }: { message: string }, { retry }: ErrorInfo) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-card border border-kotta-border bg-kotta-surface p-6">
      <p className="text-sm text-kotta-text">{message}</p>
      <button type="button" onClick={() => retry()} className="secondary-action">
        Tentar de novo
      </button>
    </div>
  );
}

export const SectionBoundary = catchError(SectionError);
