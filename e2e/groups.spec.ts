import { expect, test } from "@playwright/test";
import { runId } from "./run-id";

test.describe.configure({ mode: "serial" });

const name = `E2E grupo ${runId}`;
let groupPath = "";

test("criar grupo", async ({ page }) => {
  await page.goto("/grupos/novo");
  await page.getByLabel("Nome do grupo").fill(name);
  await page.getByRole("button", { name: "Criar grupo" }).click();

  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  groupPath = new URL(page.url()).pathname;
});

test("editar grupo", async ({ page }) => {
  await page.goto(`${groupPath}/editar`);
  await page.getByLabel("Nome do grupo").fill(`${name} editado`);
  await page.getByRole("button", { name: "Salvar alterações" }).click();

  await expect(page.getByRole("heading", { name: `${name} editado`, level: 1 })).toBeVisible();
});

test("membros lista o próprio usuário", async ({ page }) => {
  await page.goto(`${groupPath}/membros`);
  await expect(page.getByRole("heading", { name: "Membros", level: 1 })).toBeVisible();
  await expect(page.getByText(/\(você\)$/)).toBeVisible();
});
