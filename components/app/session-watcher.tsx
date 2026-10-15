"use client";

import { useEffect, useRef, useState } from "react";
import { SESSION_CHANNEL, type SignedOutMessage, type SignedOutMotivo } from "@/lib/session-channel";
import { watcherDeadlines } from "@/lib/session-expiry";

function loginUrl(motivo: SignedOutMotivo): string {
  const params = new URLSearchParams({ motivo });
  if (motivo === "expirada") params.set("next", `${location.pathname}${location.search}`);
  return `/entrar?${params}`;
}

/**
 * Desloga no horário em que o JWT vence, mesmo com a aba parada, e acompanha o logout feito em
 * outra aba. Recebe só o tempo restante (nunca o token) e conta a partir do relógio do próprio
 * dispositivo. A navegação é completa para o proxy ver o cookie vencido e apagá-lo.
 */
export function SessionWatcher({ msLeft }: { msLeft: number }) {
  const [warning, setWarning] = useState(false);
  const deadline = useRef<number | null>(null);

  useEffect(() => {
    deadline.current ??= Date.now() + msLeft;
    let timers: number[] = [];

    const leave = (motivo: SignedOutMotivo) => window.location.assign(loginUrl(motivo));
    // Re-armado ao voltar do segundo plano: timers param quando a aba está escondida.
    const arm = () => {
      timers.forEach((id) => clearTimeout(id));
      const { warnInMs, expireInMs } = watcherDeadlines((deadline.current ?? 0) - Date.now());
      if (expireInMs === 0) {
        leave("expirada");
        return;
      }
      timers = [
        window.setTimeout(() => setWarning(true), warnInMs),
        window.setTimeout(() => leave("expirada"), expireInMs),
      ];
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") arm();
    };

    arm();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", arm);

    const channel = typeof BroadcastChannel === "undefined" ? undefined : new BroadcastChannel(SESSION_CHANNEL);
    if (channel) {
      channel.onmessage = (event: MessageEvent<SignedOutMessage>) => {
        if (event.data?.type === "signed-out") leave(event.data.motivo);
      };
    }

    return () => {
      timers.forEach((id) => clearTimeout(id));
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", arm);
      channel?.close();
    };
  }, [msLeft]);

  if (!warning) return null;
  return (
    <p
      role="status"
      className="mb-6 rounded-control border border-kotta-border bg-kotta-surface px-4 py-3 text-sm text-kotta-text"
    >
      Sua sessão vai expirar em 2 minutos. Salve o que estiver fazendo.
    </p>
  );
}
