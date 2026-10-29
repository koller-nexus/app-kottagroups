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
/**
 * `"<METHOD> <path>"` responde o status e o código indicados, sem passar pela API real
 * (`PUT/DELETE /__mock/fail`). Sem `method`, vale para GET; sem `code`, `SERVICE_UNAVAILABLE`.
 */
const failures = new Map<string, { status: number; code: string }>();
/** Campos que sobrescrevem a nota do grupo devolvida pela API real (ex.: status). */
const invoiceOverrides = new Map<string, Record<string, unknown>>();
/** Cabeçalhos x-kotta-* de cada chamada a /api/v1, em ordem de chegada (`GET/DELETE /__mock/last-headers`). */
const receivedHeaders: { path: string; clientIp?: string; secret?: string }[] = [];
const INVOICE_PATH = /^\/api\/v1\/invoices\/([^/]+)$/;
const INVOICE_STATUS_PATH = "/api/v1/invoices/status";
const GROUP_INVOICES_PATH = /^\/api\/v1\/groups\/[^/]+\/invoices$/;
const INVOICE_CONTROL_PATH = /^\/__mock\/invoice\/([^/]+)$/;
const RECEIPT_PATH = /^\/api\/v1\/shopping-lists\/([^/]+)\/receipt$/;
const RETRY_PATH = /^\/api\/v1\/shopping-lists\/([^/]+)\/receipt\/retry$/;
const LIST_PATH = /^\/api\/v1\/shopping-lists\/([^/]+)$/;
const CONTROL_PATH = /^\/__mock\/receipt\/([^/]+)$/;

/** Arquivos das notas simuladas, servidos por http://localhost como a API de desenvolvimento faz. */
const MOCK_FILES: Record<string, { type: string; bytes: Buffer }> = {
  "/__mock/files/pixel.png": {
    type: "image/png",
    bytes: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    ),
  },
  // Bytes que nenhum navegador decodifica, como um TIFF.
  "/__mock/files/photo.tiff": { type: "image/tiff", bytes: Buffer.from([0, 0, 0, 0]) },
};

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

  const file = MOCK_FILES[url.pathname];
  if (file) {
    res.writeHead(200, { "content-type": file.type });
    return res.end(file.bytes);
  }

  if (url.pathname.startsWith("/api/v1/")) {
    const header = (name: string) => (typeof req.headers[name] === "string" ? req.headers[name] : undefined);
    receivedHeaders.push({ path: url.pathname, clientIp: header("x-kotta-client-ip"), secret: header("x-kotta-bff-secret") });
  }

  if (url.pathname === "/__mock/last-headers") {
    if (method === "DELETE") {
      receivedHeaders.length = 0;
      return send(res, 204, {});
    }
    return send(res, 200, { items: receivedHeaders });
  }

  if (url.pathname === "/__mock/fail") {
    if (method === "PUT") {
      const { path, status, method: failMethod = "GET", code = "SERVICE_UNAVAILABLE" } = JSON.parse(
        body.toString(),
      ) as { path: string; status: number; method?: string; code?: string };
      failures.set(`${failMethod} ${path}`, { status, code });
    } else if (method === "DELETE") {
      failures.clear();
    }
    return send(res, 204, {});
  }

  const failure = failures.get(`${method} ${url.pathname}`);
  if (failure) {
    return send(res, failure.status, { error: { code: failure.code, message: "Mock failure." } });
  }

  const invoiceControl = INVOICE_CONTROL_PATH.exec(url.pathname);
  if (invoiceControl && method === "PUT") {
    invoiceOverrides.set(invoiceControl[1], JSON.parse(body.toString()));
    return send(res, 204, {});
  }

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

  // Listas de notas (status em lote e notas do grupo) recebem o mesmo overlay, item a item.
  // Antes do overlay por nota: INVOICE_PATH também casaria o caminho do lote, com id "status".
  const isInvoiceList = url.pathname === INVOICE_STATUS_PATH || GROUP_INVOICES_PATH.test(url.pathname);
  if (method === "GET" && isInvoiceList && upstream.ok) {
    const payload = JSON.parse(text) as { data: { items: { id: string }[] } };
    const items = payload.data.items.map((item) => ({ ...item, ...invoiceOverrides.get(item.id) }));
    return send(res, upstream.status, { data: { ...payload.data, items } });
  }

  const overrideId = method === "GET" ? INVOICE_PATH.exec(url.pathname)?.[1] : undefined;
  const invoiceOverride = overrideId ? invoiceOverrides.get(overrideId) : undefined;
  if (invoiceOverride && upstream.ok) {
    const payload = JSON.parse(text) as { data: Record<string, unknown> };
    return send(res, upstream.status, { data: { ...payload.data, ...invoiceOverride } });
  }

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
