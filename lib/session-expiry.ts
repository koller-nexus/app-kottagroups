/** Folga antes do `exp` para o app agir antes de a API recusar o token (relógios nunca batem). */
export const EXPIRY_LEEWAY_MS = 30_000;
/** Antecedência do aviso "sua sessão vai expirar". */
export const EXPIRY_WARNING_MS = 120_000;

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * Vencimento do JWT em milissegundos desde epoch, lido do claim `exp`. Só decodifica o payload;
 * a assinatura continua sendo verificada pela API. Devolve undefined para token ilegível.
 */
export function sessionExpiresAt(token: string): number | undefined {
  const payload = token.split(".")[1];
  if (!payload) return undefined;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims: unknown = JSON.parse(atob(base64));
    if (!claims || typeof claims !== "object") return undefined;
    const exp = (claims as { exp?: unknown }).exp;
    return typeof exp === "number" && Number.isFinite(exp) ? exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

/** Token ausente ou ilegível conta como vencido: nunca deixa alguém numa tela "logada" sem sessão. */
export function isSessionExpired(token: string | undefined, now = Date.now()): boolean {
  if (!token) return true;
  const expiresAt = sessionExpiresAt(token);
  return expiresAt === undefined || expiresAt - EXPIRY_LEEWAY_MS <= now;
}

/** Tempo até o vencimento, para o SessionWatcher; sem token ou token ilegível é 0 ou negativo. */
export function sessionMsLeft(token: string | undefined, now = Date.now()): number {
  const expiresAt = token ? sessionExpiresAt(token) : undefined;
  return (expiresAt ?? 0) - now;
}

/** Prazos do SessionWatcher a partir do tempo restante informado pelo servidor. */
export function watcherDeadlines(msLeft: number): { warnInMs: number; expireInMs: number } {
  return {
    warnInMs: Math.max(0, msLeft - EXPIRY_WARNING_MS),
    expireInMs: Math.max(0, Math.min(msLeft, MAX_TIMEOUT_MS)),
  };
}
