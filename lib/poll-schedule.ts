// Agenda do acompanhamento de notas em leitura (sem I/O).

/** Espera entre consultas: começa rápido e se acomoda em 10 s. */
export const POLL_INTERVALS_MS = [3000, 5000, 10000];
/** Depois disso para de consultar e oferece atualizar à mão. */
export const POLL_MAX_DURATION_MS = 10 * 60 * 1000;
/** Teto de notas por consulta, para a rota não virar um multiplicador de chamadas à API. */
export const MAX_STATUS_IDS = 20;

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function nextPollDelay(attempt: number): number {
  return POLL_INTERVALS_MS[Math.min(attempt, POLL_INTERVALS_MS.length - 1)];
}

export function isPollExpired(startedAtMs: number, nowMs: number): boolean {
  return nowMs - startedAtMs >= POLL_MAX_DURATION_MS;
}

/** `?ids=a,b` sem repetidos; `null` quando vazio, grande demais ou com id malformado. */
export function parseStatusIds(raw: string | null): string[] | null {
  if (!raw) return null;
  const ids = [...new Set(raw.split(","))];
  if (ids.length > MAX_STATUS_IDS || !ids.every((id) => ID_PATTERN.test(id))) return null;
  return ids;
}
