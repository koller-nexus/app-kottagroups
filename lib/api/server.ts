import "server-only";
import { headers as requestHeaders } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { clientIpHeaders } from "@/lib/api/client-ip";
import { ApiError, parseErrorBody } from "@/lib/api/errors";
import { apiOrigin } from "@/lib/api/origin";
import { getSessionToken } from "@/lib/api/session";
import { safeNextPath } from "@/lib/safe-next";
import { confirmEmailUrl, expiredSessionUrl, PATH_HEADER } from "@/lib/session-flow";

// Contador de chamadas por request (React.cache vive só durante a renderização).
const requestStats = cache(() => ({ calls: 0, tag: Math.random().toString(36).slice(2, 8) }));

/** Com API_TIMING_LOG=1, registra request, ordem, rota e duração de cada chamada (sem query, token ou corpo). */
function logTiming(method: string, path: string, status: number | string, startedAt: number): void {
  if (process.env.API_TIMING_LOG !== "1") return;
  const stats = requestStats();
  stats.calls += 1;
  const route = path.split("?")[0];
  console.info(`[api] r${stats.tag} #${stats.calls} ${method} ${route} -> ${status} ${Math.round(performance.now() - startedAt)}ms`);
}

// Estado do processo, não da requisição: só evita repetir o aviso.
let warnedMissingSecret = false;

/**
 * IP do navegador e segredo do front, para a API contar o limite por pessoa (api#250).
 * O segredo vem de `KOTTA_BFF_SECRET`, só do servidor; sem ele, nada é enviado.
 */
export async function bffHeaders(): Promise<Record<string, string>> {
  const secret = process.env.KOTTA_BFF_SECRET;
  if (!secret && process.env.VERCEL_ENV === "production" && !warnedMissingSecret) {
    warnedMissingSecret = true;
    console.warn("[api] client IP not forwarded: KOTTA_BFF_SECRET is not set");
  }
  return clientIpHeaders(await requestHeaders(), secret);
}

type JsonBody = Record<string, unknown> | unknown[];

interface ApiRequestInit extends Omit<RequestInit, "body"> {
  /** JSON, ou FormData para uploads multipart (o fetch define o boundary). */
  body?: JsonBody | FormData;
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
  // Por último, para nenhum chamador trocar o IP ou o segredo.
  for (const [name, value] of Object.entries(await bffHeaders())) headers.set(name, value);

  const method = (rest.method ?? "GET").toUpperCase();
  const token = auth ? await getSessionToken() : undefined;
  if (auth && !token) {
    redirect(`/entrar?${new URLSearchParams({ next: safeNextPath(await currentPath()) })}`);
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers.set("Content-Type", "application/json");

  const startedAt = performance.now();
  let response: Response;
  try {
    response = await fetch(`${apiOrigin()}/api/v1${path}`, {
      ...rest,
      headers,
      body: body === undefined || isForm ? body : JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    logTiming(method, path, "network-error", startedAt);
    console.error(`[api] ${method} ${path} -> network error`, error instanceof Error ? error.message : error);
    throw new ApiError(503, "NETWORK_ERROR", "Falha de rede ao falar com a API.");
  }

  logTiming(method, path, response.status, startedAt);

  if (!response.ok) {
    let parsed: { code: string; message: string } | undefined;
    try {
      parsed = parseErrorBody(await response.json());
    } catch {
      // Resposta sem JSON (ex.: página de bloqueio do proxy): fica o erro pelo status.
    }
    const code = parsed?.code ?? fallbackCode(response);
    // Vai para os logs do servidor (Vercel), sem token nem corpo da requisição.
    console.error(
      `[api] ${method} ${path} -> ${response.status} ${code}` +
        ` (server=${response.headers.get("server") ?? "?"}, content-type=${response.headers.get("content-type") ?? "?"})`,
    );
    if (auth && response.status === 401) {
      // O cookie só pode ser apagado num Route Handler.
      redirect(expiredSessionUrl(await currentPath(), method));
    }
    if (auth && response.status === 403 && code === "EMAIL_NOT_CONFIRMED") {
      redirect(confirmEmailUrl(safeNextPath(await currentPath())));
    }
    throw new ApiError(response.status, code, parsed?.message ?? response.statusText, retryAfterSeconds(response));
  }

  if (response.status === 204) return undefined as T;
  const payload = (await response.json()) as { data?: T };
  return (payload && typeof payload === "object" && "data" in payload ? payload.data : payload) as T;
}

/** Página que fez a chamada, gravada pelo proxy.ts; vira o "voltar para" ao entrar de novo. */
async function currentPath(): Promise<string | null> {
  return (await requestHeaders()).get(PATH_HEADER);
}

/** `Retry-After` em segundos; a forma de data HTTP não é usada pela API. */
function retryAfterSeconds(response: Response): number | undefined {
  const seconds = Number(response.headers.get("retry-after"));
  return Number.isInteger(seconds) && seconds > 0 ? seconds : undefined;
}

/** Código para respostas de erro sem o envelope JSON da API. */
function fallbackCode(response: Response): string {
  if (response.status === 401) return "UNAUTHORIZED";
  // Toda resposta via Cloudflare traz `server: cloudflare`; só desafio (cf-mitigated) ou 403 do WAF é bloqueio.
  const viaCloudflare = response.headers.get("server")?.toLowerCase() === "cloudflare";
  if (response.headers.get("cf-mitigated") || (viaCloudflare && response.status === 403)) {
    return "EDGE_BLOCKED";
  }
  if (response.status >= 500) return "SERVICE_UNAVAILABLE";
  return `HTTP_${response.status}`;
}

export function withQuery(path: string, params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
