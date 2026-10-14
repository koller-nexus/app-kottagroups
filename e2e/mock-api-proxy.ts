// Proxy de e2e: repassa tudo à API real e simula só a nota fiscal de listas que o teste registra.
// O Next chama a API no servidor, então `page.route` não alcança essas chamadas.
import { createServer } from "node:http";

const PORT = Number(process.env.PORT);
const UPSTREAM = (process.env.UPSTREAM_ORIGIN ?? "").replace(/\/$/, "");
if (!PORT || !UPSTREAM) throw new Error("Missing env var PORT or UPSTREAM_ORIGIN");

/** Nota como a API devolve. */
type Receipt = Record<string, unknown> & { status: string | null };
interface Scenario {
  /** Estados em sequência: [0] é o atual; o retry aceito avança para [1], que é servido uma vez antes de [2]. */
  receipts: Receipt[];
  /** Quando presente, o retry é recusado com este erro. */
  retryError?: { status: number; code: string };
  /** Marca todos os itens da lista como comprados, como um resultado anterior faria. */
  completeItems?: boolean;
  index: number;
}

const scenarios = new Map<string, Scenario>();
const RECEIPT_PATH = /^\/api\/v1\/shopping-lists\/([^/]+)\/receipt$/;
const RETRY_PATH = /^\/api\/v1\/shopping-lists\/([^/]+)\/receipt\/retry$/;
const LIST_PATH = /^\/api\/v1\/shopping-lists\/([^/]+)$/;
const CONTROL_PATH = /^\/__mock\/receipt\/([^/]+)$/;

function send(res: import("node:http").ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://mock");
  const method = req.method ?? "GET";
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const body = Buffer.concat(chunks);

  if (url.pathname === "/__mock/health") return send(res, 200, { ok: true });

  const control = CONTROL_PATH.exec(url.pathname);
  if (control && method === "PUT") {
    scenarios.set(control[1], { ...JSON.parse(body.toString()), index: 0 });
    return send(res, 204, {});
  }

  const receiptListId = RECEIPT_PATH.exec(url.pathname)?.[1];
  const retryListId = RETRY_PATH.exec(url.pathname)?.[1];
  const listId = LIST_PATH.exec(url.pathname)?.[1];

  const receiptScenario = receiptListId && method === "GET" ? scenarios.get(receiptListId) : undefined;
  if (receiptScenario) {
    const current = receiptScenario.receipts[receiptScenario.index];
    if (receiptScenario.index >= 1 && receiptScenario.index < receiptScenario.receipts.length - 1) {
      receiptScenario.index += 1;
    }
    return send(res, 200, { data: current });
  }

  const retryScenario = retryListId && method === "POST" ? scenarios.get(retryListId) : undefined;
  if (retryScenario) {
    const { retryError } = retryScenario;
    if (retryError) {
      return send(res, retryError.status, { error: { code: retryError.code, message: "Retry refused." } });
    }
    if (retryScenario.index === 0) retryScenario.index = 1;
    return send(res, 202, { data: { invoiceId: "mock-invoice", status: "queued", extractionMethod: "ocr" } });
  }

  const upstream = await fetch(`${UPSTREAM}${url.pathname}${url.search}`, {
    method,
    headers: Object.fromEntries(Object.entries(req.headers).filter(([k]) => k !== "host" && typeof req.headers[k] === "string")) as Record<string, string>,
    body: method === "GET" || method === "HEAD" ? undefined : body,
  });
  const text = await upstream.text();
  const headers = Object.fromEntries(
    [...upstream.headers].filter(([k]) => !["content-encoding", "content-length", "transfer-encoding"].includes(k)),
  );

  const listScenario = listId && method === "GET" ? scenarios.get(listId) : undefined;
  if (listScenario && upstream.ok) {
    const payload = JSON.parse(text) as { data: Record<string, unknown> & { items?: Record<string, unknown>[] } };
    const receipt = listScenario.receipts[listScenario.index];
    payload.data.receipt = {
      invoiceId: receipt.invoiceId ?? "mock-invoice",
      status: receipt.status,
      extractionMethod: receipt.extractionMethod ?? "ocr",
      file: null,
      uploadedAt: receipt.uploadedAt ?? new Date().toISOString(),
    };
    if (listScenario.completeItems) {
      payload.data.items = (payload.data.items ?? []).map((item) => ({ ...item, completed: true }));
    }
    return send(res, upstream.status, payload);
  }

  res.writeHead(upstream.status, headers);
  res.end(text);
}).listen(PORT, () => console.log(`mock api proxy on :${PORT} -> ${UPSTREAM}`));
