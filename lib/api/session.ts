import "server-only";
import { cookies } from "next/headers";
import { sessionExpiresAt } from "@/lib/session-expiry";

export const SESSION_COOKIE = "kotta_session";
// Só quando o JWT não traz `exp`; normalmente o cookie vence junto com o token.
const SESSION_MAX_AGE = 24 * 60 * 60;

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value || undefined;
}

/** Só pode ser chamado em Server Functions ou Route Handlers. */
export async function setSessionToken(token: string): Promise<void> {
  // Cookie e JWT vencem no mesmo instante, senão o proxy manda para /entrar sem saber o motivo.
  const expiresAt = sessionExpiresAt(token);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(expiresAt === undefined ? { maxAge: SESSION_MAX_AGE } : { expires: new Date(expiresAt) }),
  });
}

/** Só pode ser chamado em Server Functions ou Route Handlers. */
export async function clearSessionToken(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
