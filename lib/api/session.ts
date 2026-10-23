import "server-only";
import { cookies } from "next/headers";
import {
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  clearSessionCookies,
  readSessionToken,
  sessionCookieOptions,
} from "@/lib/session-cookie";

export async function getSessionToken(): Promise<string | undefined> {
  return readSessionToken(await cookies());
}

/** Só pode ser chamado em Server Functions ou Route Handlers. */
export async function setSessionToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions(token));
  store.delete(LEGACY_SESSION_COOKIE);
}

/** Só pode ser chamado em Server Functions ou Route Handlers. */
export async function clearSessionToken(): Promise<void> {
  clearSessionCookies(await cookies());
}
