import { isIP } from "node:net";
import type { APIRequestContext } from "@playwright/test";
import { E2E_BFF_SECRET } from "../playwright.config";
import { expect, test } from "./fixtures";
import { MOCK_API_PORT } from "./mock-api-port";
import { signIn } from "./sign-in";

// O Next chama a API pelo servidor; o proxy de mock registra os cabeçalhos que chegam (spec 026).
const LAST_HEADERS = `http://localhost:${MOCK_API_PORT}/__mock/last-headers`;
// Chamada direta do navegador pelo rewrite de /api/v1: fora do escopo (spec 026, Edge Cases).
const BROWSER_DIRECT_PATHS = new Set(["/api/v1/users/recovery-email"]);

type Received = { path: string; clientIp?: string; secret?: string };

async function resetHeaders(request: APIRequestContext): Promise<void> {
  await request.delete(LAST_HEADERS);
}

async function lastHeaders(request: APIRequestContext): Promise<Received[]> {
  const { items } = (await (await request.get(LAST_HEADERS)).json()) as { items: Received[] };
  return items.filter((item) => !BROWSER_DIRECT_PATHS.has(item.path));
}

function expectForwarded(item: Received | undefined): void {
  expect(item, "chamada à API").toBeTruthy();
  expect(item?.secret).toBe(E2E_BFF_SECRET);
  expect(isIP(item?.clientIp ?? ""), `IP válido em ${item?.path}`).toBeGreaterThan(0);
}

test.describe("IP do navegador nas chamadas à API", () => {
  test("página logada repassa IP e segredo", async ({ page, request }) => {
    await resetHeaders(request);
    await page.goto("/");
    const items = await lastHeaders(request);
    expect(items.length).toBeGreaterThan(0);
    items.forEach(expectForwarded);
  });

  test("/sair repassa IP e segredo ao conferir o token", async ({ page, request }) => {
    await resetHeaders(request);
    await page.goto("/sair?motivo=expirada");
    expectForwarded((await lastHeaders(request)).find((item) => item.path === "/api/v1/users/me"));
  });

  test("cabeçalhos forjados pelo navegador não chegam à API", async ({ page, request }) => {
    await page.context().setExtraHTTPHeaders({ "X-Kotta-Client-IP": "203.0.113.9", "X-Kotta-Bff-Secret": "forged" });
    await resetHeaders(request);
    await page.goto("/");
    const items = await lastHeaders(request);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.clientIp).not.toBe("203.0.113.9");
      expect(item.secret).toBe(E2E_BFF_SECRET);
    }
  });

  test("o segredo não chega ao navegador", async ({ page }) => {
    const received: string[] = [];
    page.on("response", async (response) => {
      received.push(JSON.stringify(response.headers()));
      received.push(await response.text().catch(() => ""));
    });
    await page.goto("/");
    await page.goto("/grupos");
    await page.waitForLoadState("networkidle");
    expect(received.length).toBeGreaterThan(0);
    expect(received.filter((text) => text.includes(E2E_BFF_SECRET))).toEqual([]);
  });
});

test.describe("IP do navegador ao entrar", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("entrar repassa IP e segredo", async ({ page, request }) => {
    await resetHeaders(request);
    await signIn(page);
    expectForwarded((await lastHeaders(request)).find((item) => item.path === "/api/v1/auth/login"));
  });

  test("o segredo não aparece na tela de entrar", async ({ page }) => {
    const received: string[] = [];
    page.on("response", async (response) => {
      received.push(JSON.stringify(response.headers()));
      received.push(await response.text().catch(() => ""));
    });
    await page.goto("/entrar");
    await page.waitForLoadState("networkidle");
    expect(received.filter((text) => text.includes(E2E_BFF_SECRET))).toEqual([]);
  });
});
