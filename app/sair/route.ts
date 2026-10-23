import { NextResponse, type NextRequest } from "next/server";
import { apiOrigin } from "@/lib/api/origin";
import { safeNextPath } from "@/lib/safe-next";
import { clearSessionCookies, readSessionToken } from "@/lib/session-cookie";
import { logoutDestination, type TokenCheck } from "@/lib/session-flow";

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

// Limpa a sessão só quando a API confirma que o token não vale mais. Assim um link de outro
// site para /sair não desloga ninguém; sair de propósito é o logoutAction (POST). Com a API
// fora, volta para a página de origem (ver logoutDestination).
export async function GET(request: NextRequest) {
  const motivo = request.nextUrl.searchParams.get("motivo");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const token = readSessionToken(request.cookies);

  const check = token ? await checkToken(token) : "no-token";
  const { location, clearCookie } = logoutDestination({ check, next, motivo });

  const response = NextResponse.redirect(new URL(location, request.nextUrl));
  if (clearCookie) clearSessionCookies(response.cookies);
  return response;
}
