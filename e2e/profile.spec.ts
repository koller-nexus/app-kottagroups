import { expect, test } from "@playwright/test";
import { runId } from "./run-id";

test("/perfil mostra os dados do usuário", async ({ page }) => {
  await page.goto("/perfil");
  await expect(page.getByRole("heading", { name: "Perfil", level: 1 })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Resumo da conta" }).getByText(process.env.E2E_EMAIL ?? ""),
  ).toBeVisible();
});

test("criar categoria", async ({ page }) => {
  const name = `E2E categoria ${runId}`;

  await page.goto("/perfil/categorias/nova");
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Salvar categoria" }).click();

  await expect(page).toHaveURL(/\/perfil\/categorias$/);
  await expect(page.getByText(name)).toBeVisible();
});
