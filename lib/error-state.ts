/**
 * Prefixo do `digest` de todo ApiError (`API_ERROR:<status>:<code>`). Em produção o Next manda ao
 * cliente só o digest e respeita um digest já presente; é assim que a tela de erro sabe o tipo.
 */
export const API_ERROR_DIGEST = "API_ERROR:";

/** Códigos em que a API não respondeu de verdade, seja qual for o status. */
export const UNAVAILABLE_CODES = new Set(["NETWORK_ERROR", "SERVICE_UNAVAILABLE", "EDGE_BLOCKED", "INTERNAL_ERROR"]);

export type ErrorKind = "not-found" | "session-expired" | "offline" | "unavailable" | "unexpected";

export const ERROR_COPY: Record<ErrorKind, { title: string; text: string }> = {
  "not-found": { title: "Página não encontrada", text: "Essa página não existe ou mudou de lugar." },
  "session-expired": { title: "Sua sessão expirou", text: "Entre de novo para continuar de onde parou." },
  offline: { title: "Sem conexão", text: "Verifique sua internet e tente de novo." },
  unavailable: {
    title: "O Kotta Groups está fora do ar",
    text: "O serviço não respondeu agora. Tente de novo em instantes.",
  },
  unexpected: { title: "Algo deu errado", text: "Tivemos um problema ao abrir esta tela. Tente de novo." },
};

/** Status e código de um digest `API_ERROR:<status>:<code>`; undefined para qualquer outro digest. */
export function apiErrorFromDigest(digest?: string): { status: number; code: string } | undefined {
  if (!digest?.startsWith(API_ERROR_DIGEST)) return undefined;
  const [status, ...rest] = digest.slice(API_ERROR_DIGEST.length).split(":");
  const code = rest.join(":");
  const parsed = Number(status);
  if (!Number.isInteger(parsed) || !code) return undefined;
  return { status: parsed, code };
}

export function errorKind({ digest, isOnline }: { digest?: string; isOnline: boolean }): ErrorKind {
  if (!isOnline) return "offline";
  const api = apiErrorFromDigest(digest);
  if (api && (api.status >= 500 || UNAVAILABLE_CODES.has(api.code))) return "unavailable";
  return "unexpected";
}
