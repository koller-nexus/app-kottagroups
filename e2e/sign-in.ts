import { expect, type Page } from "@playwright/test";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}

/** Entra com o usuário de teste e espera o Painel. */
export async function signIn(page: Page): Promise<void> {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(requiredEnv("E2E_EMAIL"));
  await page.getByLabel("Senha", { exact: true }).fill(requiredEnv("E2E_PASSWORD"));
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");
}
