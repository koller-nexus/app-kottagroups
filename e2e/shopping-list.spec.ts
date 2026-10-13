import { expect, test } from "@playwright/test";
import { runId } from "./run-id";

test("criar lista, adicionar item e marcar como comprado", async ({ page }) => {
  const item = `E2E item ${runId}`;

  // Any of the user's groups works; the list is created by this test.
  await page.goto("/grupos");
  await page.getByRole("main").getByRole("listitem").getByRole("link").first().click();
  await page.getByLabel("Nova lista").fill(`E2E lista ${runId}`);
  await page.getByRole("button", { name: "Criar lista" }).click();
  await expect(page).toHaveURL(/\/listas\//);

  await page.getByLabel("Item", { exact: true }).fill(item);
  await page.getByRole("button", { name: "Adicionar item" }).click();

  await page.getByRole("checkbox", { name: `${item}, pendente` }).click();
  await expect(page.getByRole("checkbox", { name: `${item}, comprado` })).toBeChecked();
});
