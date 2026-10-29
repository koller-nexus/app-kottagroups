import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { getInvoiceStatuses } from "@/lib/api/kotta";
import { getSessionToken } from "@/lib/api/session";
import { parseStatusIds } from "@/lib/poll-schedule";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Status das notas em leitura, para o acompanhamento não recarregar a tela inteira.
 * Só leitura, uma chamada à API por ciclo; notas sem acesso já vêm fora da resposta dela.
 * Sessão expirada vira redirecionamento do apiRequest; o cliente então recarrega a página,
 * que segue o fluxo de sessão expirada de sempre.
 */
export async function GET(request: NextRequest) {
  const ids = parseStatusIds(request.nextUrl.searchParams.get("ids"));
  if (!ids) return NextResponse.json({ error: "Invalid ids" }, { status: 400, headers: NO_STORE });
  if (!(await getSessionToken())) {
    return NextResponse.json({ error: "Session expired" }, { status: 401, headers: NO_STORE });
  }

  try {
    const { items } = await getInvoiceStatuses(ids);
    return NextResponse.json({ items: items.map(({ id, status }) => ({ id, status })) }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503, headers: NO_STORE });
    }
    throw error;
  }
}
