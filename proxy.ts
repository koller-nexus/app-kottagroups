import { NextResponse, type NextRequest } from "next/server";
import { PATH_HEADER } from "@/lib/session-flow";

// Checagem otimista: só olha se o cookie existe. A validade do token é
// confirmada pela API em cada chamada (lib/api/server.ts).
const SESSION_COOKIE = "kotta_session";
const PROTECTED = ["/grupos", "/notificacoes", "/notas", "/perfil", "/despesas", "/confirme-seu-email"];
const GUEST_ONLY = ["/entrar", "/cadastrar", "/esqueci-a-senha"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && matches(pathname, PROTECTED)) {
    const url = new URL("/entrar", request.nextUrl);
    if (pathname !== "/confirme-seu-email") url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (hasSession && matches(pathname, GUEST_ONLY)) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  // Caminho atual para o apiRequest montar o "voltar para" quando a sessão expira.
  // Sobrescreve qualquer valor que venha do cliente.
  const headers = new Headers(request.headers);
  headers.set(PATH_HEADER, `${pathname}${search}`);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
