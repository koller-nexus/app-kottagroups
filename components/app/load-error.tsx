"use client";

import { useEffect, useSyncExternalStore } from "react";
import { loadErrorKind } from "@/lib/load-error";

const copy = {
  offline: { title: "Você está sem conexão", text: "Verifique sua internet e tente de novo." },
  unavailable: {
    title: "O Kotta Groups não respondeu",
    text: "O serviço está fora do ar agora. Tente de novo em instantes.",
  },
  unexpected: { title: "Algo deu errado", text: "Tivemos um problema ao abrir esta tela. Tente de novo." },
};

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function LoadError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  // `navigator` só existe no navegador; no servidor conta como online.
  const isOnline = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const kind = loadErrorKind({ digest: error.digest, isOnline });
  const { title, text } = copy[kind];

  useEffect(() => {
    // O digest liga este registro ao log do servidor (Vercel).
    console.error("[app] erro na tela", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-card border border-kotta-border bg-kotta-surface p-8 text-center">
      <h1 className="text-2xl font-bold text-kotta-text">{title}</h1>
      <p className="mt-3 text-sm text-kotta-muted">{text}</p>
      {kind === "unexpected" && error.digest ? (
        <p className="mt-2 text-xs text-kotta-muted">Código: {error.digest}</p>
      ) : null}
      <button type="button" onClick={() => retry()} className="primary-action mt-6">
        Tentar de novo
      </button>
    </div>
  );
}
