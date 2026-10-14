import path from "node:path";
import { expect, test } from "@playwright/test";
import { runId } from "./run-id";

const RECEIPT = path.join(__dirname, "..", "tests", "fixtures", "receipts", "sem-qr.jpg");

test("/notas antigo leva aos grupos e saiu do menu", async ({ page }) => {
  await page.goto("/notas");
  await expect(page).toHaveURL(/\/grupos$/);
  await page.goto("/notas/qualquer-id");
  await expect(page).toHaveURL(/\/grupos$/);
  await expect(page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Notas" })).toHaveCount(0);
});

test.describe("notas do grupo", () => {
  test.describe.configure({ mode: "serial" });

  const description = `E2E nota ${runId}`;
  let expensePath = "";
  let notePath = "";

  test("enviar nota a partir da despesa já vincula", async ({ page }) => {
    await page.goto("/despesas/nova");
    await page.getByLabel("Descrição").fill(description);
    await page.getByLabel("Valor (R$)").fill("10,00");
    await page.getByRole("button", { name: "Salvar despesa" }).click();
    await page.getByRole("link", { name: new RegExp(description) }).click();
    await expect(page.getByRole("heading", { name: description, level: 1 })).toBeVisible();
    expensePath = new URL(page.url()).pathname;

    await page.getByLabel("Foto da nota").setInputFiles(RECEIPT);
    await page.getByRole("button", { name: "Enviar nota" }).click();

    await expect(page).toHaveURL(/\/grupos\/[^/]+\/notas\/[^/]+$/);
    notePath = new URL(page.url()).pathname;
    await expect(page.getByRole("link", { name: description })).toBeVisible();
  });

  test("desvincular e vincular de novo pela nota", async ({ page }) => {
    await page.goto(notePath);
    await page.getByRole("button", { name: "Desvincular" }).click();
    await expect(page.getByText("Esta nota ainda não comprova nenhuma despesa.")).toBeVisible();

    const select = page.getByLabel("Vincular a uma despesa");
    const value = await select.locator("option", { hasText: description }).getAttribute("value");
    await select.selectOption(value ?? "");
    await page.getByRole("button", { name: "Vincular" }).click();
    await expect(page.getByRole("link", { name: description })).toBeVisible();

    await page.goto(expensePath);
    await expect(page.getByRole("link", { name: "Ver a nota" })).toHaveAttribute("href", notePath);
  });

  test("a nota aparece nas notas do grupo", async ({ page }) => {
    const groupNotes = notePath.replace(/\/[^/]+$/, "");
    await page.goto(groupNotes);
    await expect(page.getByRole("heading", { name: "Notas", level: 1 })).toBeVisible();
    await expect(page.locator(`a[href="${notePath}"]`)).toBeVisible();
  });
});

test("/notificacoes mostra as pendências ou o estado vazio", async ({ page }) => {
  await page.goto("/notificacoes");
  await expect(page.getByRole("heading", { name: "Notificações", level: 1 })).toBeVisible();
  const main = page.getByRole("main");
  await expect(main.getByRole("list").or(main.getByText("Nenhuma pendência")).first()).toBeVisible();
});
