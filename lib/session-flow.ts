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
  "conta-criada": "Conta criada! Entre para continuar.",
};

const SESSION_EXPIRED_MOTIVOS = new Set(["expirada", "envio"]);

/** Login depois de um cadastro cujo login automático falhou: a conta já existe. */
export function accountCreatedLoginUrl(email: string, next = "/"): string {
  const params = new URLSearchParams({ motivo: "conta-criada", email });
  if (next !== "/") params.set("next", next);
  return `/entrar?${params}`;
}

/** Login depois de sair pelo botão; `next` (já passado por safeNextPath) leva de volta, ex.: a um convite. */
export function signedOutLoginUrl(next = "/"): string {
  const params = new URLSearchParams({ motivo: "saiu" });
  if (next !== "/") params.set("next", next);
  return `/entrar?${params}`;
}

/** "Confirme seu e-mail" mantendo para onde a pessoa ia (já passado por safeNextPath). */
export function confirmEmailUrl(next: string): string {
  return next === "/" ? "/confirme-seu-email" : `/confirme-seu-email?${new URLSearchParams({ next })}`;
}

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

export type TokenCheck = "valid" | "invalid" | "unknown" | "no-token";

/**
 * Para onde /sair manda depois de perguntar à API se o token ainda vale. Com a API fora
 * ("unknown") volta para `next` em vez de /entrar: o cookie pode estar válido e o proxy
 * devolveria /entrar para /, num pingue-pongue. A página então cai no erro "fora do ar".
 */
export function logoutDestination({
  check,
  next,
  motivo,
}: {
  check: TokenCheck;
  /** Já passado por safeNextPath. */
  next: string;
  motivo: string | null;
}): { location: string; clearCookie: boolean } {
  if (check === "valid" || check === "unknown") return { location: next, clearCookie: false };
  const params = new URLSearchParams();
  if (motivo && SESSION_EXPIRED_MOTIVOS.has(motivo)) params.set("motivo", motivo);
  if (next !== "/") params.set("next", next);
  const query = params.toString();
  return { location: query ? `/entrar?${query}` : "/entrar", clearCookie: check === "invalid" };
}
