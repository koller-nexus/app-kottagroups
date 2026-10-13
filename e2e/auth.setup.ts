import { expect, test as setup } from "@playwright/test";
import { AUTH_FILE } from "../playwright.config";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}

// Also covers "entrar com sucesso": a broken login fails here and blocks every logged-in test.
setup("API is up and the test user can sign in", async ({ page }) => {
  const apiOrigin = requiredEnv("API_ORIGIN");
  const email = requiredEnv("E2E_EMAIL");
  const password = requiredEnv("E2E_PASSWORD");

  const ready = await fetch(`${apiOrigin}/api/healthz`).catch(() => null);
  if (!ready?.ok) throw new Error(`API not reachable at ${apiOrigin}/api/healthz`);

  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");

  await page.context().storageState({ path: AUTH_FILE });
});
