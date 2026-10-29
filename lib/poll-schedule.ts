// Agenda do acompanhamento de notas em leitura (sem I/O).

/** Espera entre consultas: começa rápido e se acomoda em 10 s. */
export const POLL_INTERVALS_MS = [3000, 5000, 10000];
/** Depois disso para de consultar e oferece atualizar à mão. */
export const POLL_MAX_DURATION_MS = 10 * 60 * 1000;
/** Teto de notas por consulta, para a rota não virar um multiplicador de chamadas à API. */
export const MAX_STATUS_IDS = 20;

/**
 * ULID canônico, igual ao `model.IsID` da API: um único id fora dele faz a API recusar o lote
 * inteiro, então a rota recusa antes de chamar.
 */
const ULID_PATTERN = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

export function nextPollDelay(attempt: number): number {
  return POLL_INTERVALS_MS[Math.min(attempt, POLL_INTERVALS_MS.length - 1)];
}

export function isPollExpired(startedAtMs: number, nowMs: number): boolean {
  return nowMs - startedAtMs >= POLL_MAX_DURATION_MS;
}

/** `?ids=a,b` sem repetidos (a API recusa repetidos); `null` quando vazio, grande demais ou com id fora do ULID canônico. */
export function parseStatusIds(raw: string | null): string[] | null {
  if (!raw) return null;
  const ids = [...new Set(raw.split(","))];
  if (ids.length > MAX_STATUS_IDS || !ids.every((id) => ULID_PATTERN.test(id))) return null;
  return ids;
}
