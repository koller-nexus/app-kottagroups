"use client";

import { useState, type ReactNode } from "react";

export function CopyTextButton({
  text,
  label,
  copiedLabel = "Copiado",
  failedMessage,
}: {
  text: string;
  label: string;
  copiedLabel?: string;
  /** Troca o aviso padrão de falha, que repete o texto da chave. */
  failedMessage?: ReactNode;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <button type="button" onClick={copy} className="secondary-action">
        {label}
      </button>
      <p aria-live="polite" className="text-sm text-kotta-muted">
        {status === "copied" ? copiedLabel : null}
        {status === "failed" && failedMessage ? failedMessage : null}
        {status === "failed" && !failedMessage ? (
          <>
            Não deu para copiar. Sua chave: <span className="font-mono text-kotta-text">{text}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
