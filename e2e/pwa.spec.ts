import { expect, test } from "./fixtures";

// Superfície PWA (specs/029-pwa-installable): estática, vale sem sessão.
test.use({ storageState: { cookies: [], origins: [] } });

test("manifest é válido", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/");
  expect(manifest.icons).toHaveLength(4);
  for (const icon of manifest.icons) {
    const image = await request.get(icon.src);
    expect(image.status(), icon.src).toBe(200);
    expect(image.headers()["content-type"], icon.src).toContain("image/png");
  }
});

test("sw.js não fica em cache e não leva nonce", async ({ request }) => {
  const response = await request.get("/sw.js");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-cache");
  expect(response.headers()["content-security-policy"] ?? "").not.toContain("nonce-");
});

test("offline.html abre fora do proxy, com seus arquivos", async ({ page, request }) => {
  const response = await page.goto("/offline.html");
  expect(response?.headers()["content-security-policy"] ?? "").not.toContain("nonce-");
  await expect(page.getByRole("heading", { level: 1, name: "Sem conexão" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tentar de novo" })).toBeVisible();
  for (const path of ["/offline.css", "/offline.js"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});

test("o aviso de instalação não aparece em /entrar nem com o evento do navegador", async ({ page }) => {
  await page.goto("/entrar");
  await page.evaluate(() => window.dispatchEvent(new Event("beforeinstallprompt")));
  await expect(page.getByRole("region", { name: "Instalar o Kotta Groups" })).toHaveCount(0);
});

test("o aviso dispensado não volta em /", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kotta:install-dismissed:v1", "1"));
  await page.goto("/");
  await page.evaluate(() => window.dispatchEvent(new Event("beforeinstallprompt")));
  await expect(page.getByRole("region", { name: "Instalar o Kotta Groups" })).toHaveCount(0);
});
