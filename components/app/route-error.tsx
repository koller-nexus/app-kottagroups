"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { ErrorState } from "@/components/app/error-state";
import { friendlyMessage } from "@/lib/api/errors";
import { apiErrorFromDigest, errorKind } from "@/lib/error-state";

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** Tela dos boundaries error.tsx / global-error.tsx: escolhe a variante pelo digest e registra o erro. */
export function RouteError({
  error,
  retry,
  homeHref,
  homeLabel,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref: string;
  homeLabel: string;
}) {
  // `navigator` só existe no navegador; no servidor conta como online.
  const isOnline = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const kind = errorKind({ digest: error.digest, isOnline });
  const api = apiErrorFromDigest(error.digest);
  // friendlyMessage termina alguns textos com "(CODE)"; aqui o código já vai na linha "Código:".
  const text = api ? friendlyMessage(api.code).replace(` (${api.code})`, "") : undefined;

  useEffect(() => {
    // O digest liga este registro ao log do servidor (Vercel).
    console.error("[app] erro na tela", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-card border border-kotta-border bg-kotta-surface p-8">
      <ErrorState
        kind={kind}
        text={text}
        code={api?.code ?? error.digest}
        primary={
          <button type="button" onClick={() => retry()} className="primary-action">
            Tentar de novo
          </button>
        }
        secondary={
          kind === "unexpected" ? (
            <Link href={homeHref} className="secondary-action">
              {homeLabel}
            </Link>
          ) : undefined
        }
      />
    </div>
  );
}
