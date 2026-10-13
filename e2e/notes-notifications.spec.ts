import { expect, test } from "@playwright/test";

test("/notas mostra as notas ou o estado vazio", async ({ page }) => {
  await page.goto("/notas");
  await expect(page.getByRole("heading", { name: "Notas", level: 1 })).toBeVisible();
  const main = page.getByRole("main");
  await expect(main.getByRole("list").or(main.getByText("Nenhuma nota enviada ainda.")).first()).toBeVisible();
});

test("/notificacoes mostra as pendências ou o estado vazio", async ({ page }) => {
  await page.goto("/notificacoes");
  await expect(page.getByRole("heading", { name: "Notificações", level: 1 })).toBeVisible();
  const main = page.getByRole("main");
  await expect(main.getByRole("list").or(main.getByText("Nenhuma pendência")).first()).toBeVisible();
});
