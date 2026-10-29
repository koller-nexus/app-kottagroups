import { NextResponse, type NextRequest } from "next/server";
import { apiOrigin } from "@/lib/api/origin";
import { contentSecurityPolicy, createNonce } from "@/lib/csp";
import {
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  clearSessionCookies,
  readSessionToken,
  sessionCookieAction,
  sessionCookieOptions,
  type SessionCookieAction,
} from "@/lib/session-cookie";
import { isSessionExpired } from "@/lib/session-expiry";
import { PATH_HEADER } from "@/lib/session-flow";

// CSP_REPORT_ONLY=1 só relata (observação no Preview, ou volta rápida); sem ela, bloqueia.
// No relato o proxy não manda a Content-Security-Policy: a do next.config.ts (só frame) segue na
// resposta, e uma vinda daqui seria lida pelo Next antes da -Report-Only, escondendo o nonce.
const CSP_HEADER =
  process.env.CSP_REPORT_ONLY === "1" ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";

// Checagem local: só lê o `exp` do JWT no cookie, sem verificar assinatura. A validade do
// token é confirmada pela API em cada chamada (lib/api/server.ts). Um cookie vencido é
// apagado aqui mesmo, para a pessoa chegar em /entrar sabendo que a sessão expirou.
// Durante a transição para o cookie `__Host-` (#84), quem chega só com o nome antigo e token
// válido sai desta resposta com o cookie novo: páginas não podem gravar cookie.
const PROTECTED = ["/grupos", "/notificacoes", "/notas", "/perfil", "/despesas", "/confirme-seu-email"];
const GUEST_ONLY = ["/entrar", "/cadastrar", "/esqueci-a-senha"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function syncingSessionCookies(response: NextResponse, action: SessionCookieAction, token?: string): NextResponse {
  if (action === "clear") clearSessionCookies(response.cookies);
  if (action === "migrate" && token) response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(token));
  if (action === "migrate" || action === "drop-legacy") response.cookies.delete(LEGACY_SESSION_COOKIE);
  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = readSessionToken(request.cookies);
  const action = sessionCookieAction(
    request.cookies.get(SESSION_COOKIE)?.value,
    request.cookies.get(LEGACY_SESSION_COOKIE)?.value,
  );
  const expired = Boolean(token) && isSessionExpired(token);
  const hasValidSession = Boolean(token) && !expired;

  // "/" é o painel quando há sessão; com o cookie vencido também pede login de novo.
  const needsSession = matches(pathname, PROTECTED) || (expired && pathname === "/");
  if (!hasValidSession && needsSession) {
    const url = new URL("/entrar", request.nextUrl);
    if (pathname !== "/confirme-seu-email") url.searchParams.set("next", `${pathname}${search}`);
    // Sem cookie numa rota protegida quase sempre é sessão que venceu (o cookie expira com o JWT).
    url.searchParams.set("motivo", "expirada");
    return syncingSessionCookies(NextResponse.redirect(url), action, token);
  }

  if (hasValidSession && matches(pathname, GUEST_ONLY)) {
    return syncingSessionCookies(NextResponse.redirect(new URL("/", request.nextUrl)), action, token);
  }

  // Caminho atual para o apiRequest montar o "voltar para" quando a sessão expira.
  // Sobrescreve qualquer valor que venha do cliente.
  const headers = new Headers(request.headers);
  headers.set(PATH_HEADER, `${pathname}${search}`);
  // O Next lê o nonce da política no cabeçalho da requisição e o põe nos próprios scripts.
  const policy = contentSecurityPolicy({
    nonce: createNonce(),
    apiOrigin: apiOrigin(),
    isDev: process.env.NODE_ENV === "development",
  });
  headers.set(CSP_HEADER, policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set(CSP_HEADER, policy);
  return syncingSessionCookies(response, action, token);
}

// sw.js, o manifest e offline.* ficam fora: são estáticos sem nonce, e um offline.js externo seria
// bloqueado pelo 'strict-dynamic' da política das páginas (specs/029-pwa-installable).
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|offline\\.|.*\\.png$|.*\\.svg$).*)"],
};
