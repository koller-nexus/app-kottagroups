/** Canal entre abas do mesmo navegador: sair ou vencer numa aba derruba as outras. */
export const SESSION_CHANNEL = "kotta-session";

export type SignedOutMotivo = "saiu" | "expirada";

export interface SignedOutMessage {
  type: "signed-out";
  motivo: SignedOutMotivo;
}

/** Só no navegador. Chamado ao chegar em /entrar já deslogado, quando o cookie não existe mais. */
export function broadcastSignedOut(motivo: SignedOutMotivo): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(SESSION_CHANNEL);
  channel.postMessage({ type: "signed-out", motivo } satisfies SignedOutMessage);
  channel.close();
}
