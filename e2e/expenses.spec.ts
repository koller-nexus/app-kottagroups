import { expect, test } from "./fixtures";
import { runId } from "./run-id";

test.describe.configure({ mode: "serial" });

const description = `E2E despesa ${runId}`;
let expensePath = "";

test("criar despesa e ver o detalhe", async ({ page }) => {
  // No ?grupo=: the form preselects the user's first group.
  await page.goto("/despesas/nova");
  await page.getByLabel("Descrição").fill(description);
  await page.getByLabel("Valor (R$)").fill("12,34");
  await page.getByRole("button", { name: "Salvar despesa" }).click();

  // Saving returns to the group; the new expense links to its detail.
  await page.getByRole("link", { name: new RegExp(description) }).click();
  await expect(page.getByRole("heading", { name: description, level: 1 })).toBeVisible();
  await expect(page.getByText(/12,34/).first()).toBeVisible();
  expensePath = new URL(page.url()).pathname;
});

test("editar despesa", async ({ page }) => {
  await page.goto(expensePath);
  await page.getByRole("link", { name: "Editar" }).click();
  await page.getByLabel("Descrição").fill(`${description} editada`);
  await page.getByRole("button", { name: "Salvar alterações" }).click();

  await expect(page.getByRole("heading", { name: `${description} editada`, level: 1 })).toBeVisible();
});
