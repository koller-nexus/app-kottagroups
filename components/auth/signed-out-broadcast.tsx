"use client";

import { useEffect } from "react";
import { broadcastSignedOut, type SignedOutMotivo } from "@/lib/session-channel";

/**
 * Montado em /entrar quando se chegou deslogado por `motivo`. Avisa só aqui, e não no clique
 * em "Sair": neste ponto o cookie já foi apagado, então as outras abas passam pelo proxy.
 */
export function SignedOutBroadcast({ motivo }: { motivo: SignedOutMotivo }) {
  useEffect(() => {
    broadcastSignedOut(motivo);
  }, [motivo]);
  return null;
}
