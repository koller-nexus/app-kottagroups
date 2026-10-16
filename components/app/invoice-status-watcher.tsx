"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ApiInvoiceStatus } from "@/lib/api/types";
import { isInvoicePending } from "@/lib/invoices";
import { isPollExpired, nextPollDelay } from "@/lib/poll-schedule";

/**
 * Acompanha notas em leitura consultando só o status delas. A tela (com o shell) só é
 * recarregada uma vez, quando nenhuma segue pendente. Pausa com a aba oculta e para em 10 min.
 */
export function InvoiceStatusWatcher({ ids }: { ids: string[] }) {
  const router = useRouter();
  // Cada "Atualizar" começa uma nova rodada de consultas.
  const [round, setRound] = useState(0);
  const [expiredRound, setExpiredRound] = useState<number | null>(null);
  const query = ids.join(",");

  useEffect(() => {
    if (!query) return;
    const startedAt = Date.now();
    let attempt = 0;
    let timer: number | undefined;
    let busy = false;
    let stopped = false;

    function stopAndRefresh() {
      stopped = true;
      router.refresh();
    }

    function schedule() {
      timer = window.setTimeout(check, nextPollDelay(attempt));
      attempt += 1;
    }

    async function check() {
      // Oculta: retoma no visibilitychange.
      if (stopped || busy || document.hidden) return;
      if (isPollExpired(startedAt, Date.now())) {
        stopped = true;
        setExpiredRound(round);
        return;
      }
      busy = true;
      try {
        const response = await fetch(`/api/notas/status?ids=${encodeURIComponent(query)}`, {
          cache: "no-store",
          // Sessão expirada chega como redirecionamento; a página recarregada leva ao fluxo certo.
          redirect: "manual",
        });
        if (response.type === "opaqueredirect" || response.status === 401) return stopAndRefresh();
        if (response.ok) {
          const { items } = (await response.json()) as { items: { status: ApiInvoiceStatus }[] };
          if (!items.some((item) => isInvoicePending(item.status))) return stopAndRefresh();
        }
      } catch {
        // Sem rede: tenta de novo no próximo intervalo.
      } finally {
        busy = false;
      }
      if (!stopped) schedule();
    }

    function onVisibilityChange() {
      if (document.hidden || stopped) return;
      window.clearTimeout(timer);
      void check();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    schedule();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [query, round, router]);

  if (expiredRound !== round) return null;
  return (
    <button
      type="button"
      className="secondary-action"
      onClick={() => {
        router.refresh();
        setRound((current) => current + 1);
      }}
    >
      Atualizar
    </button>
  );
}
