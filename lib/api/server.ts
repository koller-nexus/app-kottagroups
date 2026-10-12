import "server-only";
import { redirect } from "next/navigation";
import { ApiError, parseErrorBody } from "@/lib/api/errors";
import { getSessionToken } from "@/lib/api/session";

function apiOrigin(): string {
  return (process.env.API_ORIGIN ?? "https://api.kottagroups.com.br").replace(/\/$/, "");
}

type JsonBody = Record<string, unknown> | unknown[];

interface ApiRequestInit extends Omit<RequestInit, "body"> {
  body?: JsonBody;
  /** Envia o token da sessão (padrão: true). */
  auth?: boolean;
}

/**
 * Chamada servidor→API. Desembrulha `{ data }`, lança ApiError em falhas e
 * trata sessão expirada e e-mail não confirmado com redirecionamento.
 */
export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { body, auth = true, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("Accept", "application/json");

  const token = auth ? await getSessionToken() : undefined;
  if (auth && !token) redirect("/entrar");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body !== undefined) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${apiOrigin()}/api/v1${path}`, {
      ...rest,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(503, "NETWORK_ERROR", "Falha de rede ao falar com a API.");
  }

  if (!response.ok) {
    let parsed: { code: string; message: string } | undefined;
    try {
      parsed = parseErrorBody(await response.json());
    } catch {
      // Resposta sem JSON: fica o erro pelo status.
    }
    const code = parsed?.code ?? (response.status === 401 ? "UNAUTHORIZED" : "UNKNOWN_ERROR");
    if (auth && response.status === 401) {
      // O cookie só pode ser apagado num Route Handler.
      redirect("/sair?motivo=expirada");
    }
    if (auth && response.status === 403 && code === "EMAIL_NOT_CONFIRMED") {
      redirect("/confirme-seu-email");
    }
    throw new ApiError(response.status, code, parsed?.message ?? response.statusText);
  }

  if (response.status === 204) return undefined as T;
  const payload = (await response.json()) as { data?: T };
  return (payload && typeof payload === "object" && "data" in payload ? payload.data : payload) as T;
}

export function withQuery(path: string, params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
