import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { getInvoice } from "@/lib/api/kotta";
import { getSessionToken } from "@/lib/api/session";
import { parseStatusIds } from "@/lib/poll-schedule";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Status das notas em leitura, para o acompanhamento não recarregar a tela inteira.
 * Só leitura. Sessão expirada vira redirecionamento do apiRequest; o cliente então
 * recarrega a página, que segue o fluxo de sessão expirada de sempre.
 */
export async function GET(request: NextRequest) {
  const ids = parseStatusIds(request.nextUrl.searchParams.get("ids"));
  if (!ids) return NextResponse.json({ error: "Invalid ids" }, { status: 400, headers: NO_STORE });
  if (!(await getSessionToken())) {
    return NextResponse.json({ error: "Session expired" }, { status: 401, headers: NO_STORE });
  }

  try {
    const invoices = await Promise.all(ids.map((id) => getInvoice(id).catch(skipMissing)));
    const items = invoices.flatMap((invoice) => (invoice ? [{ id: invoice.id, status: invoice.status }] : []));
    return NextResponse.json({ items }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503, headers: NO_STORE });
    }
    throw error;
  }
}

/** Nota excluída ou de outro grupo some da resposta em vez de derrubar as demais. */
function skipMissing(error: unknown): null {
  if (error instanceof ApiError && (error.status === 404 || error.status === 403)) return null;
  throw error;
}
