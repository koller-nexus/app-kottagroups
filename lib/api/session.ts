import "server-only";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "kotta_session";
// Mesmo tempo de vida do JWT emitido pela API (internal/auth/token.go).
const SESSION_MAX_AGE = 24 * 60 * 60;

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value || undefined;
}

/** Só pode ser chamado em Server Functions ou Route Handlers. */
export async function setSessionToken(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Só pode ser chamado em Server Functions ou Route Handlers. */
export async function clearSessionToken(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
