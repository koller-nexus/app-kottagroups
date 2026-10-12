import { NextResponse, type NextRequest } from "next/server";
import { apiOrigin } from "@/lib/api/server";
import { SESSION_COOKIE } from "@/lib/api/session";
import { safeNextPath } from "@/lib/safe-next";

const FORWARDED_MOTIVOS = new Set(["expirada", "envio"]);

type TokenCheck = "invalid" | "valid" | "unknown";

// Chamada direta, sem apiRequest: no 401 ele redirecionaria de novo para cá.
async function checkToken(token: string): Promise<TokenCheck> {
  try {
    const response = await fetch(`${apiOrigin()}/api/v1/users/me`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (response.status === 401) return "invalid";
    return response.ok ? "valid" : "unknown";
  } catch {
    return "unknown";
  }
}

// Limpa a sessão só quando a API confirma que o token não vale mais. Assim um link
// de outro site para /sair não desloga ninguém; sair de propósito é o logoutAction (POST).
export async function GET(request: NextRequest) {
  const motivo = request.nextUrl.searchParams.get("motivo");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  const entrar = new URL("/entrar", request.nextUrl);
  if (motivo && FORWARDED_MOTIVOS.has(motivo)) entrar.searchParams.set("motivo", motivo);
  if (next !== "/") entrar.searchParams.set("next", next);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.redirect(entrar);

  const check = await checkToken(token);
  if (check === "valid") return NextResponse.redirect(new URL(next, request.nextUrl));
  if (check === "unknown") return NextResponse.redirect(entrar);

  const response = NextResponse.redirect(entrar);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
