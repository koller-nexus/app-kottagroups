import { expect, test } from "./fixtures";

const PREVIEW_NOTE = "Dados de exemplo. Entre para ver os seus.";

test.describe("sem sessão", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/ mostra a prévia com dados de exemplo", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(PREVIEW_NOTE)).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();
  });
});

test("/ com sessão mostra o painel do usuário", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /^Olá, / })).toBeVisible();
  await expect(page.getByText(PREVIEW_NOTE)).toHaveCount(0);
});
