import { test as setup } from "@playwright/test";
import { AUTH_FILE } from "../playwright.config";
import { signIn } from "./sign-in";

// Also covers "entrar com sucesso": a broken login fails here and blocks every logged-in test.
setup("API is up and the test user can sign in", async ({ page }) => {
  const apiOrigin = process.env.API_ORIGIN;
  if (!apiOrigin) throw new Error("Missing env var API_ORIGIN");

  const ready = await fetch(`${apiOrigin}/api/healthz`).catch(() => null);
  if (!ready?.ok) throw new Error(`API not reachable at ${apiOrigin}/api/healthz`);

  await signIn(page);

  await page.context().storageState({ path: AUTH_FILE });
});
