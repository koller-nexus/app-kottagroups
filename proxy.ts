import { NextResponse, type NextRequest } from "next/server";
import { apiOrigin } from "@/lib/api/origin";
import { contentSecurityPolicy, createNonce } from "@/lib/csp";
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
const SESSION_COOKIE = "kotta_session";
const PROTECTED = ["/grupos", "/notificacoes", "/notas", "/perfil", "/despesas", "/confirme-seu-email"];
const GUEST_ONLY = ["/entrar", "/cadastrar", "/esqueci-a-senha"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function clearingExpiredCookie(response: NextResponse, expired: boolean): NextResponse {
  if (expired) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const expired = Boolean(token) && isSessionExpired(token);
  const hasValidSession = Boolean(token) && !expired;

  // "/" é o painel quando há sessão; com o cookie vencido também pede login de novo.
  const needsSession = matches(pathname, PROTECTED) || (expired && pathname === "/");
  if (!hasValidSession && needsSession) {
    const url = new URL("/entrar", request.nextUrl);
    if (pathname !== "/confirme-seu-email") url.searchParams.set("next", `${pathname}${search}`);
    // Sem cookie numa rota protegida quase sempre é sessão que venceu (o cookie expira com o JWT).
    url.searchParams.set("motivo", "expirada");
    return clearingExpiredCookie(NextResponse.redirect(url), expired);
  }

  if (hasValidSession && matches(pathname, GUEST_ONLY)) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
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
  return clearingExpiredCookie(response, expired);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
