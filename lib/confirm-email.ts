// A API responde igual para link expirado, já usado e inválido ("Confirmation is invalid or
// expired"); por isso "já confirmado" vem da conta logada e expirado/inválido dividem a tela.
export type ConfirmationState =
  | "success"
  | "already-confirmed"
  | "missing"
  | "invalid-or-expired"
  | "unexpected-error";

export interface ConfirmationOutcome {
  state: ConfirmationState;
  signedIn: boolean;
}

export function isUsableConfirmationToken(token: string | null | undefined): token is string {
  return typeof token === "string" && token.trim().length > 0;
}

/**
 * Estado da tela a partir da resposta da API. `status` 0 é falha de rede. `sessionUser` é a
 * conta logada, quando há sessão; undefined quando não há.
 */
export function confirmationOutcome({
  token,
  status,
  sessionUser,
}: {
  token: string | null | undefined;
  status: number;
  sessionUser?: { emailConfirmed: boolean };
}): ConfirmationOutcome {
  const signedIn = sessionUser !== undefined;
  if (!isUsableConfirmationToken(token)) return { state: "missing", signedIn };
  if (status >= 200 && status < 300) return { state: "success", signedIn };
  if (status >= 400 && status < 500) {
    return { state: sessionUser?.emailConfirmed ? "already-confirmed" : "invalid-or-expired", signedIn };
  }
  return { state: "unexpected-error", signedIn };
}
