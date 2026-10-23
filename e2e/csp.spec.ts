import { expect, test } from "./fixtures";

declare global {
  interface Window {
    __injectedInline?: boolean;
    __injectedExternal?: boolean;
  }
}

// Telas que o resto da suíte não abre; o fixture falha o teste se houver violação de CSP.
// A 404 pública já passa por errors.spec.ts.
test.describe("telas sem sessão", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const path of [
    "/entrar",
    "/entrar?motivo=expirada",
    "/sessao-expirada",
    "/convite/token-que-nao-existe",
    "/termos",
  ]) {
    test(`${path} abre sem violação de CSP`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }

  test("script injetado sem nonce não roda", async ({ page, cspViolations }) => {
    // Responde pelo domínio externo para o teste não depender de rede.
    await page.route("https://example.com/x.js", (route) =>
      route.fulfill({ contentType: "text/javascript", body: "window.__injectedExternal = true;" }),
    );
    await page.route("**/entrar", async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        "</head>",
        '<script>window.__injectedInline = true</script><script src="https://example.com/x.js"></script></head>',
      );
      await route.fulfill({ response, body });
    });

    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill("ainda@funciona.com");

    expect(await page.evaluate(() => [window.__injectedInline, window.__injectedExternal])).toEqual([
      undefined,
      undefined,
    ]);
    await expect
      .poll(() => cspViolations.map((violation) => violation.blockedURI))
      .toEqual(expect.arrayContaining(["inline", "https://example.com/x.js"]));
    // As violações esperadas não contam como falha.
    cspViolations.length = 0;
  });
});
