import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/api/session";

// Usado quando a API recusa o token (expirado ou inválido): apaga o cookie e
// volta para a tela de entrar.
export function GET(request: NextRequest) {
  const url = new URL("/entrar", request.nextUrl);
  if (request.nextUrl.searchParams.get("motivo") === "expirada") {
    url.searchParams.set("motivo", "expirada");
  }
  const response = NextResponse.redirect(url);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
