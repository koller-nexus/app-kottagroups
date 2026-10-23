import { isSessionExpired, sessionExpiresAt } from "./session-expiry.ts";

// O prefixo faz o navegador só aceitar o cookie vindo deste host, com Secure, Path=/ e sem
// Domain: outro subdomínio não consegue plantar nem trocar a sessão (#84).
export const SESSION_COOKIE = "__Host-kotta_session";
// Temporário (#84): lido só para não deslogar quem entrou antes do deploy; o proxy o troca pelo
// novo na primeira página. Remover a partir da data da issue de acompanhamento.
export const LEGACY_SESSION_COOKIE = "kotta_session";
// Só quando o JWT não traz `exp`; normalmente o cookie vence junto com o token.
const SESSION_MAX_AGE = 24 * 60 * 60;

export type SessionCookieAction = "none" | "clear" | "migrate" | "drop-legacy";

interface CookieReader {
  get(name: string): { value: string } | undefined;
}

interface CookieDeleter {
  delete(name: string): unknown;
  delete(cookie: { name: string; path: string; secure: boolean }): unknown;
}

/** Atributos do cookie novo, iguais em todo ambiente (`localhost` aceita Secure). */
export function sessionCookieOptions(token: string) {
  // Cookie e JWT vencem no mesmo instante, senão o proxy manda para /entrar sem saber o motivo.
  const expiresAt = sessionExpiresAt(token);
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    ...(expiresAt === undefined ? { maxAge: SESSION_MAX_AGE } : { expires: new Date(expiresAt) }),
  };
}

/** Token do cookie novo; sem ele, o do antigo (transição). Valor vazio conta como ausente. */
export function readSessionToken(cookies: CookieReader): string | undefined {
  return cookies.get(SESSION_COOKIE)?.value || cookies.get(LEGACY_SESSION_COOKIE)?.value || undefined;
}

export function clearSessionCookies(cookies: CookieDeleter): void {
  // `delete(nome)` sai sem Secure, e o navegador ignora um Set-Cookie `__Host-` sem Secure.
  cookies.delete({ name: SESSION_COOKIE, path: "/", secure: true });
  cookies.delete(LEGACY_SESSION_COOKIE);
}

/** O que o proxy faz com os cookies da sessão; ver specs/025-host-session-cookie/data-model.md. */
export function sessionCookieAction(
  current: string | undefined,
  legacy: string | undefined,
  now = Date.now(),
): SessionCookieAction {
  const token = current || legacy;
  if (!token) return legacy === undefined ? "none" : "drop-legacy";
  if (isSessionExpired(token, now)) return "clear";
  if (!current) return "migrate";
  return legacy === undefined ? "none" : "drop-legacy";
}
