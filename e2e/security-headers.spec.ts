import { contentSecurityPolicy } from "../lib/csp";
import { expect, test } from "./fixtures";
import { MOCK_API_PORT } from "./mock-api-port";

// specs/023-reaudit-run2-hardening/contracts/security-headers.md, sem a CSP.
const OTHER_HEADERS = {
  "x-frame-options": "DENY",
  "strict-transport-security": "max-age=63072000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
};

// /termos não redireciona com ou sem sessão; logado, /entrar é redirect do proxy e só leva o frame.
const PAGE = "/termos";
const NONCE = /'nonce-([A-Za-z0-9+/]+={0,2})'/;

test("página com a política completa e o nonce do HTML (024)", async ({ request }) => {
  const response = await request.get(PAGE);
  const headers = response.headers();
  for (const [name, value] of Object.entries(OTHER_HEADERS)) expect(headers[name], name).toBe(value);

  // specs/024-csp-nonce/contracts/csp-header.md; o app do e2e fala com a API pelo proxy simulado.
  const policy = headers["content-security-policy"];
  const nonce = policy.match(NONCE)?.[1] ?? "";
  expect(policy).toBe(
    contentSecurityPolicy({ nonce, apiOrigin: `http://localhost:${MOCK_API_PORT}`, isDev: false }),
  );

  const scripts = (await response.text()).match(/<script\b[^>]*>/g) ?? [];
  expect(scripts.length).toBeGreaterThan(0);
  for (const script of scripts) expect(script).toContain(`nonce="${nonce}"`);
});

test("arquivo de /public só com a proibição de frame", async ({ request }) => {
  const headers = (await request.get("/kotta-icon.png")).headers();
  expect(headers["content-security-policy"]).toBe("frame-ancestors 'none'");
  for (const [name, value] of Object.entries(OTHER_HEADERS)) expect(headers[name], name).toBe(value);
});

test("20 respostas, 20 nonces distintos", async ({ request }) => {
  const nonces = new Set<string>();
  for (let i = 0; i < 20; i++) {
    const policy = (await request.get(PAGE)).headers()["content-security-policy"];
    nonces.add(policy.match(NONCE)?.[1] ?? "");
  }
  expect(nonces.size).toBe(20);
});

// /api/v1/* fica de fora: é um proxy externo, e o Next devolve só os cabeçalhos da API, que
// variam com o ambiente dela (em dev ela não manda HSTS). Esses são responsabilidade da API.
