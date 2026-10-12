import { safeNextPath } from "./safe-next.ts";

/** Cabeçalho interno com o caminho atual, gravado pelo proxy.ts em toda requisição. */
export const PATH_HEADER = "x-kotta-path";

export const SUBMIT_LOST_PARAM = "aviso";
export const SUBMIT_LOST_VALUE = "envio-nao-salvo";

const EXPIRED_NOTICE = "Sua sessão expirou. Entre de novo para continuar.";

const NOTICES: Record<string, string> = {
  saiu: "Você saiu da conta.",
  expirada: EXPIRED_NOTICE,
  envio: EXPIRED_NOTICE,
};

/** Aviso da tela de entrar para cada `motivo` (saiu | expirada | envio). */
export function loginNotice(motivo: unknown): string | undefined {
  return typeof motivo === "string" && Object.hasOwn(NOTICES, motivo) ? NOTICES[motivo] : undefined;
}

/**
 * Para onde ir quando a API recusa o token. Uma escrita (POST, PATCH…) perdeu o envio,
 * então o destino ganha o aviso para a página do formulário.
 */
export function expiredSessionUrl(path: string | null | undefined, method: string): string {
  const lostSubmit = method.toUpperCase() !== "GET";
  let next = safeNextPath(path);
  if (lostSubmit) {
    next += `${next.includes("?") ? "&" : "?"}${SUBMIT_LOST_PARAM}=${SUBMIT_LOST_VALUE}`;
  }
  const params = new URLSearchParams({ motivo: lostSubmit ? "envio" : "expirada", next });
  return `/sair?${params}`;
}
